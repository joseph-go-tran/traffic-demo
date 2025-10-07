from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...database import get_db
from ..models import TrafficIncident as TrafficIncidentModel
from ..schemas.traffic_schemas import (
    ErrorResponse,
    StatusUpdateRequest,
    TrafficIncident,
    TrafficIncidentCreate,
    TrafficIncidentResponse,
    TrafficIncidentsResponse,
    VoteRequest,
)
from ..services.traffic_incident_service import TrafficIncidentService

router = APIRouter(prefix="/traffic/incidents", tags=["traffic-incidents"])


def convert_db_to_schema(db_incident: TrafficIncidentModel) -> TrafficIncident:
    """Convert database model to Pydantic schema"""
    return TrafficIncident(
        id=db_incident.id,
        type=db_incident.type,
        severity=db_incident.severity,
        status=db_incident.status,
        location={"lat": db_incident.latitude, "lng": db_incident.longitude},
        description=db_incident.description,
        address=db_incident.address,
        affected_lanes=db_incident.affected_lanes,
        estimated_duration=db_incident.estimated_duration,
        reported_by=db_incident.reported_by,
        created_at=db_incident.created_at,
        updated_at=db_incident.updated_at,
        votes_confirm=db_incident.votes_confirm,
        votes_dispute=db_incident.votes_dispute,
    )


@router.post(
    "/report",
    response_model=TrafficIncidentResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Report Traffic Incident",
    description="Report a new traffic incident",
)
async def report_incident(
    incident_data: TrafficIncidentCreate, db: Session = Depends(get_db)
):
    """
    Report a traffic incident.

    - **type**: Type of incident (accident, construction, closure, etc.)
    - **severity**: Severity level (low, medium, high, critical)
    - **location**: Coordinates of the incident
    - **description**: Detailed description of the incident
    - **address**: Human-readable address (optional)
    - **affected_lanes**: Information about affected lanes (optional)
    - **estimated_duration**: Estimated duration of the incident (optional)
    """
    try:
        service = TrafficIncidentService(db)
        db_incident = service.create_incident(incident_data)
        incident_schema = convert_db_to_schema(db_incident)

        return TrafficIncidentResponse(
            message="Traffic incident reported successfully",
            data=incident_schema,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to report incident: {str(e)}",
        )


@router.get(
    "/",
    response_model=TrafficIncidentsResponse,
    summary="Get Traffic Incidents",
    description="Get traffic incidents with optional filtering",
)
async def get_incidents(
    lat: Optional[float] = Query(
        None, description="Latitude for location-based search"
    ),
    lng: Optional[float] = Query(
        None, description="Longitude for location-based search"
    ),
    radius: Optional[float] = Query(
        10.0, description="Search radius in kilometers"
    ),
    status: Optional[List[str]] = Query(
        None, description="Filter by incident status"
    ),
    limit: int = Query(
        100, description="Maximum number of incidents to return", le=500
    ),
    offset: int = Query(0, description="Number of incidents to skip"),
    db: Session = Depends(get_db),
):
    """
    Get traffic incidents with optional filtering.

    - If lat/lng provided: returns incidents within specified radius
    - If no location: returns all incidents (with pagination)
    - **status**: Filter by incident status (active, resolved, etc.)
    """
    try:
        service = TrafficIncidentService(db)

        if lat is not None and lng is not None:
            db_incidents = service.get_incidents_by_location(
                latitude=lat,
                longitude=lng,
                radius_km=radius,
                status_filter=status,
                limit=limit,
            )
        else:
            db_incidents = service.get_all_incidents(
                status_filter=status, limit=limit, offset=offset
            )

        incidents = [
            convert_db_to_schema(incident) for incident in db_incidents
        ]

        return TrafficIncidentsResponse(
            message="Traffic incidents retrieved successfully",
            data=incidents,
            total_count=len(incidents),
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get incidents: {str(e)}",
        )


@router.get(
    "/{incident_id}",
    response_model=TrafficIncidentResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Get Specific Incident",
    description="Get details of a specific traffic incident",
)
async def get_incident(incident_id: str, db: Session = Depends(get_db)):
    """Get a specific traffic incident by ID"""
    try:
        service = TrafficIncidentService(db)
        db_incident = service.get_incident(incident_id)

        if not db_incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found",
            )

        incident_schema = convert_db_to_schema(db_incident)

        return TrafficIncidentResponse(
            message="Incident retrieved successfully", data=incident_schema
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get incident: {str(e)}",
        )


@router.put(
    "/{incident_id}/vote",
    response_model=TrafficIncidentResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Vote on Incident",
    description="Vote to confirm or dispute a traffic incident",
)
async def vote_on_incident(
    incident_id: str, vote_data: VoteRequest, db: Session = Depends(get_db)
):
    """
    Vote on a traffic incident to help verify its accuracy.

    - **vote_type**: 'confirm' or 'dispute'
    - **user_id**: ID of the user voting (optional, for tracking)
    """
    try:
        service = TrafficIncidentService(db)

        _ = service.vote_on_incident(
            incident_id, vote_data.vote_type, vote_data.user_id
        )

        # Get updated incident
        db_incident = service.get_incident(incident_id)
        incident_schema = convert_db_to_schema(db_incident)

        return TrafficIncidentResponse(
            message="Vote recorded successfully", data=incident_schema
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record vote: {str(e)}",
        )


@router.put(
    "/{incident_id}/status",
    response_model=TrafficIncidentResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Update Incident Status",
    description="Update the status of a traffic incident",
)
async def update_incident_status(
    incident_id: str,
    status_update: StatusUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Update the status of a traffic incident.

    - **status**: New status ('active', 'resolved', 'verified', 'disputed')
    - **updated_by**: ID of user/system updating the status (optional)
    """
    try:
        service = TrafficIncidentService(db)

        db_incident = service.update_incident_status(
            incident_id, status_update.status.value, status_update.updated_by
        )

        if not db_incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found",
            )

        incident_schema = convert_db_to_schema(db_incident)

        return TrafficIncidentResponse(
            message=f"Incident status updated to {status_update.status.value}",
            data=incident_schema,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update incident status: {str(e)}",
        )


@router.post(
    "/route-check",
    response_model=TrafficIncidentsResponse,
    summary="Check Route for Incidents",
    description="Get incidents along a specific route",
)
async def check_route_incidents(
    route_data: dict,
    # Expecting {"coordinates": [{"lat": float, "lng": float}, ...]}
    buffer_km: float = Query(
        1.0, description="Buffer distance in kilometers around route"
    ),
    db: Session = Depends(get_db),
):
    """Get traffic incidents along a route"""
    try:
        service = TrafficIncidentService(db)

        coordinates = route_data.get("coordinates", [])
        if not coordinates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Route coordinates are required",
            )

        db_incidents = service.get_incidents_along_route(
            coordinates, buffer_km
        )
        incidents = [
            convert_db_to_schema(incident) for incident in db_incidents
        ]

        return TrafficIncidentsResponse(
            message="Route incidents retrieved successfully",
            data=incidents,
            total_count=len(incidents),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check route incidents: {str(e)}",
        )
