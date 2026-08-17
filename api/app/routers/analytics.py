from __future__ import annotations

from fastapi import APIRouter, Depends

from api.app.dependencies import get_prediction_service
from api.app.schemas.analytics import (
    ModelAnalyticsResponse,
    UsageAnalyticsResponse,
)
from api.app.services.prediction_service import PredictionService

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
)


@router.get(
    "/model",
    response_model=ModelAnalyticsResponse,
)
def get_model_analytics(
    service: PredictionService = Depends(get_prediction_service),
) -> ModelAnalyticsResponse:
    return ModelAnalyticsResponse(**service.model_analytics())


@router.get(
    "/usage",
    response_model=UsageAnalyticsResponse,
)
def get_usage_analytics(
    service: PredictionService = Depends(get_prediction_service),
) -> UsageAnalyticsResponse:
    return service.usage_analytics()
