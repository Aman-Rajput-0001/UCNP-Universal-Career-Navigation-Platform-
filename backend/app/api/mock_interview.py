from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.mock_interview import (
    MockInterviewStartRequest,
    MockInterviewSessionResponse,
    MockInterviewSubmitAnswerRequest,
    MockInterviewFinishRequest,
)
from app.services.mock_interview_service import MockInterviewService

router = APIRouter()
mock_interview_service = MockInterviewService()


@router.post(
    "/mock-interview/start",
    response_model=MockInterviewSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start an interactive AI Mock Interview session",
)
async def start_mock_interview(
    payload: MockInterviewStartRequest,
    db: Session = Depends(get_db),
):
    try:
        return await mock_interview_service.start_session(payload, db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start mock interview: {str(e)}",
        )


@router.post(
    "/mock-interview/answer",
    response_model=MockInterviewSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit answer for the current question and receive instant evaluation",
)
async def submit_mock_interview_answer(
    payload: MockInterviewSubmitAnswerRequest,
    db: Session = Depends(get_db),
):
    try:
        return await mock_interview_service.submit_turn_answer(payload, db=db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process answer: {str(e)}",
        )


@router.post(
    "/mock-interview/finish",
    response_model=MockInterviewSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete the mock interview and synthesize final evaluation report",
)
async def finish_mock_interview(
    payload: MockInterviewFinishRequest,
    db: Session = Depends(get_db),
):
    try:
        return await mock_interview_service.finish_session(payload, db=db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to finish mock interview: {str(e)}",
        )


@router.get(
    "/mock-interview/{session_id}",
    response_model=MockInterviewSessionResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve stored mock interview session and results from database",
)
async def get_mock_interview_session(
    session_id: str,
    db: Session = Depends(get_db),
):
    session = await mock_interview_service.get_session(session_id, db=db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mock interview session '{session_id}' not found",
        )
    return session

