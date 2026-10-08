from typing import Optional
from sqlalchemy.orm import Session
from app.models.profile import StudentProfileModel
from app.schemas.assist import (
    ContextualAssistRequest,
    ContextualAssistResponse,
    StudentProfileContext,
)
from app.agents.assist_agent import GeminiAssistAIProvider, AssistAIProviderInterface


class AssistService:
    def __init__(self, ai_provider: Optional[AssistAIProviderInterface] = None):
        self.ai_provider = ai_provider or GeminiAssistAIProvider()

    async def get_contextual_assistance(
        self,
        request: ContextualAssistRequest,
        db: Optional[Session] = None,
    ) -> ContextualAssistResponse:
        # If profile_id is provided and student_profile is missing, hydrate from database
        if request.profile_id and db and not request.student_profile:
            profile_record = db.query(StudentProfileModel).filter(
                StudentProfileModel.id == request.profile_id
            ).first()

            if profile_record:
                request = ContextualAssistRequest(
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
                    selected_node=request.selected_node,
                    roadmap_context=request.roadmap_context,
                )

        return await self.ai_provider.get_contextual_assistance(request)

