from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from api.app.db.base import Base


class ThreatInvestigation(Base):
    __tablename__ = "threat_investigations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    text_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    classifier_label: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        index=True,
    )

    classifier_decision_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    threat_label: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    risk_level: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        index=True,
    )

    severity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    signals: Mapped[list[dict]] = mapped_column(
        JSONB,
        nullable=False,
        server_default="[]",
    )

    links: Mapped[list[dict]] = mapped_column(
        JSONB,
        nullable=False,
        server_default="[]",
    )

    recommendation: Mapped[str] = mapped_column(
        String(2000),
        nullable=False,
    )

    model_version: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
