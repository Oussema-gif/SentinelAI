from __future__ import annotations

from fastapi import APIRouter, Depends

from api.app.dependencies import get_prediction_service
from api.app.schemas.model import ModelInfoResponse
from api.app.services.prediction_service import PredictionService

router = APIRouter(
    prefix="/model",
    tags=["model"],
)


@router.get(
    "/info",
    response_model=ModelInfoResponse,
)
def get_model_info(
    service: PredictionService = Depends(get_prediction_service),
) -> ModelInfoResponse:
    return service.model_info()
