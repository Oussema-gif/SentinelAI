from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ModelAnalyticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    model_version: str
    model_type: str
    cv_results: list[dict[str, object]]
    final_test_metrics: dict[str, float]
    calibration: dict[str, object]


class UsageAnalyticsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_predictions: int
    ham_predictions: int
    spam_predictions: int
    spam_rate: float
