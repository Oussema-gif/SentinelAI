from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class InfluentialTermResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    term: str
    contribution: float
    direction: str = Field(
        description="Class direction supported by the model: ham or spam."
    )


class PredictionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(
        min_length=1,
        max_length=10_000,
        description="English short message to classify.",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum influential terms per direction.",
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("text must not be empty.")

        return value


class PredictionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    label: str
    confidence: float | None
    confidence_type: str
    decision_score: float | None
    influential_terms: list[InfluentialTermResponse]
    model_version: str


class PredictionHistoryItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    label: str
    confidence: float | None
    confidence_type: str
    decision_score: float | None
    influential_terms: list[InfluentialTermResponse]
    model_version: str
    created_at: datetime


class PredictionHistoryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[PredictionHistoryItem]
    page: int
    page_size: int
    total: int
    total_pages: int
