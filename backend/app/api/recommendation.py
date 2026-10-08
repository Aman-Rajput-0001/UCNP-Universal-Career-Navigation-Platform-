from fastapi import APIRouter
from app.schemas.recommendation import (
    LearningRecommendationRequest,
    LearningRecommendationResponse,
    ProjectRecommendationRequest,
    ProjectRecommendationResponse,
)
from app.services.recommendation_service import default_recommendation_service

router = APIRouter()


@router.post(
    "/recommendation/learning",
    response_model=LearningRecommendationResponse,
    summary="Generate personalized learning curriculum for roadmap skills",
)
async def get_learning_recommendation(
    request: LearningRecommendationRequest,
) -> LearningRecommendationResponse:
    return await default_recommendation_service.get_learning_recommendations(request)


@router.post(
    "/recommendation/projects",
    response_model=ProjectRecommendationResponse,
    summary="Generate personalized proof-of-work project blueprints for target career",
)
async def get_project_recommendation(
    request: ProjectRecommendationRequest,
) -> ProjectRecommendationResponse:
    return await default_recommendation_service.get_project_recommendations(request)

