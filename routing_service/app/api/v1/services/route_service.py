from typing import List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.v1.models import Route, RouteWaypoint, SavedPlace


class RouteService:
    """Service for route database operations"""

    @staticmethod
    def get_route_by_id(db: Session, route_id: str) -> Optional[Route]:
        """Get a route by its route_id"""
        return db.query(Route).filter(Route.route_id == route_id).first()

    @staticmethod
    def get_routes_by_user(
        db: Session,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
    ) -> List[Route]:
        """Get all routes for a specific user"""
        query = db.query(Route).filter(Route.user_id == user_id)

        if status:
            query = query.filter(Route.status == status)

        return (
            query.order_by(desc(Route.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_recent_routes(
        db: Session, limit: int = 10, user_id: Optional[int] = None
    ) -> List[Route]:
        """Get recent routes, optionally filtered by user"""
        query = db.query(Route)

        if user_id:
            query = query.filter(Route.user_id == user_id)

        return query.order_by(desc(Route.created_at)).limit(limit).all()

    @staticmethod
    def update_route_status(
        db: Session, route_id: str, status: str
    ) -> Optional[Route]:
        """Update route status"""
        route = db.query(Route).filter(Route.route_id == route_id).first()
        if route:
            route.status = status
            db.commit()
            db.refresh(route)
        return route

    @staticmethod
    def delete_route(db: Session, route_id: str) -> bool:
        """Delete a route"""
        route = db.query(Route).filter(Route.route_id == route_id).first()
        if route:
            db.delete(route)
            db.commit()
            return True
        return False

    @staticmethod
    def get_route_waypoints(
        db: Session, route_db_id: int
    ) -> List[RouteWaypoint]:
        """Get all waypoints for a route"""
        return (
            db.query(RouteWaypoint)
            .filter(RouteWaypoint.route_id == route_db_id)
            .order_by(RouteWaypoint.sequence)
            .all()
        )


class SavedPlaceService:
    """Service for saved places database operations"""

    @staticmethod
    def create_saved_place(
        db: Session,
        user_id: int,
        name: str,
        lat: float,
        lng: float,
        address: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> SavedPlace:
        """Create a new saved place"""
        place = SavedPlace(
            user_id=user_id,
            name=name,
            lat=lat,
            lng=lng,
            address=address,
            category=category,
            tags=tags,
        )
        db.add(place)
        db.commit()
        db.refresh(place)
        return place

    @staticmethod
    def get_saved_places(
        db: Session, user_id: int, tag: Optional[str] = None
    ) -> List[SavedPlace]:
        """Get all saved places for a user"""
        query = db.query(SavedPlace).filter(SavedPlace.user_id == user_id)

        if tag:
            # Filter by tag in JSON array
            query = query.filter(SavedPlace.tags.contains([tag]))

        return query.order_by(desc(SavedPlace.created_at)).all()

    @staticmethod
    def delete_saved_place(db: Session, place_id: int, user_id: int) -> bool:
        """Delete a saved place"""
        place = (
            db.query(SavedPlace)
            .filter(SavedPlace.id == place_id, SavedPlace.user_id == user_id)
            .first()
        )

        if place:
            db.delete(place)
            db.commit()
            return True
        return False


route_service = RouteService()
saved_place_service = SavedPlaceService()
