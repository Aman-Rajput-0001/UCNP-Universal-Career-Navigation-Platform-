from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.assist import ContextualAssistRequest, ContextualAssistResponse
from app.services.assist_service import AssistService

router = APIRouter()
assist_service = AssistService()


@router.post(
    "/contextual-assist",
    response_model=ContextualAssistResponse,
    status_code=status.HTTP_200_OK,
    summary="Get contextual AI assistance for a specific workflow node",
    description="Analyzes the student's background, target career, and roadmap context to provide actionable guidance for the selected node.",
)
async def get_contextual_assistance(
    payload: ContextualAssistRequest,
    db: Session = Depends(get_db),
):
    try:
        response = await assist_service.get_contextual_assistance(payload, db=db)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate contextual assistance: {str(e)}",
        )


@router.post(
    "/node/assist",
    response_model=ContextualAssistResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=True,
    summary="Alias endpoint for node contextual assistance",
)
async def get_node_assistance(
    payload: ContextualAssistRequest,
    db: Session = Depends(get_db),
):
    return await get_contextual_assistance(payload, db=db)

