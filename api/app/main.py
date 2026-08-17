from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sentinelai_ml.predict import load_predictor

from api.app.db.session import SessionLocal, engine
from api.app.routers.analytics import router as analytics_router
from api.app.routers.model import router as model_router
from api.app.routers.predictions import router as predictions_router
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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    tags=["system"],
)
def health(request: Request) -> dict[str, str]:
    predictor = getattr(
        request.app.state,
        "predictor",
        None,
    )

    return {"status": "ok" if predictor is not None else "degraded"}


app.include_router(predictions_router)
app.include_router(model_router)
app.include_router(analytics_router)
