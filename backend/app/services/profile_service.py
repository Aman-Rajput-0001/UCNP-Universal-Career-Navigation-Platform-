import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.profile import StudentProfileModel
from app.schemas.profile import StudentProfileCreate, StudentProfileResponse


def to_response_dto(model: StudentProfileModel) -> StudentProfileResponse:
    return StudentProfileResponse(
        id=model.id,
        education=model.education,
        degree=model.degree,
        branch=model.branch,
        currentYear=model.current_year,
        skills=list(model.skills or []),
        interests=list(model.interests or []),
        strengths=list(model.strengths or []),
        weaknesses=list(model.weaknesses or []),
        careerGoal=model.career_goal,
        availableTime=model.available_time,
        createdAt=model.created_at,
        updatedAt=model.updated_at,
        isNormalized=True,
    )


def save_student_profile(db: Session, profile_in: StudentProfileCreate) -> StudentProfileResponse:
    db_profile = StudentProfileModel(
        id=str(uuid.uuid4()),
        education=profile_in.education.strip(),
        degree=(profile_in.degree or "").strip(),
        branch=(profile_in.branch or "").strip(),
        current_year=(profile_in.currentYear or "").strip(),
        skills=[s.strip() for s in profile_in.skills if s.strip()],
        interests=[i.strip() for i in profile_in.interests if i.strip()],
        strengths=[s.strip() for s in profile_in.strengths if s.strip()],
        weaknesses=[w.strip() for w in profile_in.weaknesses if w.strip()],
        career_goal=(profile_in.careerGoal or "").strip(),
        available_time=(profile_in.availableTime or "").strip(),
    )

    try:
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        return to_response_dto(db_profile)
    except Exception as e:
        db.rollback()
        raise e


def get_student_profile_by_id(db: Session, profile_id: str) -> Optional[StudentProfileResponse]:
    model = db.query(StudentProfileModel).filter(StudentProfileModel.id == profile_id).first()
    if not model:
        return None
    return to_response_dto(model)
