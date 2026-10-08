from fastapi import APIRouter
from app.schemas.pathway import (
    CareerPathwayRequest,
    CareerPathwayResponse,
    CareerGrowthRequest,
    CareerGrowthResponse,
)
from app.services.pathway_service import default_career_pathway_service

router = APIRouter()


@router.post(
    "/career/pathway",
    response_model=CareerPathwayResponse,
    summary="Generate complete career progression pathway (Skills → Projects → Portfolio → Resume → Internship → Entry-level role → Career growth)",
)
async def get_career_pathway(
    request: CareerPathwayRequest,
) -> CareerPathwayResponse:
    return default_career_pathway_service.generate_pathway(request)


@router.post(
    "/career/growth",
    response_model=CareerGrowthResponse,
    summary="Generate structured multi-stage career growth progression ladder: entry, mid, senior, specialist/lead, and management tracks",
)
async def get_career_growth(
    request: CareerGrowthRequest,
) -> CareerGrowthResponse:
    return default_career_pathway_service.generate_career_growth(request)


