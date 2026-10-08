from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.career import (
    CareerDiscoveryRequest,
    CareerDiscoveryResponse,
    EligibilityCheckRequest,
    EligibilityCheckResponse,
    SkillGapRequest,
    SkillGapResponse,
)
from app.services.career_service import default_career_discovery_service
from app.services.eligibility_rules import evaluate_eligibility
from app.services.skill_gap_service import analyze_skill_gap
from app.services.simulation_service import career_simulation_service
from app.schemas.simulation import (
    CareerSimulationRequest,
    CareerSimulationResponse,
)
from app.models.profile import StudentProfileModel

router = APIRouter()


@router.post(
    "/career/discover",
    response_model=CareerDiscoveryResponse,
    summary="Discover careers based on student profile via AI",
)
async def discover_careers(
    request: CareerDiscoveryRequest,
    db: Session = Depends(get_db),
) -> CareerDiscoveryResponse:
    return await default_career_discovery_service.discover_careers(request, db=db)


@router.post(
    "/career/eligibility",
    response_model=EligibilityCheckResponse,
    summary="Check authoritative eligibility for a selected career",
)
async def check_eligibility(
    request: EligibilityCheckRequest,
    db: Session = Depends(get_db),
) -> EligibilityCheckResponse:
    education = request.education
    degree = request.degree or ""
    branch = request.branch or ""
    skills = request.skills

    if request.profile_id and db:
        try:
            profile_record = db.query(StudentProfileModel).filter(
                StudentProfileModel.id == request.profile_id
            ).first()
            if profile_record:
                education = profile_record.education or education
                degree = profile_record.degree or degree
                branch = profile_record.branch or branch
                skills = list(profile_record.skills or skills)
        except Exception:
            pass

    return evaluate_eligibility(
        career_name=request.career_name,
        education=education,
        degree=degree,
        branch=branch,
        skills=skills,
    )


@router.post(
    "/career/skill-gap",
    response_model=SkillGapResponse,
    summary="Analyze skill gaps comparing current skills vs career required skills",
)
async def analyze_skill_gap_endpoint(
    request: SkillGapRequest,
    db: Session = Depends(get_db),
) -> SkillGapResponse:
    current_skills = request.current_skills

    # If profile_id is provided, merge with stored profile skills
    if request.profile_id and db:
        try:
            profile_record = db.query(StudentProfileModel).filter(
                StudentProfileModel.id == request.profile_id
            ).first()
            if profile_record and profile_record.skills:
                # Merge and preserve unique order
                existing_set = set(s.lower() for s in current_skills)
                for s in profile_record.skills:
                    if s.lower() not in existing_set:
                        current_skills.append(s)
                        existing_set.add(s.lower())
        except Exception:
            pass

    enriched_request = SkillGapRequest(
        profile_id=request.profile_id,
        career_name=request.career_name,
        current_skills=current_skills,
        required_skills=request.required_skills,
    )

    return analyze_skill_gap(enriched_request)


@router.post(
    "/career/simulate",
    response_model=CareerSimulationResponse,
    summary="Simulate an alternative what-if career pathway using student profile",
)
def simulate_career_endpoint(
    request: CareerSimulationRequest,
    db: Session = Depends(get_db),
) -> CareerSimulationResponse:
    return career_simulation_service.simulate_career(request, db=db)

