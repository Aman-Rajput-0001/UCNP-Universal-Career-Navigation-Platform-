from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.profile import StudentProfileCreate, StudentProfileResponse
from app.services.profile_service import save_student_profile, get_student_profile_by_id

router = APIRouter()


@router.post(
    "/profile",
    response_model=StudentProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update student profile in PostgreSQL",
)
async def create_profile(
    profile_data: StudentProfileCreate,
    db: Session = Depends(get_db),
) -> StudentProfileResponse:
    return save_student_profile(db, profile_data)


@router.get(
    "/profile/{profile_id}",
    response_model=StudentProfileResponse,
    summary="Get student profile by ID from PostgreSQL",
)
async def get_profile(
    profile_id: str,
    db: Session = Depends(get_db),
) -> StudentProfileResponse:
    profile = get_student_profile_by_id(db, profile_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student profile with id '{profile_id}' not found",
        )
    return profile
