from typing import Optional
from sqlalchemy.orm import Session
from app.models.profile import StudentProfileModel
from app.schemas.assist import StudentProfileContext
from app.schemas.interview import (
    InterviewGenerateRequest,
    InterviewGenerateResponse,
    InterviewAnswerSubmitRequest,
    InterviewAnswerEvaluateResponse,
)
from app.agents.interview_agent import GeminiInterviewAIProvider, InterviewAIProviderInterface


class InterviewService:
    def __init__(self, ai_provider: Optional[InterviewAIProviderInterface] = None):
        self.ai_provider = ai_provider or GeminiInterviewAIProvider()

    async def generate_questions(
        self,
        request: InterviewGenerateRequest,
        db: Optional[Session] = None,
    ) -> InterviewGenerateResponse:
        # Hydrate student profile if profile_id provided
        if request.profile_id and db and not request.student_profile:
            profile_record = db.query(StudentProfileModel).filter(
                StudentProfileModel.id == request.profile_id
            ).first()

            if profile_record:
                request = InterviewGenerateRequest(
                    profile_id=request.profile_id,
                    student_profile=StudentProfileContext(
                        education=profile_record.education or "Skill-first",
                        degree=profile_record.degree or "",
                        branch=profile_record.branch or "",
                        currentYear=profile_record.current_year or "",
                        skills=list(profile_record.skills or []),
                        interests=list(profile_record.interests or []),
                        strengths=list(profile_record.strengths or []),
                        weaknesses=list(profile_record.weaknesses or []),
                        careerGoal=profile_record.career_goal or "",
                        availableTime=profile_record.available_time or "",
                    ),
                    target_career=request.target_career,
                    skills=request.skills or list(profile_record.skills or []),
                    projects=request.projects,
                    roadmap=request.roadmap,
                )

        return await self.ai_provider.generate_questions(request)

    async def evaluate_answer(
        self,
        request: InterviewAnswerSubmitRequest,
        db: Optional[Session] = None,
    ) -> InterviewAnswerEvaluateResponse:
        return await self.ai_provider.evaluate_answer(request)

