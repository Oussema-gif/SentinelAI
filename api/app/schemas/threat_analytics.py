from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict


class ThreatRiskDistributionItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    risk_level: str
    count: int
    percentage: float


class ThreatCategoryDistributionItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: str
    count: int
    percentage: float


class ThreatSignalFrequencyItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    signal_type: str
    count: int
    percentage: float


class ThreatAnalyticsOverviewResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_investigations: int

    critical_count: int
    high_count: int
    medium_count: int
    low_count: int

    critical_percentage: float
    high_percentage: float
    medium_percentage: float
    low_percentage: float

    average_severity: float
    max_severity: int

    malicious_count: int
    suspicious_count: int
    benign_count: int


class ThreatRiskDistributionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ThreatRiskDistributionItem]


class ThreatCategoryDistributionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ThreatCategoryDistributionItem]


class ThreatSignalFrequencyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ThreatSignalFrequencyItem]


class ThreatTimelineItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: date
    investigations: int

    critical: int
    high: int
    medium: int
    low: int

    average_severity: float

    malicious: int
    suspicious: int
    benign: int


class ThreatTimelineResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[ThreatTimelineItem]
    from_date: date | None
    to_date: date | None
