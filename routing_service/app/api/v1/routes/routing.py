from datetime import datetime

from fastapi import APIRouter, HTTPException, status

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
from app.api.v1.services.tomtom_service import (
    Coordinates,
    RouteOptions,
    tomtom_service,
)

router = APIRouter(prefix="/routes", tags=["routing"])


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
async def calculate_route(route_request: RouteRequestSchema):
    """
    Calculate a route between origin and destination with optional waypoints.

    - **origin**: Starting point coordinates (lat, lng)
    - **destination**: End point coordinates (lat, lng)
    - **waypoints**: Optional intermediate points
    - **options**: Route calculation preferences
    (fastest/shortest/eco, avoid tolls, etc.)
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

        return route

    except HTTPException:
        raise
    except Exception as e:
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
async def calculate_enhanced_route(route_request: RouteRequestSchema):
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

        # Enhance the route with additional information
        # You could add traffic data here in the future
        return route

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate enhanced route: {str(e)}",
        )
