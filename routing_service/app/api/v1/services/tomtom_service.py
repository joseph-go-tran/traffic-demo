from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from dotenv import dotenv_values
from fastapi import HTTPException, status
from pydantic import BaseModel

config = dotenv_values(".env")


class Coordinates(BaseModel):
    lat: float
    lng: float


class RouteOptions(BaseModel):
    route_type: str = "fastest"  # fastest, shortest, eco
    avoid_tolls: bool = False
    avoid_highways: bool = False
    avoid_ferries: bool = False
    avoid_unpaved: bool = False
    vehicle_type: str = (
        "car"  # car, truck, taxi, bus, van, motorcycle, bicycle, pedestrian
    )


class RoutePoint(BaseModel):
    coordinates: Coordinates
    address: Optional[str] = None


class RouteInstruction(BaseModel):
    instruction: str
    distance: int  # meters
    duration: int  # seconds
    coordinates: Coordinates


class RouteSegment(BaseModel):
    start_point: Coordinates
    end_point: Coordinates
    distance: int  # meters
    duration: int  # seconds
    instructions: List[RouteInstruction]


class RouteResponse(BaseModel):
    route_id: str
    total_distance: int  # meters
    total_duration: int  # seconds
    segments: List[RouteSegment]
    polyline: str
    summary: Dict[str, Any]
    created_at: datetime


class TomTomService:
    def __init__(self):
        self.api_key = config.get("TOMTOM_API_KEY")
        self.base_url = "https://api.tomtom.com"

        if not self.api_key:
            raise ValueError("TOMTOM_API_KEY environment variable is required")

    async def calculate_route(
        self,
        origin: Coordinates,
        destination: Coordinates,
        waypoints: Optional[List[Coordinates]] = None,
        options: Optional[RouteOptions] = None,
    ) -> RouteResponse:
        """
        Calculate route using TomTom Routing API
        """
        if options is None:
            options = RouteOptions()

        try:
            # Build the locations string properly for TomTom API
            locations = (
                f"{origin.lat},{origin.lng}:{destination.lat},{destination.lng}"
            )

            # Add waypoints if provided
            if waypoints:
                waypoint_str = ":".join(
                    [f"{wp.lat},{wp.lng}" for wp in waypoints]
                )
                locations = (
                    f"{origin.lat},{origin.lng}:"
                    f"{waypoint_str}:"
                    f"{destination.lat},{destination.lng}"
                )

            # Build query parameters according to TomTom API documentation
            params = {
                "key": self.api_key,
                "travelMode": self._get_travel_mode(options.vehicle_type),
                "routeType": self._get_route_type(options.route_type),
                "traffic": "true",
                "instructionsType": "text",
                "language": "en-US",
                "computeBestOrder": "false",
                "routeRepresentation": "polyline",
            }

            # Add avoidance parameters
            avoid_list = []
            if options.avoid_tolls:
                avoid_list.append("tollRoads")
            if options.avoid_highways:
                avoid_list.append("motorways")
            if options.avoid_ferries:
                avoid_list.append("ferries")
            if options.avoid_unpaved:
                avoid_list.append("unpavedRoads")

            if avoid_list:
                params["avoid"] = ",".join(avoid_list)

            # Correct TomTom API URL format
            url = f"{self.base_url}/routing/1/calculateRoute/{locations}/json"

            print(f"TomTom API URL: {url}")
            print(f"TomTom API Params: {params}")

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)

                # Debug: Print response details for 400 errors
                if response.status_code == 400:
                    print(f"TomTom API 400 Error Response: {response.text}")

                response.raise_for_status()
                data = response.json()

                # Parse TomTom response
                return self._parse_tomtom_response(data)

        except httpx.HTTPStatusError as e:
            error_detail = f"TomTom API error: {e.response.status_code}"
            if e.response.status_code == 400:
                try:
                    error_data = e.response.json()
                    error_detail += f" - {error_data}"
                except:
                    error_detail += f" - {e.response.text}"

            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_detail,
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Network error when calling TomTom API: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error processing route: {str(e)}",
            )

    async def get_traffic_info(
        self, coordinates: Coordinates, zoom_level: int = 10
    ) -> Dict[str, Any]:
        """
        Get traffic information for a specific location
        """
        try:
            params = {
                "key": self.api_key,
                "bbox": self._calculate_bbox(coordinates, zoom_level),
                "width": 512,
                "height": 512,
                "format": "json",
            }

            url = f"{self.base_url}/traffic/services/4/flowSegmentData"

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()

                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"TomTom Traffic API error: {e.response.status_code}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error getting traffic info: {str(e)}",
            )

    async def search_places(
        self,
        query: str,
        coordinates: Optional[Coordinates] = None,
        radius: int = 10000,  # meters
    ) -> List[Dict[str, Any]]:
        """
        Search for places using TomTom Search API
        """
        try:
            params = {
                "key": self.api_key,
                "query": query,
                "limit": 20,
                "radius": radius,
            }

            if coordinates:
                params["lat"] = coordinates.lat
                params["lon"] = coordinates.lng

            url = f"{self.base_url}/search/2/search/{query}.json"

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)
                response.raise_for_status()

                data = response.json()
                return data.get("results", [])

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"TomTom Search API error: {e.response.status_code}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error searching places: {str(e)}",
            )

    async def test_simple_route(
        self, origin: Coordinates, destination: Coordinates
    ) -> Dict[str, Any]:
        """
        Test simple route calculation with minimal parameters
        """
        try:
            # Validate coordinates
            if not (-90 <= origin.lat <= 90) or not (-180 <= origin.lng <= 180):
                raise ValueError(
                    f"Invalid origin coordinates: {origin.lat}, {origin.lng}"
                )
            if not (-90 <= destination.lat <= 90) or not (
                -180 <= destination.lng <= 180
            ):
                raise ValueError(
                    f"Invalid destination coordinates: "
                    f"{destination.lat}, {destination.lng}"
                )

            # Build the locations string
            locations = (
                f"{origin.lat},{origin.lng}:{destination.lat},{destination.lng}"
            )

            # Minimal parameters for testing
            params = {
                "key": self.api_key,
            }

            # Simple TomTom API URL format
            url = f"{self.base_url}/routing/1/calculateRoute/{locations}/json"

            print(f"Test TomTom API URL: {url}")
            print(f"Test TomTom API Params: {params}")

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=30.0)

                print(f"Response Status: {response.status_code}")
                print(f"Response Headers: {dict(response.headers)}")

                if response.status_code != 200:
                    print(f"Error Response: {response.text}")

                response.raise_for_status()
                data = response.json()

                return {
                    "status": "success",
                    "data": data,
                    "url": url,
                    "params": params,
                }

        except httpx.HTTPStatusError as e:
            error_detail = f"TomTom API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_detail += f" - {error_data}"
            except:
                error_detail += f" - {e.response.text}"

            return {
                "status": "error",
                "error": error_detail,
                "url": url if "url" in locals() else None,
                "params": params if "params" in locals() else None,
            }
        except Exception as e:
            return {
                "status": "error",
                "error": f"Exception: {str(e)}",
                "url": url if "url" in locals() else None,
                "params": params if "params" in locals() else None,
            }

    def _get_travel_mode(self, vehicle_type: str) -> str:
        """Convert vehicle type to TomTom travel mode"""
        mapping = {
            "car": "car",
            "truck": "truck",
            "taxi": "taxi",
            "bus": "bus",
            "van": "van",
            "motorcycle": "motorcycle",
            "bicycle": "bicycle",
            "pedestrian": "pedestrian",
        }
        return mapping.get(vehicle_type, "car")

    def _get_route_type(self, route_type: str) -> str:
        """Convert route type to TomTom route type"""
        mapping = {"fastest": "fastest", "shortest": "shortest", "eco": "eco"}
        return mapping.get(route_type, "fastest")

    def _parse_tomtom_response(self, data: Dict[str, Any]) -> RouteResponse:
        """Parse TomTom API response into our RouteResponse model"""
        routes = data.get("routes", [])
        if not routes:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="No route found"
            )

        route = routes[0]  # Take the first route
        summary = route.get("summary", {})
        legs = route.get("legs", [])

        # Parse segments
        segments = []
        all_points = []  # Collect all points for complete polyline

        for leg_idx, leg in enumerate(legs):
            leg_summary = leg.get("summary", {})
            points = leg.get("points", [])

            # Collect all points for the complete route polyline
            all_points.extend(points)

            if len(points) >= 2:
                start_point = Coordinates(
                    lat=points[0].get("latitude", 0),
                    lng=points[0].get("longitude", 0),
                )
                end_point = Coordinates(
                    lat=points[-1].get("latitude", 0),
                    lng=points[-1].get("longitude", 0),
                )

                # Parse instructions with better coordinate handling
                instructions = []
                guidance_instructions = leg.get("guidance", {}).get(
                    "instructions", []
                )

                for idx, guidance in enumerate(guidance_instructions):
                    instruction_point = guidance.get("point", {})
                    if instruction_point:
                        instruction_coords = Coordinates(
                            lat=instruction_point.get("latitude", 0),
                            lng=instruction_point.get("longitude", 0),
                        )
                    else:
                        # Fallback: use points along the route
                        point_idx = min(idx, len(points) - 1)
                        instruction_coords = Coordinates(
                            lat=points[point_idx].get("latitude", 0),
                            lng=points[point_idx].get("longitude", 0),
                        )

                    instruction = RouteInstruction(
                        instruction=guidance.get(
                            "message", "Continue straight"
                        ),
                        distance=guidance.get("routeOffsetInMeters", 0),
                        duration=guidance.get("travelTimeInSeconds", 0),
                        coordinates=instruction_coords,
                    )
                    instructions.append(instruction)

                # If no instructions, create basic ones from points
                if not instructions and len(points) > 1:
                    instructions = [
                        RouteInstruction(
                            instruction="Start your journey",
                            distance=0,
                            duration=0,
                            coordinates=start_point,
                        ),
                        RouteInstruction(
                            instruction="Arrive at destination",
                            distance=leg_summary.get("lengthInMeters", 0),
                            duration=leg_summary.get("travelTimeInSeconds", 0),
                            coordinates=end_point,
                        ),
                    ]

                segment = RouteSegment(
                    start_point=start_point,
                    end_point=end_point,
                    distance=leg_summary.get("lengthInMeters", 0),
                    duration=leg_summary.get("travelTimeInSeconds", 0),
                    instructions=instructions,
                )
                segments.append(segment)

        # Create comprehensive polyline from all points
        polyline = ""
        if all_points:
            # Format as lat,lng pairs separated by spaces for easier parsing
            coordinate_pairs = []
            for point in all_points:
                lat = point.get("latitude", 0)
                lng = point.get("longitude", 0)
                if lat != 0 and lng != 0:  # Only include valid coordinates
                    coordinate_pairs.append(f"{lat},{lng}")
            polyline = " ".join(coordinate_pairs)

        return RouteResponse(
            route_id=f"tomtom_{datetime.now().timestamp()}",
            total_distance=summary.get("lengthInMeters", 0),
            total_duration=summary.get("travelTimeInSeconds", 0),
            segments=segments,
            polyline=polyline,
            summary=summary,
            created_at=datetime.now(),
        )

    def _calculate_bbox(self, coordinates: Coordinates, zoom_level: int) -> str:
        """Calculate bounding box for traffic API"""
        offset = 0.01 * (15 - zoom_level)  # Rough approximation

        min_lat = coordinates.lat - offset
        min_lng = coordinates.lng - offset
        max_lat = coordinates.lat + offset
        max_lng = coordinates.lng + offset

        return f"{min_lng},{min_lat},{max_lng},{max_lat}"


# Global instance
tomtom_service = TomTomService()
