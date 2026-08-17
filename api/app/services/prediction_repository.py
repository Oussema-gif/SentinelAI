from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime

from sentinelai_ml.predict import PredictionResult
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.app.db.models import Prediction


@dataclass(frozen=True)
class StoredPrediction:
    id: int
    result: PredictionResult
    created_at: datetime


class PostgreSQLPredictionRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def save(
        self,
        text: str,
        result: PredictionResult,
    ) -> StoredPrediction:
        text_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()

        row = Prediction(
            text_hash=text_hash,
            predicted_label=result.label,
            confidence=result.confidence,
            confidence_type=result.confidence_type,
            decision_score=result.decision_score,
            influential_terms=[term.to_dict() for term in result.influential_terms],
            model_version=result.model_version,
        )

        self._session.add(row)
        self._session.commit()
        self._session.refresh(row)

        return self._to_stored(row)

    def list(
        self,
        *,
        page: int,
        page_size: int,
        label: str | None = None,
    ) -> tuple[list[StoredPrediction], int]:
        query = select(Prediction)

        if label is not None:
            query = query.where(Prediction.predicted_label == label)

        total = self._session.scalar(select(func.count()).select_from(query.subquery()))

        total = int(total or 0)

        query = (
            query.order_by(
                Prediction.created_at.desc(),
                Prediction.id.desc(),
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        rows = self._session.scalars(query).all()

        return (
            [self._to_stored(row) for row in rows],
            total,
        )

    def counts(self) -> tuple[int, int, int]:
        total = int(self._session.scalar(select(func.count(Prediction.id))) or 0)

        ham = int(
            self._session.scalar(
                select(func.count(Prediction.id)).where(
                    Prediction.predicted_label == "ham"
                )
            )
            or 0
        )

        spam = int(
            self._session.scalar(
                select(func.count(Prediction.id)).where(
                    Prediction.predicted_label == "spam"
                )
            )
            or 0
        )

        return total, ham, spam

    @staticmethod
    def _to_stored(
        row: Prediction,
    ) -> StoredPrediction:
        from sentinelai_ml.explain import InfluentialTerm

        terms = tuple(
            InfluentialTerm(
                term=item["term"],
                contribution=float(item["contribution"]),
                direction=item["direction"],
            )
            for item in row.influential_terms
        )

        result = PredictionResult(
            label=row.predicted_label,
            confidence=row.confidence,
            confidence_type=row.confidence_type,
            decision_score=row.decision_score,
            influential_terms=terms,
            model_version=row.model_version,
        )

        return StoredPrediction(
            id=row.id,
            result=result,
            created_at=row.created_at,
        )


class InMemoryPredictionRepository:
    """Compatibility adapter retained for isolated unit tests."""

    def __init__(self) -> None:
        self._items: list[StoredPrediction] = []
        self._next_id = 1

    def save(
        self,
        text: str,
        result: PredictionResult,
    ) -> StoredPrediction:
        item = StoredPrediction(
            id=self._next_id,
            result=result,
            created_at=datetime.now(UTC),
        )

        self._items.append(item)
        self._next_id += 1

        return item

    def list(
        self,
        *,
        page: int,
        page_size: int,
        label: str | None = None,
    ) -> tuple[list[StoredPrediction], int]:
        filtered = [
            item
            for item in reversed(self._items)
            if label is None or item.result.label == label
        ]

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size

        return filtered[start:end], total

    def counts(self) -> tuple[int, int, int]:
        total = len(self._items)
        ham = sum(item.result.label == "ham" for item in self._items)
        spam = sum(item.result.label == "spam" for item in self._items)

        return total, ham, spam
