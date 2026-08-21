from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import delete

from api.app.db.models.threat_investigation import ThreatInvestigation
from api.app.db.session import SessionLocal
from api.app.services.threat_analytics_repository import (
    PostgreSQLThreatAnalyticsRepository,
)


def _investigation(
    *,
    text_hash: str,
    category: str,
    threat_label: str,
    risk_level: str,
    severity: int,
    created_at: datetime,
) -> ThreatInvestigation:
    return ThreatInvestigation(
        text_hash=text_hash,
        classifier_label="ham",
        classifier_decision_score=-0.5,
        threat_label=threat_label,
        risk_level=risk_level,
        severity=severity,
        category=category,
        signals=[],
        links=[],
        recommendation="Test recommendation.",
        model_version="test-model",
        created_at=created_at,
    )


def test_overview_counts_likely_threat_as_suspicious() -> None:
    run_id = uuid4().hex
    created_at = datetime(2098, 1, 15, 12, 0, tzinfo=UTC)
    text_hashes = [
        f"{run_id}-malicious",
        f"{run_id}-likely-threat",
        f"{run_id}-benign",
    ]

    with SessionLocal() as session:
        try:
            session.add_all(
                [
                    _investigation(
                        text_hash=text_hashes[0],
                        category=f"analytics-{run_id}",
                        threat_label="malicious_or_high_risk",
                        risk_level="critical",
                        severity=90,
                        created_at=created_at,
                    ),
                    _investigation(
                        text_hash=text_hashes[1],
                        category=f"analytics-{run_id}",
                        threat_label="likely_threat",
                        risk_level="high",
                        severity=60,
                        created_at=created_at,
                    ),
                    _investigation(
                        text_hash=text_hashes[2],
                        category=f"analytics-{run_id}",
                        threat_label="benign",
                        risk_level="low",
                        severity=0,
                        created_at=created_at,
                    ),
                ]
            )
            session.commit()

            repository = PostgreSQLThreatAnalyticsRepository(session)

            overview = repository.overview()
            assert overview["malicious_count"] >= 1
            assert overview["suspicious_count"] >= 1
            assert overview["benign_count"] >= 1

            timeline = repository.timeline(
                from_date=created_at.date(),
                to_date=created_at.date(),
            )

            item = next(row for row in timeline if row["date"] == created_at.date())

            assert item["malicious"] >= 1
            assert item["suspicious"] >= 1
            assert item["benign"] >= 1
            assert (
                item["malicious"] + item["suspicious"] + item["benign"]
                == item["investigations"]
            )
        finally:
            session.execute(
                delete(ThreatInvestigation).where(
                    ThreatInvestigation.text_hash.in_(text_hashes)
                )
            )
            session.commit()
