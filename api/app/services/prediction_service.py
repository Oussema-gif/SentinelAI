from __future__ import annotations

import json
from math import ceil
from pathlib import Path
from typing import Any

from sentinelai_ml.predict import PredictionResult, SentinelPredictor

from api.app.schemas.analytics import UsageAnalyticsResponse
from api.app.schemas.model import ModelInfoResponse
from api.app.schemas.prediction import (
    InfluentialTermResponse,
    PredictionHistoryItem,
    PredictionHistoryResponse,
)
from api.app.services.prediction_repository import (
    InMemoryPredictionRepository,
)

PROJECT_ROOT = Path(__file__).resolve().parents[3]

MODEL_VERSION = "sentinelai-sms-v1.0.0"

METADATA_PATH = PROJECT_ROOT / "ml" / "models" / f"{MODEL_VERSION}.metadata.json"


class PredictionService:
    def __init__(
        self,
        predictor: SentinelPredictor,
        repository: InMemoryPredictionRepository,
    ) -> None:
        self._predictor = predictor
        self._repository = repository

    def predict(
        self,
        text: str,
        top_k: int,
    ) -> PredictionResult:
        result = self._predictor.predict(
            text,
            top_k=top_k,
        )

        self._repository.save(result)

        return result

    def history(
        self,
        *,
        page: int,
        page_size: int,
        label: str | None,
    ) -> PredictionHistoryResponse:
        items, total = self._repository.list(
            page=page,
            page_size=page_size,
            label=label,
        )

        response_items = [self._history_item(item) for item in items]

        total_pages = ceil(total / page_size) if total else 0

        return PredictionHistoryResponse(
            items=response_items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    def model_info(self) -> ModelInfoResponse:
        metadata = self._read_metadata()

        return ModelInfoResponse(
            model_version=metadata["model_version"],
            model_type=metadata["model_type"],
            hyperparameters=metadata["hyperparameters"],
            preprocessing_version=metadata["preprocessing_version"],
            dataset_sha256=metadata["dataset"]["sha256"],
            training_date_utc=metadata["training_date_utc"],
            cv_results=metadata["cv_results"],
            final_test_metrics=metadata["final_test_metrics"],
            calibration=metadata["calibration"],
        )

    def model_analytics(self) -> dict[str, Any]:
        metadata = self._read_metadata()

        return {
            "model_version": metadata["model_version"],
            "model_type": metadata["model_type"],
            "cv_results": metadata["cv_results"],
            "final_test_metrics": metadata["final_test_metrics"],
            "calibration": metadata["calibration"],
        }

    def usage_analytics(self) -> UsageAnalyticsResponse:
        total, ham, spam = self._repository.counts()

        spam_rate = spam / total if total else 0.0

        return UsageAnalyticsResponse(
            total_predictions=total,
            ham_predictions=ham,
            spam_predictions=spam,
            spam_rate=round(spam_rate, 6),
        )

    @staticmethod
    def _history_item(item: Any) -> PredictionHistoryItem:
        return PredictionHistoryItem(
            id=item.id,
            label=item.result.label,
            confidence=item.result.confidence,
            confidence_type=item.result.confidence_type,
            decision_score=item.result.decision_score,
            influential_terms=[
                InfluentialTermResponse(
                    term=term.term,
                    contribution=term.contribution,
                    direction=term.direction,
                )
                for term in item.result.influential_terms
            ],
            model_version=item.result.model_version,
            created_at=item.created_at,
        )

    @staticmethod
    def _read_metadata() -> dict[str, Any]:
        if not METADATA_PATH.exists():
            raise FileNotFoundError(f"Model metadata not found: {METADATA_PATH}")

        return json.loads(METADATA_PATH.read_text(encoding="utf-8"))
