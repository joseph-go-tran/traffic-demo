from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CoordinatesSchema(BaseModel):
    lat: float = Field(..., description="Latitude", ge=-90, le=90)
    lng: float = Field(..., description="Longitude", ge=-180, le=180)


class RouteOptionsSchema(BaseModel):
    route_type: str = Field(
        "fastest",
        description="Route optimization type",
        pattern="^(fastest|shortest|eco)$",
    )
    avoid_tolls: bool = Field(False, description="Avoid toll roads")
    avoid_highways: bool = Field(False, description="Avoid highways/motorways")
    avoid_ferries: bool = Field(False, description="Avoid ferries")
    avoid_unpaved: bool = Field(False, description="Avoid unpaved roads")
    vehicle_type: str = Field(
        "car",
        description="Vehicle type",
        pattern="^(car|truck|taxi|bus|van|motorcycle|bicycle|pedestrian)$",
    )


class RouteRequestSchema(BaseModel):
    origin: CoordinatesSchema = Field(
        ..., description="Starting point coordinates"
    )
    destination: CoordinatesSchema = Field(
        ..., description="Destination coordinates"
    )
    waypoints: Optional[List[CoordinatesSchema]] = Field(
        None, description="Optional waypoints"
    )
    options: Optional[RouteOptionsSchema] = Field(
        None, description="Route calculation options"
    )


class RouteInstructionSchema(BaseModel):
    instruction: str = Field(..., description="Turn-by-turn instruction")
    distance: int = Field(..., description="Distance in meters")
    duration: int = Field(..., description="Duration in seconds")
    coordinates: CoordinatesSchema = Field(
        ..., description="Instruction coordinates"
    )


class RouteSegmentSchema(BaseModel):
    start_point: CoordinatesSchema = Field(
        ..., description="Segment start coordinates"
    )
    end_point: CoordinatesSchema = Field(
        ..., description="Segment end coordinates"
    )
    distance: int = Field(..., description="Segment distance in meters")
    duration: int = Field(..., description="Segment duration in seconds")
    instructions: List[RouteInstructionSchema] = Field(
        ..., description="Turn-by-turn instructions"
    )


class RouteResponseSchema(BaseModel):
    route_id: str = Field(..., description="Unique route identifier")
    total_distance: int = Field(..., description="Total distance in meters")
    total_duration: int = Field(..., description="Total duration in seconds")
    segments: List[RouteSegmentSchema] = Field(
        ..., description="Route segments"
    )
    polyline: str = Field(
        ..., description="Encoded polyline or coordinate string"
    )
    summary: Dict[str, Any] = Field(..., description="Additional route summary")
    created_at: datetime = Field(..., description="Route creation timestamp")


class TrafficRequestSchema(BaseModel):
    coordinates: CoordinatesSchema = Field(
        ..., description="Location coordinates"
    )
    zoom_level: int = Field(10, description="Map zoom level", ge=1, le=18)


class TrafficResponseSchema(BaseModel):
    traffic_data: Dict[str, Any] = Field(..., description="Traffic flow data")
    coordinates: CoordinatesSchema = Field(
        ..., description="Request coordinates"
    )
    timestamp: datetime = Field(..., description="Data timestamp")


class PlaceSearchRequestSchema(BaseModel):
    query: str = Field(..., description="Search query", min_length=1)
    coordinates: Optional[CoordinatesSchema] = Field(
        None, description="Search center coordinates"
    )
    radius: int = Field(
        10000, description="Search radius in meters", ge=100, le=50000
    )


class PlaceResultSchema(BaseModel):
    name: str = Field(..., description="Place name")
    address: str = Field(..., description="Place address")
    coordinates: CoordinatesSchema = Field(..., description="Place coordinates")
    category: Optional[str] = Field(None, description="Place category")
    distance: Optional[float] = Field(
        None, description="Distance from search center"
    )


class PlaceSearchResponseSchema(BaseModel):
    results: List[PlaceResultSchema] = Field(..., description="Search results")
    query: str = Field(..., description="Original search query")
    total_results: int = Field(..., description="Total number of results")


class ErrorResponseSchema(BaseModel):
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(
        None, description="Detailed error information"
    )
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Error timestamp"
    )


class SuccessResponseSchema(BaseModel):
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(
        default_factory=datetime.now, description="Response timestamp"
    )
