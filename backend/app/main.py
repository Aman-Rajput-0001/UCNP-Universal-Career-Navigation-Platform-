from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api.health import router as health_router
from app.api.profile import router as profile_router
from app.api.career import router as career_router
from app.api.roadmap import router as roadmap_router
from app.api.recommendation import router as recommendation_router
from app.api.pathway import router as pathway_router
from app.api.progress import router as progress_router
from app.api.assist import router as assist_router
from app.api.interview import router as interview_router
from app.api.mock_interview import router as mock_interview_router
from app.api.market_trends import router as market_trends_router
import app.models.profile  # Ensure models are registered with Base.metadata
import app.models.progress
import app.models.mock_interview

logger = logging.getLogger("uvicorn.error")



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup safely
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization warning (will retry on query): {e}")
    yield


app = FastAPI(
    title="Career Navigator API",
    version="0.1.0",
    description="Backend service for AI Career Navigation Platform",
    lifespan=lifespan,
)

# Enable CORS for local frontend development (Vite standard ports)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(profile_router, prefix="/api", tags=["profile"])
app.include_router(career_router, prefix="/api", tags=["career"])
app.include_router(roadmap_router, prefix="/api", tags=["roadmap"])
app.include_router(recommendation_router, prefix="/api", tags=["recommendation"])
app.include_router(pathway_router, prefix="/api", tags=["pathway"])
app.include_router(progress_router, prefix="/api", tags=["progress"])
app.include_router(assist_router, prefix="/api", tags=["assist"])
app.include_router(interview_router, prefix="/api", tags=["interview"])
app.include_router(mock_interview_router, prefix="/api", tags=["mock-interview"])
app.include_router(market_trends_router, prefix="/api", tags=["market-trends"])


@app.get("/")
async def root():
    return {
        "message": "Career Navigator API is active",
        "docs": "/docs",
    }
