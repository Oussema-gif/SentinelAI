from __future__ import annotations

from collections import Counter

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from api.app.db.models import ThreatInvestigation


class PostgreSQLThreatAnalyticsRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def overview(self) -> dict:
        total = int(
            self._session.scalar(select(func.count(ThreatInvestigation.id))) or 0
        )

        critical = self._count_risk("critical")
        high = self._count_risk("high")
        medium = self._count_risk("medium")
        low = self._count_risk("low")

        average_severity = float(
            self._session.scalar(
                select(
                    func.coalesce(
                        func.avg(ThreatInvestigation.severity),
                        0,
                    )
                )
            )
            or 0.0
        )

        max_severity = int(
            self._session.scalar(
                select(
                    func.coalesce(
                        func.max(ThreatInvestigation.severity),
                        0,
                    )
                )
            )
            or 0
        )

        malicious = self._count_threat_label("malicious_or_high_risk")

        suspicious = self._count_threat_label("likely_threat")

        benign = self._count_threat_label("benign")

        return {
            "total_investigations": total,
            "critical_count": critical,
            "high_count": high,
            "medium_count": medium,
            "low_count": low,
            "critical_percentage": self._percentage(
                critical,
                total,
            ),
            "high_percentage": self._percentage(
                high,
                total,
            ),
            "medium_percentage": self._percentage(
                medium,
                total,
            ),
            "low_percentage": self._percentage(
                low,
                total,
            ),
            "average_severity": round(
                average_severity,
                2,
            ),
            "max_severity": max_severity,
            "malicious_count": malicious,
            "suspicious_count": suspicious,
            "benign_count": benign,
        }

    def risk_distribution(self) -> list[dict]:
        total = int(
            self._session.scalar(select(func.count(ThreatInvestigation.id))) or 0
        )

        rows = self._session.execute(
            select(
                ThreatInvestigation.risk_level,
                func.count(ThreatInvestigation.id).label("count"),
            )
            .group_by(ThreatInvestigation.risk_level)
            .order_by(
                case(
                    (ThreatInvestigation.risk_level == "critical", 1),
                    (ThreatInvestigation.risk_level == "high", 2),
                    (ThreatInvestigation.risk_level == "medium", 3),
                    (ThreatInvestigation.risk_level == "low", 4),
                    else_=5,
                )
            )
        ).all()

        return [
            {
                "risk_level": risk_level,
                "count": int(count),
                "percentage": self._percentage(
                    int(count),
                    total,
                ),
            }
            for risk_level, count in rows
        ]

    def category_distribution(self) -> list[dict]:
        total = int(
            self._session.scalar(select(func.count(ThreatInvestigation.id))) or 0
        )

        rows = self._session.execute(
            select(
                ThreatInvestigation.category,
                func.count(ThreatInvestigation.id).label("count"),
            )
            .group_by(ThreatInvestigation.category)
            .order_by(
                func.count(ThreatInvestigation.id).desc(),
                ThreatInvestigation.category.asc(),
            )
        ).all()

        return [
            {
                "category": category,
                "count": int(count),
                "percentage": self._percentage(
                    int(count),
                    total,
                ),
            }
            for category, count in rows
        ]

    def signal_frequency(self) -> list[dict]:
        rows = (
            self._session.execute(select(ThreatInvestigation.signals)).scalars().all()
        )

        counter: Counter[str] = Counter()

        total_investigations = len(rows)

        for signals in rows:
            seen_investigation_signals: set[str] = set()

            for signal in signals or []:
                signal_type = signal.get("type")

                if not signal_type:
                    continue

                if signal_type in seen_investigation_signals:
                    continue

                seen_investigation_signals.add(signal_type)

                counter[signal_type] += 1

        return [
            {
                "signal_type": signal_type,
                "count": count,
                "percentage": self._percentage(
                    count,
                    total_investigations,
                ),
            }
            for signal_type, count in counter.most_common()
        ]

    def timeline(
        self,
        *,
        from_date=None,
        to_date=None,
    ) -> list[dict]:
        investigation_date = func.date(ThreatInvestigation.created_at)

        query = (
            select(
                investigation_date.label("date"),
                func.count(ThreatInvestigation.id).label("investigations"),
                func.sum(
                    case(
                        (
                            ThreatInvestigation.risk_level == "critical",
                            1,
                        ),
                        else_=0,
                    )
                ).label("critical"),
                func.sum(
                    case(
                        (
                            ThreatInvestigation.risk_level == "high",
                            1,
                        ),
                        else_=0,
                    )
                ).label("high"),
                func.sum(
                    case(
                        (
                            ThreatInvestigation.risk_level == "medium",
                            1,
                        ),
                        else_=0,
                    )
                ).label("medium"),
                func.sum(
                    case(
                        (
                            ThreatInvestigation.risk_level == "low",
                            1,
                        ),
                        else_=0,
                    )
                ).label("low"),
                func.avg(ThreatInvestigation.severity).label("average_severity"),
                func.sum(
                    case(
                        (
                            ThreatInvestigation.threat_label
                            == "malicious_or_high_risk",
                            1,
                        ),
                        else_=0,
                    )
                ).label("malicious"),
                func.sum(
                    case(
                        (
                            ThreatInvestigation.threat_label == "likely_threat",
                            1,
                        ),
                        else_=0,
                    )
                ).label("suspicious"),
                func.sum(
                    case(
                        (
                            ThreatInvestigation.threat_label == "benign",
                            1,
                        ),
                        else_=0,
                    )
                ).label("benign"),
            )
            .group_by(investigation_date)
            .order_by(investigation_date.asc())
        )

        if from_date is not None:
            query = query.where(investigation_date >= from_date)

        if to_date is not None:
            query = query.where(investigation_date <= to_date)

        rows = self._session.execute(query).all()

        return [
            {
                "date": row.date,
                "investigations": int(row.investigations or 0),
                "critical": int(row.critical or 0),
                "high": int(row.high or 0),
                "medium": int(row.medium or 0),
                "low": int(row.low or 0),
                "average_severity": round(
                    float(row.average_severity or 0.0),
                    2,
                ),
                "malicious": int(row.malicious or 0),
                "suspicious": int(row.suspicious or 0),
                "benign": int(row.benign or 0),
            }
            for row in rows
        ]

    def _count_risk(
        self,
        risk_level: str,
    ) -> int:
        return int(
            self._session.scalar(
                select(func.count(ThreatInvestigation.id)).where(
                    ThreatInvestigation.risk_level == risk_level
                )
            )
            or 0
        )

    def _count_threat_label(
        self,
        threat_label: str,
    ) -> int:
        return int(
            self._session.scalar(
                select(func.count(ThreatInvestigation.id)).where(
                    ThreatInvestigation.threat_label == threat_label
                )
            )
            or 0
        )

    @staticmethod
    def _percentage(
        count: int,
        total: int,
    ) -> float:
        if total == 0:
            return 0.0

        return round(
            (count / total) * 100,
            2,
        )
