from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.progress import (
    RoadmapProgressUpdateRequest,
    RoadmapProgressResponse,
)
from app.services.progress_service import progress_service

router = APIRouter()


@router.post(
    "/progress",
    response_model=RoadmapProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Update and persist roadmap step progress",
)
def update_step_progress(
    payload: RoadmapProgressUpdateRequest,
    db: Session = Depends(get_db),
) -> RoadmapProgressResponse:
    try:
        return progress_service.update_progress(payload, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update progress: {str(e)}",
        )


@router.get(
    "/progress/{roadmap_id}",
    response_model=RoadmapProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve roadmap progress by roadmap_id",
)
def get_roadmap_progress(
    roadmap_id: str,
    db: Session = Depends(get_db),
) -> RoadmapProgressResponse:
    res = progress_service.get_progress(roadmap_id, db=db)
    if not res:
        # Return default 0 progress if not initialized yet
        return RoadmapProgressResponse(
            roadmap_id=roadmap_id,
            career_name="",
            total_steps=0,
            completed_steps_count=0,
            in_progress_steps_count=0,
            not_started_steps_count=0,
            progress_percentage=0.0,
            step_statuses={},
        )
    return res

