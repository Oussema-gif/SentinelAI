from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.app.db.models import ThreatInvestigation
from api.app.security.privacy import (
    message_fingerprint,
    safe_evidence_for_storage,
    safe_url_for_storage,
)
from api.app.services.threat_analysis_service import (
    ThreatAnalysisResult,
)


@dataclass(frozen=True)
class StoredThreatInvestigation:
    id: int
    text_hash: str
    result: ThreatAnalysisResult
    classifier_label: str
    classifier_decision_score: float | None
    model_version: str
    created_at: datetime


class PostgreSQLThreatInvestigationRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def save(
        self,
        text: str,
        classifier_label: str,
        classifier_decision_score: float | None,
        result: ThreatAnalysisResult,
        model_version: str,
    ) -> StoredThreatInvestigation:
        text_hash = message_fingerprint(text)

        row = ThreatInvestigation(
            text_hash=text_hash,
            classifier_label=classifier_label,
            classifier_decision_score=classifier_decision_score,
            threat_label=result.threat_label,
            risk_level=result.risk_level,
            severity=result.severity,
            category=result.category,
            signals=[
                {
                    "type": signal.type,
                    "label": signal.label,
                    "severity": signal.severity,
                    "evidence": safe_evidence_for_storage(signal.evidence),
                }
                for signal in result.signals
            ],
            links=[
                {
                    "url": safe_url_for_storage(link.url),
                    "host": link.host,
                    "shortener": link.shortener,
                    "ip_address": link.ip_address,
                    "suspicious_path": link.suspicious_path,
                }
                for link in result.links
            ],
            recommendation=result.recommendation,
            model_version=model_version,
        )

        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)

        return self._to_stored(row)

    def get(
        self,
        investigation_id: int,
    ) -> StoredThreatInvestigation | None:
        row = self._session.get(
            ThreatInvestigation,
            investigation_id,
        )

        if row is None:
            return None

        return self._to_stored(row)

    def list(
        self,
        *,
        page: int,
        page_size: int,
        risk_level: str | None = None,
        category: str | None = None,
    ) -> tuple[list[StoredThreatInvestigation], int]:
        query = select(ThreatInvestigation)

        if risk_level is not None:
            query = query.where(ThreatInvestigation.risk_level == risk_level)

        if category is not None:
            query = query.where(ThreatInvestigation.category == category)

        total = int(
            self._session.scalar(select(func.count()).select_from(query.subquery()))
            or 0
        )

        query = (
            query.order_by(
                ThreatInvestigation.created_at.desc(),
                ThreatInvestigation.id.desc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        rows = self._session.scalars(query).all()

        return (
            [self._to_stored(row) for row in rows],
            total,
        )

    @staticmethod
    def _to_stored(
        row: ThreatInvestigation,
    ) -> StoredThreatInvestigation:
        from api.app.services.threat_analysis_service import (
            ThreatLinkResult,
            ThreatSignalResult,
        )

        result = ThreatAnalysisResult(
            threat_label=row.threat_label,
            risk_level=row.risk_level,
            severity=row.severity,
            category=row.category,
            signals=[
                ThreatSignalResult(
                    type=item["type"],
                    label=item["label"],
                    severity=float(item["severity"]),
                    evidence=item["evidence"],
                )
                for item in row.signals
            ],
            links=[
                ThreatLinkResult(
                    url=item["url"],
                    host=item["host"],
                    shortener=bool(item["shortener"]),
                    ip_address=bool(item["ip_address"]),
                    suspicious_path=bool(item["suspicious_path"]),
                )
                for item in row.links
            ],
            recommendation=row.recommendation,
        )

        return StoredThreatInvestigation(
            id=row.id,
            text_hash=row.text_hash,
            result=result,
            classifier_label=row.classifier_label,
            classifier_decision_score=row.classifier_decision_score,
            model_version=row.model_version,
            created_at=row.created_at,
        )
