import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON, Text
from app.database import Base


class MockInterviewSessionModel(Base):
    __tablename__ = "mock_interview_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(100), nullable=False, unique=True, index=True)
    profile_id = Column(String(100), nullable=True, index=True)
    career_name = Column(String(255), nullable=False, default="Software Engineer")
    status = Column(String(50), nullable=False, default="in_progress")  # 'in_progress' | 'completed'
    current_question_index = Column(Integer, nullable=False, default=0)
    total_questions = Column(Integer, nullable=False, default=4)
    questions = Column(JSON, nullable=False, default=list)
    turns = Column(JSON, nullable=False, default=list)
    final_feedback = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

