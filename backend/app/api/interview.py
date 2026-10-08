from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.interview import (
    InterviewGenerateRequest,
    InterviewGenerateResponse,
    InterviewAnswerSubmitRequest,
    InterviewAnswerEvaluateResponse,
)
from app.services.interview_service import InterviewService

router = APIRouter()
interview_service = InterviewService()


@router.post(
    "/interview/generate",
    response_model=InterviewGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate personalized interview questions",
    description="Generates technical, behavioral, project, and career-specific questions grounded in student profile, target career, skills, projects, and roadmap milestones.",
)
async def generate_interview_questions(
    payload: InterviewGenerateRequest,
    db: Session = Depends(get_db),
):
    try:
        response = await interview_service.generate_questions(payload, db=db)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview questions: {str(e)}",
        )


@router.post(
    "/interview/evaluate",
    response_model=InterviewAnswerEvaluateResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate student written answer to interview question",
    description="Scores the student's answer out of 10, provides constructive feedback, identifies strengths and improvement areas, and offers a model answer.",
)
async def evaluate_interview_answer(
    payload: InterviewAnswerSubmitRequest,
    db: Session = Depends(get_db),
):
    try:
        response = await interview_service.evaluate_answer(payload, db=db)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate answer: {str(e)}",
        )


@router.post(
    "/interview/answer",
    response_model=InterviewAnswerEvaluateResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=True,
    summary="Alias endpoint to submit and evaluate interview answer",
)
async def submit_interview_answer(
    payload: InterviewAnswerSubmitRequest,
    db: Session = Depends(get_db),
):
    return await evaluate_interview_answer(payload, db=db)

