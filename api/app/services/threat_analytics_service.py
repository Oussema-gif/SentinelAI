from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from api.app.schemas.threat_analytics import (
    ThreatAnalyticsOverviewResponse,
    ThreatCategoryDistributionItem,
    ThreatCategoryDistributionResponse,
    ThreatRiskDistributionItem,
    ThreatRiskDistributionResponse,
    ThreatSignalFrequencyItem,
    ThreatSignalFrequencyResponse,
    ThreatTimelineItem,
    ThreatTimelineResponse,
)
from api.app.services.threat_analytics_repository import (
    PostgreSQLThreatAnalyticsRepository,
)


class ThreatAnalyticsService:
    def __init__(
        self,
        session: Session,
    ) -> None:
        self._repository = PostgreSQLThreatAnalyticsRepository(session)

    def overview(
        self,
    ) -> ThreatAnalyticsOverviewResponse:
        return ThreatAnalyticsOverviewResponse(**self._repository.overview())

    def risk_distribution(
        self,
    ) -> ThreatRiskDistributionResponse:
        return ThreatRiskDistributionResponse(
            items=[
                ThreatRiskDistributionItem(**item)
                for item in self._repository.risk_distribution()
            ]
        )

    def category_distribution(
        self,
    ) -> ThreatCategoryDistributionResponse:
        return ThreatCategoryDistributionResponse(
            items=[
                ThreatCategoryDistributionItem(**item)
                for item in self._repository.category_distribution()
            ]
        )

    def timeline(
        self,
        *,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> ThreatTimelineResponse:
        return ThreatTimelineResponse(
            items=[
                ThreatTimelineItem(**item)
                for item in self._repository.timeline(
                    from_date=from_date,
                    to_date=to_date,
                )
            ],
            from_date=from_date,
            to_date=to_date,
        )

    def signal_frequency(
        self,
    ) -> ThreatSignalFrequencyResponse:
        return ThreatSignalFrequencyResponse(
            items=[
                ThreatSignalFrequencyItem(**item)
                for item in self._repository.signal_frequency()
            ]
        )
