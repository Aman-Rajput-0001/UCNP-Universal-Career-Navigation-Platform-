from typing import Optional
from sqlalchemy.orm import Session
from app.models.profile import StudentProfileModel
from app.schemas.career import CareerDiscoveryRequest, CareerDiscoveryResponse
from app.agents.career_discovery_agent import GeminiCareerAIProvider, AIProviderInterface


class CareerDiscoveryService:
    def __init__(self, ai_provider: Optional[AIProviderInterface] = None):
        self.ai_provider = ai_provider or GeminiCareerAIProvider()

    async def discover_careers(
        self,
        request: CareerDiscoveryRequest,
        db: Optional[Session] = None,
    ) -> CareerDiscoveryResponse:
        # If profile_id is provided and database session is available, enrich request
        if request.profile_id and db:
            profile_record = db.query(StudentProfileModel).filter(
                StudentProfileModel.id == request.profile_id
            ).first()

            if profile_record:
                request = CareerDiscoveryRequest(
                    profile_id=profile_record.id,
                    education=profile_record.education or request.education,
                    degree=profile_record.degree or request.degree,
                    branch=profile_record.branch or request.branch,
                    currentYear=profile_record.current_year or request.currentYear,
                    skills=list(profile_record.skills or request.skills),
                    interests=list(profile_record.interests or request.interests),
                    strengths=list(profile_record.strengths or request.strengths),
                    weaknesses=list(profile_record.weaknesses or request.weaknesses),
                    careerGoal=profile_record.career_goal or request.careerGoal,
                    availableTime=profile_record.available_time or request.availableTime,
                )

        return await self.ai_provider.discover_careers(request)


# Singleton instance for route handlers
default_career_discovery_service = CareerDiscoveryService()

