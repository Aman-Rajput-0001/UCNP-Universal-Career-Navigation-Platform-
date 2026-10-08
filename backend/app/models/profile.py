import uuid
from datetime import datetime
from typing import List
from sqlalchemy import Column, String, DateTime, Text, JSON
from app.database import Base


class StudentProfileModel(Base):
    __tablename__ = "student_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    education = Column(String(255), nullable=False)
    degree = Column(String(255), nullable=False, default="")
    branch = Column(String(255), nullable=False, default="")
    current_year = Column(String(100), nullable=False, default="")
    skills = Column(JSON, nullable=False, default=list)
    interests = Column(JSON, nullable=False, default=list)
    strengths = Column(JSON, nullable=False, default=list)
    weaknesses = Column(JSON, nullable=False, default=list)
    career_goal = Column(String(255), nullable=False, default="")
    available_time = Column(String(100), nullable=False, default="")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

