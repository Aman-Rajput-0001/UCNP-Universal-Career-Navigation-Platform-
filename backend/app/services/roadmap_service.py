from typing import Optional
from sqlalchemy.orm import Session
from app.models.profile import StudentProfileModel
from app.schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
    RoadmapGenerateProfileInput,
    RoadmapReplanRequest,
    RoadmapReplanResponse,
)
from app.agents.roadmap_agent import GeminiRoadmapAIProvider, RoadmapAIProviderInterface


class RoadmapService:
    def __init__(self, ai_provider: Optional[RoadmapAIProviderInterface] = None):
        self.ai_provider = ai_provider or GeminiRoadmapAIProvider()

    async def generate_roadmap(
        self,
        request: RoadmapGenerateRequest,
        db: Optional[Session] = None,
    ) -> RoadmapGenerateResponse:
        # If profile_id is provided and db is available, load or merge student profile
        if request.profile_id and db:
            profile_record = db.query(StudentProfileModel).filter(
                StudentProfileModel.id == request.profile_id
            ).first()

            if profile_record:
                request = RoadmapGenerateRequest(
                    profile_id=profile_record.id,
                    profile=RoadmapGenerateProfileInput(
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
                    selected_career=request.selected_career,
                    eligibility_result=request.eligibility_result,
                    skill_gap_result=request.skill_gap_result,
                )

        return await self.ai_provider.generate_roadmap(request)

    async def replan_roadmap(
        self,
        request: RoadmapReplanRequest,
        db: Optional[Session] = None,
    ) -> RoadmapReplanResponse:
        # Enrich current_profile if profile_id is provided
        if request.profile_id and db and not request.current_profile:
            profile_record = db.query(StudentProfileModel).filter(
                StudentProfileModel.id == request.profile_id
            ).first()

            if profile_record:
                request = RoadmapReplanRequest(
                    profile_id=profile_record.id,
                    current_profile=RoadmapGenerateProfileInput(
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
                    current_roadmap=request.current_roadmap,
                    completed_steps=request.completed_steps,
                    new_information=request.new_information,
                    target_career=request.target_career or profile_record.career_goal,
                )

        return await self.ai_provider.replan_roadmap(request)


# Default singleton instance
default_roadmap_service = RoadmapService()

