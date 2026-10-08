import os
import sys
import json
import time
from pathlib import Path
from contextlib import asynccontextmanager
import logging

# Ensure backend directory is in python path for local, container, or serverless deployment
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
for p in [str(backend_dir), str(current_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, Request
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

# Enable CORS with configurable origins via environment variable
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
if allowed_origins_env:
    origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_api_requests_and_responses(request: Request, call_next):
    """
    Logs every incoming API call and prints the status and response JSON directly on the terminal.
    """
    start_time = time.time()
    method = request.method
    path = request.url.path

    print(f"\n==================== [API CALL RECEIVED] ====================")
    print(f">> [INCOMING REQUEST]: {method} {path}")
    if request.query_params:
        print(f">> Query Parameters: {dict(request.query_params)}")

    try:
        response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)

        # Intercept response body stream to print JSON in terminal
        chunks = [chunk async for chunk in response.body_iterator]
        body_bytes = b"".join(chunks)

        async def stream():
            for chunk in chunks:
                yield chunk

        response.body_iterator = stream()

        status_tag = "[SUCCESS]" if response.status_code < 400 else "[CLIENT ERROR]" if response.status_code < 500 else "[SERVER ERROR]"
        print(f"<< {status_tag} Status {response.status_code} ({duration_ms}ms) -> {method} {path}")

        try:
            parsed_json = json.loads(body_bytes.decode("utf-8"))
            print(f"<< [RESPONSE JSON]:\n{json.dumps(parsed_json, indent=2)}")
        except Exception:
            text_body = body_bytes.decode("utf-8", errors="replace").strip()
            if text_body:
                print(f"<< [RESPONSE BODY]: {text_body[:500]}")
        print(f"============================================================\n")

        return response
    except Exception as exc:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        print(f"<< [FAILED] ({duration_ms}ms) -> {method} {path}")
        print(f"<< Exception: {type(exc).__name__}: {str(exc)}")
        print(f"============================================================\n")
        raise exc


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
