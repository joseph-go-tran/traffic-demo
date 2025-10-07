"""
Shared enums for traffic service
Used by both SQLAlchemy models and Pydantic schemas
"""
from enum import Enum


class IncidentType(str, Enum):
    """Traffic incident types"""

    accident = "accident"
    construction = "construction"
    closure = "closure"
    congestion = "congestion"
    weather = "weather"
    hazard = "hazard"
    other = "other"


class IncidentSeverity(str, Enum):
    """Incident severity levels"""

    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IncidentStatus(str, Enum):
    """Incident status"""

    active = "active"
    resolved = "resolved"
    verified = "verified"
    disputed = "disputed"
