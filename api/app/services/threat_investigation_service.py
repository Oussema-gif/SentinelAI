from __future__ import annotations

from math import ceil

from sentinelai_ml.predict import PredictionResult
from sqlalchemy.orm import Session

from api.app.schemas.threat import (
    ThreatAnalysisResponse,
    ThreatInvestigationHistoryItem,
    ThreatInvestigationHistoryResponse,
    ThreatLink,
    ThreatSignal,
)
from api.app.services.threat_analysis_service import (
    ThreatAnalysisResult,
    ThreatAnalysisService,
)
from api.app.services.threat_investigation_repository import (
    PostgreSQLThreatInvestigationRepository,
    StoredThreatInvestigation,
)


class ThreatInvestigationService:
    def __init__(
        self,
        session: Session,
        analysis_service: ThreatAnalysisService,
    ) -> None:
        self._repository = PostgreSQLThreatInvestigationRepository(session)
        self._analysis_service = analysis_service

    def analyze_and_store(
        self,
        text: str,
        prediction: PredictionResult,
    ) -> ThreatAnalysisResponse:
        result = self._analysis_service.analyze(
            text,
            prediction,
        )

        self._repository.save(
            text=text,
            classifier_label=prediction.label,
            classifier_decision_score=prediction.decision_score,
            result=result,
            model_version=prediction.model_version,
        )

        return self._response(
            prediction,
            result,
        )

    def get(
        self,
        investigation_id: int,
    ) -> ThreatAnalysisResponse | None:
        stored = self._repository.get(investigation_id)

        if stored is None:
            return None

        return self._response_from_stored(stored)

    def list(
        self,
        *,
        page: int,
        page_size: int,
        risk_level: str | None = None,
        category: str | None = None,
    ) -> ThreatInvestigationHistoryResponse:
        items, total = self._repository.list(
            page=page,
            page_size=page_size,
            risk_level=risk_level,
            category=category,
        )

        return ThreatInvestigationHistoryResponse(
            items=[self._history_item(item) for item in items],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=ceil(total / page_size) if total else 0,
        )

    @staticmethod
    def _history_item(
        item: StoredThreatInvestigation,
    ) -> ThreatInvestigationHistoryItem:
        return ThreatInvestigationHistoryItem(
            id=item.id,
            classifier_label=item.classifier_label,
            classifier_decision_score=(item.classifier_decision_score),
            threat_label=item.result.threat_label,
            risk_level=item.result.risk_level,
            severity=item.result.severity,
            category=item.result.category,
            signals=[
                ThreatSignal(
                    type=signal.type,
                    label=signal.label,
                    severity=signal.severity,
                    evidence=signal.evidence,
                )
                for signal in item.result.signals
            ],
            links=[
                ThreatLink(
                    url=link.url,
                    host=link.host,
                    shortener=link.shortener,
                    ip_address=link.ip_address,
                    suspicious_path=link.suspicious_path,
                )
                for link in item.result.links
            ],
            recommendation=item.result.recommendation,
            model_version=item.model_version,
            created_at=item.created_at,
        )

    @staticmethod
    def _response(
        prediction: PredictionResult,
        result: ThreatAnalysisResult,
    ) -> ThreatAnalysisResponse:
        return ThreatAnalysisResponse(
            classifier_label=prediction.label,
            classifier_decision_score=prediction.decision_score,
            threat_label=result.threat_label,
            risk_level=result.risk_level,
            severity=result.severity,
            category=result.category,
            signals=[
                ThreatSignal(
                    type=signal.type,
                    label=signal.label,
                    severity=signal.severity,
                    evidence=signal.evidence,
                )
                for signal in result.signals
            ],
            links=[
                ThreatLink(
                    url=link.url,
                    host=link.host,
                    shortener=link.shortener,
                    ip_address=link.ip_address,
                    suspicious_path=link.suspicious_path,
                )
                for link in result.links
            ],
            recommendation=result.recommendation,
            model_version=prediction.model_version,
        )

    @classmethod
    def _response_from_stored(
        cls,
        stored: StoredThreatInvestigation,
    ) -> ThreatAnalysisResponse:
        return ThreatAnalysisResponse(
            classifier_label=stored.classifier_label,
            classifier_decision_score=(stored.classifier_decision_score),
            threat_label=stored.result.threat_label,
            risk_level=stored.result.risk_level,
            severity=stored.result.severity,
            category=stored.result.category,
            signals=[
                ThreatSignal(
                    type=signal.type,
                    label=signal.label,
                    severity=signal.severity,
                    evidence=signal.evidence,
                )
                for signal in stored.result.signals
            ],
            links=[
                ThreatLink(
                    url=link.url,
                    host=link.host,
                    shortener=link.shortener,
                    ip_address=link.ip_address,
                    suspicious_path=link.suspicious_path,
                )
                for link in stored.result.links
            ],
            recommendation=stored.result.recommendation,
            model_version=stored.model_version,
        )
