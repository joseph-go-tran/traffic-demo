from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from .base import Base


class IncidentVote(Base):
    __tablename__ = "incident_votes"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(100), nullable=False, index=True)
    user_id = Column(String(100), nullable=True, index=True)
    vote_type = Column(String(20), nullable=False)  # 'confirm' or 'dispute'
    created_at = Column(DateTime, default=datetime.utcnow)
