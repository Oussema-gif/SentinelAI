from __future__ import annotations

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from api.app.db.dependencies import get_db
from api.app.services.prediction_service import PredictionService
from api.app.services.threat_analysis_service import (
    ThreatAnalysisService,
)
from api.app.services.threat_analytics_service import (
    ThreatAnalyticsService,
)
from api.app.services.threat_investigation_service import (
    ThreatInvestigationService,
)


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


def get_threat_investigation_service(
    db: Session = Depends(get_db),
) -> ThreatInvestigationService:
    return ThreatInvestigationService(
        session=db,
        analysis_service=ThreatAnalysisService(),
    )


def get_threat_analytics_service(
    db: Session = Depends(get_db),
) -> ThreatAnalyticsService:
    return ThreatAnalyticsService(
        session=db,
    )
