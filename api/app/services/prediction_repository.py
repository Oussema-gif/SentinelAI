from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from threading import Lock

from sentinelai_ml.predict import PredictionResult


@dataclass(frozen=True)
class StoredPrediction:
    id: int
    result: PredictionResult
    created_at: datetime


class InMemoryPredictionRepository:
    """Phase 6 repository adapter.

    Phase 7 will replace this adapter with the SQLAlchemy/PostgreSQL
    implementation while preserving the same service/API contract.
    """

    def __init__(self) -> None:
        self._items: list[StoredPrediction] = []
        self._lock = Lock()
        self._next_id = 1

    def save(self, result: PredictionResult) -> StoredPrediction:
        with self._lock:
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
        with self._lock:
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
        with self._lock:
            total = len(self._items)
            ham = sum(item.result.label == "ham" for item in self._items)
            spam = sum(item.result.label == "spam" for item in self._items)

            return total, ham, spam

    def clear(self) -> None:
        with self._lock:
            self._items.clear()
            self._next_id = 1
