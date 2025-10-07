import math
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from ..enums import IncidentStatus
from ..models import IncidentVote, TrafficIncident
from ..schemas.traffic_schemas import TrafficIncidentCreate


class TrafficIncidentService:
    """Service for managing traffic incidents"""

    def __init__(self, db: Session):
        self.db = db

    def create_incident(
        self, incident_data: TrafficIncidentCreate
    ) -> TrafficIncident:
        """Create a new traffic incident"""
        incident_id = (
            f"incident_{uuid.uuid4().hex[:8]}_"
            f"{int(datetime.now().timestamp())}"
        )

        db_incident = TrafficIncident(
            id=incident_id,
            type=incident_data.type.value,
            severity=incident_data.severity.value,
            latitude=incident_data.location.lat,
            longitude=incident_data.location.lng,
            description=incident_data.description,
            address=incident_data.address,
            affected_lanes=incident_data.affected_lanes,
            estimated_duration=incident_data.estimated_duration,
            reported_by=incident_data.reported_by,
            votes_confirm=1,  # Reporter automatically confirms
        )

        self.db.add(db_incident)
        self.db.commit()
        self.db.refresh(db_incident)

        return db_incident

    def get_incident(self, incident_id: str) -> Optional[TrafficIncident]:
        """Get a specific incident by ID"""
        return (
            self.db.query(TrafficIncident)
            .filter(TrafficIncident.id == incident_id)
            .first()
        )

    def get_incidents_by_location(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 10.0,
        status_filter: Optional[List[str]] = None,
        limit: int = 100,
    ) -> List[TrafficIncident]:
        """Get incidents within a specified radius of a location"""

        # Convert radius to approximate degree offset (rough calculation)
        degree_offset = radius_km / 111.0  # 1 degree ≈ 111 km

        query = self.db.query(TrafficIncident).filter(
            and_(
                TrafficIncident.latitude.between(
                    latitude - degree_offset, latitude + degree_offset
                ),
                TrafficIncident.longitude.between(
                    longitude - degree_offset, longitude + degree_offset
                ),
            )
        )

        if status_filter:
            query = query.filter(TrafficIncident.status.in_(status_filter))
        else:
            # Default: only active incidents
            query = query.filter(
                TrafficIncident.status == IncidentStatus.active.value
            )

        incidents = (
            query.order_by(TrafficIncident.created_at.desc())
            .limit(limit)
            .all()
        )

        # Filter by exact distance calculation
        filtered_incidents = []
        for incident in incidents:
            distance = self._calculate_distance(
                latitude, longitude, incident.latitude, incident.longitude
            )
            if distance <= radius_km:
                filtered_incidents.append(incident)

        return filtered_incidents

    def get_all_incidents(
        self,
        status_filter: Optional[List[str]] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[TrafficIncident]:
        """Get all incidents with optional filtering"""
        query = self.db.query(TrafficIncident)

        if status_filter:
            query = query.filter(TrafficIncident.status.in_(status_filter))
        # else:
        #     # Default: only active incidents
        #     query = query.filter(
        #         TrafficIncident.status == IncidentStatus.active.value
        #     )

        return (
            query.order_by(TrafficIncident.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def vote_on_incident(
        self, incident_id: str, vote_type: str, user_id: Optional[str] = None
    ):
        """Cast a vote on an incident"""
        incident = self.get_incident(incident_id)
        if not incident:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incident not found",
            )

        # Check if user has already voted (if user_id provided)
        if user_id:
            existing_vote = (
                self.db.query(IncidentVote)
                .filter(
                    and_(
                        IncidentVote.incident_id == incident_id,
                        IncidentVote.user_id == user_id,
                    )
                )
                .first()
            )

            if existing_vote:
                # Update existing vote
                existing_vote.vote_type = vote_type
                existing_vote.created_at = datetime.utcnow()
            else:
                # Create new vote
                new_vote = IncidentVote(
                    incident_id=incident_id,
                    user_id=user_id,
                    vote_type=vote_type,
                )
                self.db.add(new_vote)
        else:
            # Anonymous vote - just create new entry
            new_vote = IncidentVote(
                incident_id=incident_id, vote_type=vote_type
            )
            self.db.add(new_vote)

        # Update incident vote counts
        self._update_incident_vote_counts(incident_id)

        self.db.commit()

        return {
            "incident_id": incident_id,
            "vote_type": vote_type,
            "votes_confirm": incident.votes_confirm,
            "votes_dispute": incident.votes_dispute,
        }

    def update_incident_status(
        self,
        incident_id: str,
        new_status: str,
        updated_by: Optional[str] = None,
    ) -> Optional[TrafficIncident]:
        """Update incident status"""
        incident = self.get_incident(incident_id)
        if not incident:
            return None

        incident.status = new_status
        incident.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(incident)

        return incident

    def get_incidents_along_route(
        self, route_coordinates: List[dict], buffer_km: float = 1.0
    ) -> List[TrafficIncident]:
        """Get incidents along a route path"""
        incidents = []

        for coord in route_coordinates:
            nearby_incidents = self.get_incidents_by_location(
                latitude=coord["lat"],
                longitude=coord["lng"],
                radius_km=buffer_km,
            )
            incidents.extend(nearby_incidents)

        # Remove duplicates
        unique_incidents = {}
        for incident in incidents:
            unique_incidents[incident.id] = incident

        return list(unique_incidents.values())

    def _update_incident_vote_counts(self, incident_id: str):
        """Update vote counts for an incident"""
        confirm_count = (
            self.db.query(func.count(IncidentVote.id))
            .filter(
                and_(
                    IncidentVote.incident_id == incident_id,
                    IncidentVote.vote_type == "confirm",
                )
            )
            .scalar()
            or 0
        )

        dispute_count = (
            self.db.query(func.count(IncidentVote.id))
            .filter(
                and_(
                    IncidentVote.incident_id == incident_id,
                    IncidentVote.vote_type == "dispute",
                )
            )
            .scalar()
            or 0
        )

        incident = self.get_incident(incident_id)
        if incident:
            incident.votes_confirm = confirm_count
            incident.votes_dispute = dispute_count

    def _calculate_distance(
        self, lat1: float, lon1: float, lat2: float, lon2: float
    ) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        R = 6371  # Earth's radius in kilometers

        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a = math.sin(dlat / 2) * math.sin(dlat / 2) + math.cos(
            math.radians(lat1)
        ) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) * math.sin(
            dlon / 2
        )

        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c

        return distance
