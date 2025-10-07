from datetime import datetime

# Import shared enums
from enums import IncidentSeverity, IncidentStatus, IncidentType
from sqlalchemy import Column, DateTime, Enum, Float, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class TrafficIncident(Base):
    __tablename__ = "traffic_incidents"

    id = Column(String(100), primary_key=True, index=True)
    type = Column(Enum(IncidentType), nullable=False)
    severity = Column(Enum(IncidentSeverity), nullable=False)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.active)

    # Location coordinates
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)

    # Incident details
    description = Column(Text, nullable=False)
    address = Column(String(500), nullable=True)
    affected_lanes = Column(String(200), nullable=True)
    estimated_duration = Column(String(100), nullable=True)

    # Metadata
    reported_by = Column(String(100), nullable=True)  # User ID
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Voting stats
    votes_confirm = Column(Integer, default=0)
    votes_dispute = Column(Integer, default=0)


class IncidentVote(Base):
    __tablename__ = "incident_votes"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(100), nullable=False, index=True)
    user_id = Column(String(100), nullable=True, index=True)
    vote_type = Column(String(20), nullable=False)  # 'confirm' or 'dispute'
    created_at = Column(DateTime, default=datetime.utcnow)
