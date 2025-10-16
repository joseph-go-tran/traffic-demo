from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .base import Base


class Route(Base):
    """Model for storing calculated routes"""

    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(
        Integer, nullable=True, index=True
    )  # Store user_id without foreign key constraint

    # Origin and destination coordinates
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)

    # Route details
    total_distance = Column(Integer, nullable=False)  # in meters
    total_duration = Column(Integer, nullable=False)  # in seconds
    polyline = Column(Text, nullable=True)

    # Route options and metadata
    route_type = Column(String(50), default="fastest")  # fastest, shortest, eco
    vehicle_type = Column(String(50), default="car")
    avoid_tolls = Column(Integer, default=0)  # Using Integer as boolean (0/1)
    avoid_highways = Column(Integer, default=0)
    avoid_ferries = Column(Integer, default=0)
    avoid_unpaved = Column(Integer, default=0)

    # Store full route data as JSON
    route_data = Column(JSON, nullable=True)

    # Status tracking
    status = Column(
        String(50), default="active"
    )  # active, completed, cancelled

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationship
    waypoints = relationship(
        "RouteWaypoint", back_populates="route", cascade="all, delete-orphan"
    )


class RouteWaypoint(Base):
    """Model for storing waypoints of a route"""

    __tablename__ = "route_waypoints"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(
        Integer,
        ForeignKey("routes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Waypoint coordinates
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Order in the route
    sequence = Column(Integer, nullable=False)

    # Optional waypoint details
    name = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    route = relationship("Route", back_populates="waypoints")


class SavedPlace(Base):
    """Model for storing user's saved places"""

    __tablename__ = "saved_places"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, nullable=False, index=True
    )  # Store user_id without foreign key constraint

    # Place details
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)

    # Coordinates
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Tags for organization (e.g., "home", "work", "favorite")
    tags = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
