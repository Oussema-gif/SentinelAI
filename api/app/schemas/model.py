from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict


class ModelInfoResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    model_version: str
    model_type: str
    hyperparameters: dict[str, Any]
    preprocessing_version: str
    dataset_sha256: str
    training_date_utc: str
    cv_results: list[dict[str, Any]]
    final_test_metrics: dict[str, float]
    calibration: dict[str, Any]
