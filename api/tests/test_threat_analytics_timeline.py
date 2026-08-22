from __future__ import annotations

from datetime import date

from api.app.db.session import SessionLocal
from api.app.services.threat_analytics_repository import (
    PostgreSQLThreatAnalyticsRepository,
)


def test_timeline_returns_existing_investigation():
    with SessionLocal() as session:
        repository = PostgreSQLThreatAnalyticsRepository(session)

        items = repository.timeline()

        assert items

        item = items[-1]

        assert item["investigations"] >= 1
        assert item["critical"] >= 1
        assert item["average_severity"] >= 0
        assert item["average_severity"] <= 100
        assert item["malicious"] >= 1


def test_timeline_date_filter():
    with SessionLocal() as session:
        repository = PostgreSQLThreatAnalyticsRepository(session)

        items = repository.timeline(
            from_date=date(2026, 8, 18),
            to_date=date(2026, 8, 18),
        )

        assert items

        for item in items:
            assert item["date"] == date(2026, 8, 18)


def test_timeline_empty_future_range():
    with SessionLocal() as session:
        repository = PostgreSQLThreatAnalyticsRepository(session)

        items = repository.timeline(
            from_date=date(2099, 1, 1),
            to_date=date(2099, 1, 2),
        )

        assert items == []
