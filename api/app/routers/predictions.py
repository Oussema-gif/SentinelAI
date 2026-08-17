from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Query

from api.app.dependencies import get_prediction_service
from api.app.schemas.prediction import (
    InfluentialTermResponse,
    PredictionHistoryResponse,
    PredictionRequest,
    PredictionResponse,
)
from api.app.services.prediction_service import PredictionService

router = APIRouter(
    prefix="/predictions",
    tags=["predictions"],
)


@router.post(
    "",
    response_model=PredictionResponse,
)
def create_prediction(
    request: PredictionRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionResponse:
    result = service.predict(
        request.text,
        request.top_k,
    )

    return PredictionResponse(
        label=result.label,
        confidence=result.confidence,
        confidence_type=result.confidence_type,
        decision_score=result.decision_score,
        influential_terms=[
            InfluentialTermResponse(
                term=term.term,
                contribution=term.contribution,
                direction=term.direction,
            )
            for term in result.influential_terms
        ],
        model_version=result.model_version,
    )


@router.get(
    "",
    response_model=PredictionHistoryResponse,
)
def list_predictions(
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    label: Literal["ham", "spam"] | None = Query(default=None),
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionHistoryResponse:
    return service.history(
        page=page,
        page_size=page_size,
        label=label,
    )
