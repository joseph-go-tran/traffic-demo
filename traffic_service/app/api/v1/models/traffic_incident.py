from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Float, Integer, String, Text

from ..enums import IncidentSeverity, IncidentStatus, IncidentType
from .base import Base


class TrafficIncident(Base):
    __tablename__ = "traffic_incidents"
    id = Column(String(100), primary_key=True, index=True)
    type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.active)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    description = Column(Text, nullable=False)
    address = Column(String(500), nullable=True)
    affected_lanes = Column(String(200), nullable=True)
    estimated_duration = Column(String(100), nullable=True)
    reported_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    votes_confirm = Column(Integer, default=0)
    votes_dispute = Column(Integer, default=0)
