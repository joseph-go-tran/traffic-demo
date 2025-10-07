from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

# Import shared enums
from ..enums import IncidentSeverity, IncidentStatus, IncidentType


class Coordinates(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    lng: float = Field(
        ..., ge=-180, le=180, description="Longitude coordinate"
    )


class TrafficIncidentCreate(BaseModel):
    type: IncidentType
    severity: IncidentSeverity
    location: Coordinates
    description: str = Field(..., min_length=1, max_length=1000)
    address: Optional[str] = Field(None, max_length=500)
    affected_lanes: Optional[str] = Field(None, max_length=200)
    estimated_duration: Optional[str] = Field(None, max_length=100)
    reported_by: Optional[str] = Field(
        None, description="User ID who reported the incident"
    )


class TrafficIncident(BaseModel):
    id: str
    type: IncidentType
    severity: IncidentSeverity
    status: IncidentStatus = IncidentStatus.active
    location: Coordinates
    description: str
    address: Optional[str] = None
    affected_lanes: Optional[str] = None
    estimated_duration: Optional[str] = None
    reported_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    votes_confirm: int = 0
    votes_dispute: int = 0

    @property
    def total_votes(self):
        return self.votes_confirm + self.votes_dispute

    class Config:
        from_attributes = True


class TrafficIncidentsResponse(BaseModel):
    success: bool = True
    message: str
    data: List[TrafficIncident]
    total_count: int


class TrafficIncidentResponse(BaseModel):
    success: bool = True
    message: str
    data: TrafficIncident


class VoteRequest(BaseModel):
    vote_type: str = Field(..., pattern="^(confirm|dispute)$")
    user_id: Optional[str] = None


class StatusUpdateRequest(BaseModel):
    status: IncidentStatus
    updated_by: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: Optional[str] = None
