from __future__ import annotations

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from api.app.dependencies import (
    get_prediction_service,
    get_threat_analytics_service,
    get_threat_investigation_service,
)
from api.app.schemas.threat import (
    ThreatAnalysisRequest,
    ThreatAnalysisResponse,
    ThreatInvestigationHistoryResponse,
)
from api.app.schemas.threat_analytics import (
    ThreatAnalyticsOverviewResponse,
    ThreatCategoryDistributionResponse,
    ThreatRiskDistributionResponse,
    ThreatSignalFrequencyResponse,
    ThreatTimelineResponse,
)
from api.app.services.prediction_service import PredictionService
from api.app.services.threat_analytics_service import (
    ThreatAnalyticsService,
)
from api.app.services.threat_investigation_service import (
    ThreatInvestigationService,
)

router = APIRouter(
    prefix="/threat",
    tags=["threat-intelligence"],
)


@router.post(
    "/analyze",
    response_model=ThreatAnalysisResponse,
)
def analyze_threat(
    request: ThreatAnalysisRequest,
    prediction_service: PredictionService = Depends(
        get_prediction_service,
    ),
    investigation_service: ThreatInvestigationService = Depends(
        get_threat_investigation_service,
    ),
) -> ThreatAnalysisResponse:
    prediction = prediction_service.predict(
        request.text,
        request.top_k,
    )

    return investigation_service.analyze_and_store(
        text=request.text,
        prediction=prediction,
    )


@router.get(
    "/investigations",
    response_model=ThreatInvestigationHistoryResponse,
)
def list_investigations(
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    risk_level: Literal[
        "low",
        "medium",
        "high",
        "critical",
    ]
    | None = Query(default=None),
    category: str | None = Query(
        default=None,
        min_length=1,
        max_length=64,
    ),
    investigation_service: ThreatInvestigationService = Depends(
        get_threat_investigation_service,
    ),
) -> ThreatInvestigationHistoryResponse:
    return investigation_service.list(
        page=page,
        page_size=page_size,
        risk_level=risk_level,
        category=category,
    )


@router.get(
    "/investigations/{investigation_id}",
    response_model=ThreatAnalysisResponse,
)
def get_investigation(
    investigation_id: int,
    investigation_service: ThreatInvestigationService = Depends(
        get_threat_investigation_service,
    ),
) -> ThreatAnalysisResponse:
    result = investigation_service.get(
        investigation_id,
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Threat investigation not found.",
        )

    return result


@router.get(
    "/analytics/overview",
    response_model=ThreatAnalyticsOverviewResponse,
)
def threat_analytics_overview(
    analytics_service: ThreatAnalyticsService = Depends(
        get_threat_analytics_service,
    ),
) -> ThreatAnalyticsOverviewResponse:
    return analytics_service.overview()


@router.get(
    "/analytics/risk-distribution",
    response_model=ThreatRiskDistributionResponse,
)
def threat_risk_distribution(
    analytics_service: ThreatAnalyticsService = Depends(
        get_threat_analytics_service,
    ),
) -> ThreatRiskDistributionResponse:
    return analytics_service.risk_distribution()


@router.get(
    "/analytics/categories",
    response_model=ThreatCategoryDistributionResponse,
)
def threat_category_distribution(
    analytics_service: ThreatAnalyticsService = Depends(
        get_threat_analytics_service,
    ),
) -> ThreatCategoryDistributionResponse:
    return analytics_service.category_distribution()


@router.get(
    "/analytics/signals",
    response_model=ThreatSignalFrequencyResponse,
)
def threat_signal_frequency(
    analytics_service: ThreatAnalyticsService = Depends(
        get_threat_analytics_service,
    ),
) -> ThreatSignalFrequencyResponse:
    return analytics_service.signal_frequency()


@router.get(
    "/analytics/timeline",
    response_model=ThreatTimelineResponse,
)
def threat_timeline(
    from_date: date | None = Query(
        default=None,
    ),
    to_date: date | None = Query(
        default=None,
    ),
    analytics_service: ThreatAnalyticsService = Depends(
        get_threat_analytics_service,
    ),
) -> ThreatTimelineResponse:
    if from_date is not None and to_date is not None and from_date > to_date:
        raise HTTPException(
            status_code=422,
            detail="from_date must be before or equal to to_date.",
        )

    return analytics_service.timeline(
        from_date=from_date,
        to_date=to_date,
    )
