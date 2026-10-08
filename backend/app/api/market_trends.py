from fastapi import APIRouter
from app.schemas.market_trends import MarketTrendsRequest, MarketTrendsResponse
from app.services.market_trends_service import default_market_trends_service

router = APIRouter()


@router.post(
    "/market/trends",
    response_model=MarketTrendsResponse,
    summary="Fetch industry market trends, in-demand skills, occupation evolution, and future skills",
)
async def get_market_trends(request: MarketTrendsRequest) -> MarketTrendsResponse:
    """
    Returns curated modular market trend intelligence.
    Uses pluggable provider interface prepared for future external authoritative data sources.
    Currently backed by clearly labeled demo/benchmark blueprint data.
    """
    return default_market_trends_service.get_market_trends(request)

