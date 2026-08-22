from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sentinelai_ml.predict import load_predictor
from sqlalchemy import text

from api.app.config import get_cors_allowed_origins
from api.app.db.migrations import get_current_revision, get_head_revision
from api.app.db.session import SessionLocal, engine
from api.app.routers.analytics import router as analytics_router
from api.app.routers.model import router as model_router
from api.app.routers.predictions import router as predictions_router
from api.app.routers.threat import router as threat_router
from api.app.services.model_version_service import register_active_model

PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_METADATA_PATH = (
    PROJECT_ROOT / "ml" / "models" / "sentinelai-sms-v1.0.0.metadata.json"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor = load_predictor()

    app.state.predictor = predictor

    with SessionLocal() as session:
        register_active_model(
            session,
            MODEL_METADATA_PATH,
        )

    yield

    engine.dispose()


app = FastAPI(
    title="SentinelAI API",
    version="1.0.0",
    description="Message threat detection API for SentinelAI V1.",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _predictor_is_loaded(request: Request) -> bool:
    return getattr(request.app.state, "predictor", None) is not None


@app.get(
    "/health",
    tags=["system"],
)
def health(request: Request) -> dict[str, str]:
    return {"status": ("ok" if _predictor_is_loaded(request) else "degraded")}


@app.get(
    "/health/live",
    tags=["system"],
)
def health_live(request: Request) -> dict[str, str]:
    if not _predictor_is_loaded(request):
        raise HTTPException(
            status_code=503,
            detail="Predictor is not loaded.",
        )

    return {"status": "ok"}


@app.get(
    "/health/ready",
    tags=["system"],
)
def health_ready(request: Request) -> dict[str, str]:
    if not _predictor_is_loaded(request):
        raise HTTPException(
            status_code=503,
            detail="Predictor is not loaded.",
        )

    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Database is not ready.",
        ) from exc

    return {"status": "ok"}


@app.get(
    "/health/migrations",
    tags=["system"],
)
def health_migrations(request: Request) -> dict[str, str | bool]:
    if not _predictor_is_loaded(request):
        raise HTTPException(
            status_code=503,
            detail="Predictor is not loaded.",
        )

    try:
        with SessionLocal() as session:
            current = get_current_revision(session.connection())
            head = get_head_revision()
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to read migration state.",
        ) from exc

    return {
        "current": current,
        "head": head,
        "at_head": current == head,
    }


# Explicit router registration.
# Keep the order deterministic.
app.include_router(predictions_router)
app.include_router(threat_router)
app.include_router(model_router)
app.include_router(analytics_router)
