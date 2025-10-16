from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.database import get_db
from app.api.v1.models.route_models import Route, RouteWaypoint
from app.api.v1.schemas.routing_schemas import (
    CoordinatesSchema,
    ErrorResponseSchema,
    PlaceSearchRequestSchema,
    PlaceSearchResponseSchema,
    RouteRequestSchema,
    RouteResponseSchema,
    SuccessResponseSchema,
    TrafficRequestSchema,
    TrafficResponseSchema,
)
from app.api.v1.services.route_service import route_service
from app.api.v1.services.tomtom_service import (
    Coordinates,
    RouteOptions,
    tomtom_service,
)

router = APIRouter(prefix="/routes", tags=["routing"])


def convert_route_to_json_serializable(route):
    """
    Convert RouteResponse Pydantic model to JSON-serializable dictionary.
    Handles datetime objects by converting them to ISO format strings.
    """
    if hasattr(route, "model_dump"):
        # Pydantic v2
        route_dict = route.model_dump()
    elif hasattr(route, "dict"):
        # Pydantic v1
        route_dict = route.dict()
    else:
        # Already a dict
        return route

    # Convert datetime objects to strings
    if "created_at" in route_dict and isinstance(
        route_dict["created_at"], datetime
    ):
        route_dict["created_at"] = route_dict["created_at"].isoformat()

    # Recursively handle nested objects
    for key, value in route_dict.items():
        if isinstance(value, datetime):
            route_dict[key] = value.isoformat()
        elif isinstance(value, list):
            route_dict[key] = [
                item.isoformat() if isinstance(item, datetime) else item
                for item in value
            ]

    return route_dict


@router.post(
    "/calculate",
    response_model=RouteResponseSchema,
    responses={
        400: {"model": ErrorResponseSchema},
        503: {"model": ErrorResponseSchema},
        500: {"model": ErrorResponseSchema},
    },
    summary="Calculate Route",
    description=(
        "Calculate the optimal route between two points using TomTom API"
    ),
)
async def calculate_route(
    route_request: RouteRequestSchema, db: Session = Depends(get_db)
):
    """
    Calculate a route between origin and destination with optional waypoints.

    - **origin**: Starting point coordinates (lat, lng)
    - **destination**: End point coordinates (lat, lng)
    - **waypoints**: Optional intermediate points
    - **options**: Route calculation preferences
    (fastest/shortest/eco, avoid tolls, etc.)
    - **user_id**: Optional user ID to associate route with user
    """
    try:
        # Convert schema to service models
        origin = Coordinates(
            lat=route_request.origin.lat,
            lng=route_request.origin.lng,
        )
        destination = Coordinates(
            lat=route_request.destination.lat,
            lng=route_request.destination.lng,
        )

        waypoints = None
        if route_request.waypoints:
            waypoints = [
                Coordinates(lat=wp.lat, lng=wp.lng)
                for wp in route_request.waypoints
            ]

        options = None
        if route_request.options:
            options = RouteOptions(
                route_type=route_request.options.route_type,
                avoid_tolls=route_request.options.avoid_tolls,
                avoid_highways=route_request.options.avoid_highways,
                avoid_ferries=route_request.options.avoid_ferries,
                avoid_unpaved=route_request.options.avoid_unpaved,
                vehicle_type=route_request.options.vehicle_type,
            )

        # Calculate route using TomTom service
        route = await tomtom_service.calculate_route(
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            options=options,
        )

        # Save route to database
        try:
            # Convert RouteResponse object to JSON-serializable dict
            route_dict = convert_route_to_json_serializable(route)

            db_route = Route(
                route_id=route.route_id,
                user_id=route_request.user_id,
                origin_lat=route_request.origin.lat,
                origin_lng=route_request.origin.lng,
                destination_lat=route_request.destination.lat,
                destination_lng=route_request.destination.lng,
                total_distance=route.total_distance,
                total_duration=route.total_duration,
                polyline=route.polyline,
                route_type=route_request.options.route_type
                if route_request.options
                else "fastest",
                vehicle_type=route_request.options.vehicle_type
                if route_request.options
                else "car",
                avoid_tolls=1
                if route_request.options and route_request.options.avoid_tolls
                else 0,
                avoid_highways=1
                if route_request.options
                and route_request.options.avoid_highways
                else 0,
                avoid_ferries=1
                if route_request.options and route_request.options.avoid_ferries
                else 0,
                avoid_unpaved=1
                if route_request.options and route_request.options.avoid_unpaved
                else 0,
                route_data=route_dict,
                status="active",
            )

            db.add(db_route)
            db.commit()
            db.refresh(db_route)

            # Save waypoints if any
            if route_request.waypoints and db_route.id:
                for idx, waypoint in enumerate(route_request.waypoints):
                    db_waypoint = RouteWaypoint(
                        route_id=db_route.id,
                        lat=waypoint.lat,
                        lng=waypoint.lng,
                        sequence=idx,
                    )
                    db.add(db_waypoint)
                db.commit()

        except Exception:
            db.rollback()
            import traceback

            traceback.print_exc()
            # Continue and return the route even if database save fails

        return route

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate route: {str(e)}",
        )


@router.post(
    "/traffic",
    response_model=TrafficResponseSchema,
    responses={
        400: {"model": ErrorResponseSchema},
        503: {"model": ErrorResponseSchema},
    },
    summary="Get Traffic Information",
    description="Get real-time traffic information for a specific location",
)
async def get_traffic_info(traffic_request: TrafficRequestSchema):
    """
    Get traffic flow data for a specific location.

    - **coordinates**: Location coordinates (lat, lng)
    - **zoom_level**: Map zoom level for traffic data granularity
    """
    try:
        coordinates = Coordinates(
            lat=traffic_request.coordinates.lat,
            lng=traffic_request.coordinates.lng,
        )

        traffic_data = await tomtom_service.get_traffic_info(
            coordinates=coordinates, zoom_level=traffic_request.zoom_level
        )

        return TrafficResponseSchema(
            traffic_data=traffic_data,
            coordinates=traffic_request.coordinates,
            timestamp=datetime.now(),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get traffic info: {str(e)}",
        )


@router.post(
    "/search",
    response_model=PlaceSearchResponseSchema,
    responses={
        400: {"model": ErrorResponseSchema},
        503: {"model": ErrorResponseSchema},
    },
    summary="Search Places",
    description="Search for places, addresses, or points of interest",
)
async def search_places(search_request: PlaceSearchRequestSchema):
    """
    Search for places using TomTom Search API.

    - **query**: Search term (address, place name, POI category)
    - **coordinates**: Optional center point for proximity search
    - **radius**: Search radius in meters (default: 10km)
    """
    try:
        coordinates = None
        if search_request.coordinates:
            coordinates = Coordinates(
                lat=search_request.coordinates.lat,
                lng=search_request.coordinates.lng,
            )

        results = await tomtom_service.search_places(
            query=search_request.query,
            coordinates=coordinates,
            radius=search_request.radius,
        )

        # Convert TomTom results to our schema format
        place_results = []
        for result in results:
            place_result = {
                "name": result.get("poi", {}).get(
                    "name", result.get("address", {}).get("freeformAddress", "")
                ),
                "address": result.get("address", {}).get("freeformAddress", ""),
                "coordinates": CoordinatesSchema(
                    lat=result.get("position", {}).get("lat", 0),
                    lng=result.get("position", {}).get("lon", 0),
                ),
                "category": result.get("poi", {}).get("categories", [""])[0]
                if result.get("poi", {}).get("categories")
                else None,
                "distance": result.get("dist", None),
            }
            place_results.append(place_result)

        return PlaceSearchResponseSchema(
            results=place_results,
            query=search_request.query,
            total_results=len(place_results),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search places: {str(e)}",
        )


@router.get(
    "/health",
    response_model=SuccessResponseSchema,
    summary="Health Check",
    description=(
        "Check if the routing service is healthy and TomTom API is accessible"
    ),
)
async def health_check():
    """
    Health check endpoint for the routing service.
    """
    try:
        # Simple health check - you could extend this to ping TomTom API
        return SuccessResponseSchema(
            message="Routing service is healthy",
            data={
                "service": "routing_service",
                "provider": "TomTom",
                "status": "operational",
                "timestamp": datetime.now().isoformat(),
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}",
        )


@router.get(
    "/route-types",
    response_model=SuccessResponseSchema,
    summary="Get Available Route Types",
    description="Get list of available route optimization types",
)
async def get_route_types():
    """
    Get available route calculation types and options.
    """
    return SuccessResponseSchema(
        message="Available route types",
        data={
            "route_types": ["fastest", "shortest", "eco"],
            "vehicle_types": [
                "car",
                "truck",
                "taxi",
                "bus",
                "van",
                "motorcycle",
                "bicycle",
                "pedestrian",
            ],
            "avoidance_options": [
                "tolls",
                "highways",
                "ferries",
                "unpaved_roads",
            ],
        },
    )


@router.post(
    "/test-route",
    summary="Test Route Calculation",
    description="Test TomTom API with minimal parameters for debugging",
)
async def test_route_calculation(route_request: RouteRequestSchema):
    """
    Test route calculation with minimal
    parameters for debugging TomTom API issues.
    """
    try:
        # Convert schema to service models
        origin = Coordinates(
            lat=route_request.origin.lat, lng=route_request.origin.lng
        )
        destination = Coordinates(
            lat=route_request.destination.lat, lng=route_request.destination.lng
        )

        # Test with simple route
        result = await tomtom_service.test_simple_route(
            origin=origin, destination=destination
        )

        return result

    except Exception as e:
        return {
            "status": "error",
            "error": f"Exception in test endpoint: {str(e)}",
        }


@router.post(
    "/calculate-enhanced",
    response_model=RouteResponseSchema,
    responses={
        400: {"model": ErrorResponseSchema},
        503: {"model": ErrorResponseSchema},
        500: {"model": ErrorResponseSchema},
    },
    summary="Calculate Enhanced Route",
    description=(
        "Calculate route with enhanced path details and traffic information"
    ),
)
async def calculate_enhanced_route(
    route_request: RouteRequestSchema, db: Session = Depends(get_db)
):
    """
    Calculate a route with enhanced details including:
    - Detailed path coordinates
    - Traffic information
    - More comprehensive instructions

    This endpoint provides more detailed route information optimized
    for navigation.
    """
    try:
        # Convert schema to service models
        origin = Coordinates(
            lat=route_request.origin.lat,
            lng=route_request.origin.lng,
        )
        destination = Coordinates(
            lat=route_request.destination.lat,
            lng=route_request.destination.lng,
        )

        waypoints = None
        if route_request.waypoints:
            waypoints = [
                Coordinates(lat=wp.lat, lng=wp.lng)
                for wp in route_request.waypoints
            ]

        options = RouteOptions(
            route_type=route_request.options.route_type
            if route_request.options
            else "fastest",
            avoid_tolls=route_request.options.avoid_tolls
            if route_request.options
            else False,
            avoid_highways=route_request.options.avoid_highways
            if route_request.options
            else False,
            avoid_ferries=route_request.options.avoid_ferries
            if route_request.options
            else False,
            avoid_unpaved=route_request.options.avoid_unpaved
            if route_request.options
            else False,
            vehicle_type=route_request.options.vehicle_type
            if route_request.options
            else "car",
        )

        # Calculate route using TomTom service with enhanced parameters
        route = await tomtom_service.calculate_route(
            origin=origin,
            destination=destination,
            waypoints=waypoints,
            options=options,
        )

        # Save route to database
        try:
            # Convert RouteResponse object to JSON-serializable dict
            route_dict = convert_route_to_json_serializable(route)

            db_route = Route(
                route_id=route.route_id,
                user_id=route_request.user_id,
                origin_lat=route_request.origin.lat,
                origin_lng=route_request.origin.lng,
                destination_lat=route_request.destination.lat,
                destination_lng=route_request.destination.lng,
                total_distance=route.total_distance,
                total_duration=route.total_duration,
                polyline=route.polyline,
                route_type=route_request.options.route_type
                if route_request.options
                else "fastest",
                vehicle_type=route_request.options.vehicle_type
                if route_request.options
                else "car",
                avoid_tolls=1
                if route_request.options and route_request.options.avoid_tolls
                else 0,
                avoid_highways=1
                if route_request.options
                and route_request.options.avoid_highways
                else 0,
                avoid_ferries=1
                if route_request.options and route_request.options.avoid_ferries
                else 0,
                avoid_unpaved=1
                if route_request.options and route_request.options.avoid_unpaved
                else 0,
                route_data=route_dict,
                status="active",
            )
            db.add(db_route)
            db.commit()
            db.refresh(db_route)

            # Save waypoints if any
            if route_request.waypoints:
                for idx, waypoint in enumerate(route_request.waypoints):
                    db_waypoint = RouteWaypoint(
                        route_id=db_route.id,
                        lat=waypoint.lat,
                        lng=waypoint.lng,
                        sequence=idx,
                    )
                    db.add(db_waypoint)
                db.commit()
        except Exception:
            db.rollback()
            import traceback

            traceback.print_exc()
            # Continue even if DB save fails

        # Enhance the route with additional information
        # You could add traffic data here in the future
        return route

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate enhanced route: {str(e)}",
        )


@router.get(
    "/user/{user_id}",
    summary="Get User Routes",
    description="Get all routes for a specific user",
)
async def get_user_routes(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    status: str = None,
    db: Session = Depends(get_db),
):
    """
    Get all routes for a specific user with pagination.

    - **user_id**: User ID
    - **limit**: Maximum number of routes to return (default: 50)
    - **offset**: Number of routes to skip (default: 0)
    - **status**: Filter by route status (active, completed, cancelled)
    """
    try:
        routes = route_service.get_routes_by_user(
            db=db, user_id=user_id, limit=limit, offset=offset, status=status
        )

        route_list = []
        for route in routes:
            route_data = {
                "route_id": route.route_id,
                "origin": {"lat": route.origin_lat, "lng": route.origin_lng},
                "destination": {
                    "lat": route.destination_lat,
                    "lng": route.destination_lng,
                },
                "total_distance": route.total_distance,
                "total_duration": route.total_duration,
                "route_type": route.route_type,
                "vehicle_type": route.vehicle_type,
                "status": route.status,
                "created_at": route.created_at.isoformat(),
            }

            # Add waypoints if any
            waypoints = route_service.get_route_waypoints(db, route.id)
            if waypoints:
                route_data["waypoints"] = [
                    {"lat": wp.lat, "lng": wp.lng, "sequence": wp.sequence}
                    for wp in waypoints
                ]

            route_list.append(route_data)

        return {
            "user_id": user_id,
            "total_routes": len(route_list),
            "routes": route_list,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user routes: {str(e)}",
        )


@router.get(
    "/recent",
    summary="Get Recent Routes",
    description="Get recent routes, optionally filtered by user",
)
async def get_recent_routes(
    limit: int = 10, user_id: int = None, db: Session = Depends(get_db)
):
    """
    Get recent routes.

    - **limit**: Maximum number of routes to return (default: 10)
    - **user_id**: Optional user ID filter
    """
    try:
        routes = route_service.get_recent_routes(
            db=db, limit=limit, user_id=user_id
        )

        route_list = []
        for route in routes:
            route_data = {
                "route_id": route.route_id,
                "user_id": route.user_id,
                "origin": {"lat": route.origin_lat, "lng": route.origin_lng},
                "destination": {
                    "lat": route.destination_lat,
                    "lng": route.destination_lng,
                },
                "total_distance": route.total_distance,
                "total_duration": route.total_duration,
                "status": route.status,
                "created_at": route.created_at.isoformat(),
            }
            route_list.append(route_data)

        return {"total_routes": len(route_list), "routes": route_list}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve recent routes: {str(e)}",
        )


@router.get(
    "/{route_id}",
    summary="Get Route Details",
    description="Get detailed information about a specific route",
)
async def get_route_details(route_id: str, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific route.

    - **route_id**: Route ID
    """
    try:
        route = route_service.get_route_by_id(db=db, route_id=route_id)

        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
            )

        route_data = {
            "route_id": route.route_id,
            "user_id": route.user_id,
            "origin": {"lat": route.origin_lat, "lng": route.origin_lng},
            "destination": {
                "lat": route.destination_lat,
                "lng": route.destination_lng,
            },
            "total_distance": route.total_distance,
            "total_duration": route.total_duration,
            "polyline": route.polyline,
            "route_type": route.route_type,
            "vehicle_type": route.vehicle_type,
            "options": {
                "avoid_tolls": bool(route.avoid_tolls),
                "avoid_highways": bool(route.avoid_highways),
                "avoid_ferries": bool(route.avoid_ferries),
                "avoid_unpaved": bool(route.avoid_unpaved),
            },
            "status": route.status,
            "created_at": route.created_at.isoformat(),
            "full_route_data": route.route_data,
        }

        # Add waypoints if any
        waypoints = route_service.get_route_waypoints(db, route.id)
        if waypoints:
            route_data["waypoints"] = [
                {
                    "lat": wp.lat,
                    "lng": wp.lng,
                    "sequence": wp.sequence,
                    "name": wp.name,
                    "address": wp.address,
                }
                for wp in waypoints
            ]

        return route_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve route: {str(e)}",
        )


@router.patch(
    "/{route_id}/status",
    summary="Update Route Status",
    description="Update the status of a route",
)
async def update_route_status(
    route_id: str, new_status: str, db: Session = Depends(get_db)
):
    """
    Update route status (active, completed, cancelled).

    - **route_id**: Route ID
    - **new_status**: New status (active, completed, cancelled)
    """
    try:
        if new_status not in ["active", "completed", "cancelled"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be: active,completed,or cancelled",
            )

        route = route_service.update_route_status(
            db=db, route_id=route_id, status=new_status
        )

        if not route:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
            )

        return {
            "message": "Route status updated successfully",
            "route_id": route.route_id,
            "status": route.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update route status: {str(e)}",
        )


@router.delete(
    "/{route_id}",
    summary="Delete Route",
    description="Delete a route from the database",
)
async def delete_route(route_id: str, db: Session = Depends(get_db)):
    """
    Delete a route.

    - **route_id**: Route ID to delete
    """
    try:
        deleted = route_service.delete_route(db=db, route_id=route_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
            )

        return {"message": "Route deleted successfully", "route_id": route_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete route: {str(e)}",
        )
