import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON
from app.database import Base


class RoadmapProgressModel(Base):
    __tablename__ = "roadmap_progress"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    roadmap_id = Column(String(100), nullable=False, unique=True, index=True)
    career_name = Column(String(255), nullable=False, default="")
    total_steps = Column(Integer, nullable=False, default=0)
    completed_steps_count = Column(Integer, nullable=False, default=0)
    in_progress_steps_count = Column(Integer, nullable=False, default=0)
    not_started_steps_count = Column(Integer, nullable=False, default=0)
    progress_percentage = Column(Float, nullable=False, default=0.0)
    # Dictionary mapping step_id -> 'not_started' | 'in_progress' | 'completed'
    step_statuses = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

