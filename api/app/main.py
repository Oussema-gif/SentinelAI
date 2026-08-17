from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sentinelai_ml.predict import load_predictor

from api.app.routers.analytics import router as analytics_router
from api.app.routers.model import router as model_router
from api.app.routers.predictions import router as predictions_router
from api.app.services.prediction_repository import (
    InMemoryPredictionRepository,
)
from api.app.services.prediction_service import PredictionService


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor = load_predictor()

    repository = InMemoryPredictionRepository()

    app.state.prediction_service = PredictionService(
        predictor=predictor,
        repository=repository,
    )

    yield

    repository.clear()


app = FastAPI(
    title="SentinelAI API",
    version="1.0.0",
    description=("Message threat detection API for SentinelAI V1."),
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
    service = getattr(
        request.app.state,
        "prediction_service",
        None,
    )

    return {"status": "ok" if service is not None else "degraded"}


app.include_router(predictions_router)
app.include_router(model_router)
app.include_router(analytics_router)
