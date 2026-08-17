from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from api.app.db.dependencies import get_db
from api.app.services.prediction_service import PredictionService


def get_prediction_service(
    request: Request,
    db: Session = Depends(get_db),
) -> PredictionService:
    predictor = getattr(
        request.app.state,
        "predictor",
        None,
    )

    if predictor is None:
        raise RuntimeError("Prediction model is not initialized.")

    return PredictionService(
        predictor=predictor,
        session=db,
    )
