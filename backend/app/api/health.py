from fastapi import APIRouter
from sqlalchemy import text
from app.schemas.health import HealthResponse
from app.database import engine

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_status = "unavailable"

    return HealthResponse(
        status="ok",
        service="career-navigation-backend",
        database=db_status,
    )


