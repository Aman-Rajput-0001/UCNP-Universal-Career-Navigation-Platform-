from typing import Optional
from app.schemas.recommendation import (
    LearningRecommendationRequest,
    LearningRecommendationResponse,
    ProjectRecommendationRequest,
    ProjectRecommendationResponse,
)
from app.agents.recommendation_agent import (
    GeminiRecommendationAIProvider,
    RecommendationAIProviderInterface,
)


class RecommendationService:
    def __init__(self, ai_provider: Optional[RecommendationAIProviderInterface] = None):
        self.ai_provider = ai_provider or GeminiRecommendationAIProvider()

    async def get_learning_recommendations(
        self, request: LearningRecommendationRequest
    ) -> LearningRecommendationResponse:
        return await self.ai_provider.recommend_learning(request)

    async def get_project_recommendations(
        self, request: ProjectRecommendationRequest
    ) -> ProjectRecommendationResponse:
        return await self.ai_provider.recommend_projects(request)


# Singleton instance
default_recommendation_service = RecommendationService()

