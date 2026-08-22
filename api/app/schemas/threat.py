from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ThreatSignal(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str
    label: str
    severity: float = Field(ge=0, le=1)
    evidence: str


class ThreatLink(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str
    host: str
    shortener: bool
    ip_address: bool
    suspicious_path: bool


class ThreatAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(
        min_length=1,
        max_length=10_000,
    )
    top_k: int = Field(
        default=6,
        ge=1,
        le=20,
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("text must not be empty.")

        return value


class ThreatAnalysisResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    classifier_label: str
    classifier_decision_score: float | None

    threat_label: str
    risk_level: str
    severity: int
    category: str

    signals: list[ThreatSignal]
    links: list[ThreatLink]

    recommendation: str
    model_version: str


class ThreatInvestigationHistoryItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: int
    classifier_label: str
    classifier_decision_score: float | None
    threat_label: str
    risk_level: str
    severity: int
    category: str

    signals: list[ThreatSignal]
    links: list[ThreatLink]

    recommendation: str
    model_version: str
    created_at: datetime


class ThreatInvestigationHistoryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ThreatInvestigationHistoryItem]
    page: int
    page_size: int
    total: int
    total_pages: int
