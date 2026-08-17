from __future__ import annotations

import json
from math import ceil
from pathlib import Path
from typing import Any

from sentinelai_ml.predict import PredictionResult, SentinelPredictor
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.app.db.models import ModelVersion
from api.app.schemas.analytics import UsageAnalyticsResponse
from api.app.schemas.model import ModelInfoResponse
from api.app.schemas.prediction import (
    InfluentialTermResponse,
    PredictionHistoryItem,
    PredictionHistoryResponse,
)
from api.app.services.prediction_repository import (
    PostgreSQLPredictionRepository,
)


class PredictionService:
    def __init__(
        self,
        predictor: SentinelPredictor,
        session: Session,
    ) -> None:
        self._predictor = predictor
        self._session = session
        self._repository = PostgreSQLPredictionRepository(session)

    def predict(
        self,
        text: str,
        top_k: int,
    ) -> PredictionResult:
        result = self._predictor.predict(
            text,
            top_k=top_k,
        )

        self._repository.save(
            text,
            result,
        )

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
        active = self._active_model()

        metrics = active.metrics

        return ModelInfoResponse(
            model_version=active.version,
            model_type=active.model_type,
            hyperparameters=metrics["hyperparameters"],
            preprocessing_version=("phase3-conservative-whitespace-v1"),
            dataset_sha256=(self._dataset_sha256()),
            training_date_utc=active.trained_at.isoformat(),
            cv_results=metrics["cv_results"],
            final_test_metrics=metrics["final_test_metrics"],
            calibration=metrics["calibration"],
        )

    def model_analytics(self) -> dict[str, Any]:
        active = self._active_model()
        metrics = active.metrics

        return {
            "model_version": active.version,
            "model_type": active.model_type,
            "cv_results": metrics["cv_results"],
            "final_test_metrics": metrics["final_test_metrics"],
            "calibration": metrics["calibration"],
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

    def _active_model(self) -> ModelVersion:
        model = self._session.scalar(
            select(ModelVersion).where(ModelVersion.is_active.is_(True))
        )

        if model is None:
            raise RuntimeError("No active SentinelAI model is registered.")

        return model

    @staticmethod
    def _dataset_sha256() -> str:
        project_root = Path(__file__).resolve().parents[3]
        metadata_path = (
            project_root / "ml" / "models" / "sentinelai-sms-v1.0.0.metadata.json"
        )

        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

        return metadata["dataset"]["sha256"]

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
