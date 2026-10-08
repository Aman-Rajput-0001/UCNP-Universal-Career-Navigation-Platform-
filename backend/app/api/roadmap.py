from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
    RoadmapReplanRequest,
    RoadmapReplanResponse,
)
from app.services.roadmap_service import default_roadmap_service

router = APIRouter()


@router.post(
    "/roadmap/generate",
    response_model=RoadmapGenerateResponse,
    summary="Generate personalized AI career transition roadmap",
)
async def generate_roadmap_endpoint(
    request: RoadmapGenerateRequest,
    db: Session = Depends(get_db),
) -> RoadmapGenerateResponse:
    return await default_roadmap_service.generate_roadmap(request, db=db)


@router.post(
    "/roadmap/replan",
    response_model=RoadmapReplanResponse,
    summary="Dynamically replan remaining roadmap preserving completed steps",
)
async def replan_roadmap_endpoint(
    request: RoadmapReplanRequest,
    db: Session = Depends(get_db),
) -> RoadmapReplanResponse:
    return await default_roadmap_service.replan_roadmap(request, db=db)

