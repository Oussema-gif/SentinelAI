"""Add threat investigation persistence.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-18
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "threat_investigations",
        sa.Column(
            "id",
            sa.Integer,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "text_hash",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "classifier_label",
            sa.String(length=16),
            nullable=False,
        ),
        sa.Column(
            "classifier_decision_score",
            sa.Float,
            nullable=True,
        ),
        sa.Column(
            "threat_label",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "risk_level",
            sa.String(length=16),
            nullable=False,
        ),
        sa.Column(
            "severity",
            sa.Integer,
            nullable=False,
        ),
        sa.Column(
            "category",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "signals",
            postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "links",
            postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "recommendation",
            sa.String(length=2000),
            nullable=False,
        ),
        sa.Column(
            "model_version",
            sa.String(length=128),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_threat_investigations_text_hash",
        "threat_investigations",
        ["text_hash"],
    )

    op.create_index(
        "ix_threat_investigations_classifier_label",
        "threat_investigations",
        ["classifier_label"],
    )

    op.create_index(
        "ix_threat_investigations_threat_label",
        "threat_investigations",
        ["threat_label"],
    )

    op.create_index(
        "ix_threat_investigations_risk_level",
        "threat_investigations",
        ["risk_level"],
    )

    op.create_index(
        "ix_threat_investigations_severity",
        "threat_investigations",
        ["severity"],
    )

    op.create_index(
        "ix_threat_investigations_category",
        "threat_investigations",
        ["category"],
    )

    op.create_index(
        "ix_threat_investigations_model_version",
        "threat_investigations",
        ["model_version"],
    )

    op.create_index(
        "ix_threat_investigations_created_at",
        "threat_investigations",
        ["created_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_threat_investigations_created_at",
        table_name="threat_investigations",
    )

    op.drop_index(
        "ix_threat_investigations_model_version",
        table_name="threat_investigations",
    )

    op.drop_index(
        "ix_threat_investigations_category",
        table_name="threat_investigations",
    )

    op.drop_index(
        "ix_threat_investigations_severity",
        table_name="threat_investigations",
    )

    op.drop_index(
        "ix_threat_investigations_risk_level",
        table_name="threat_investigations",
    )

    op.drop_index(
        "ix_threat_investigations_threat_label",
        table_name="threat_investigations",
    )

    op.drop_index(
        "ix_threat_investigations_classifier_label",
        table_name="threat_investigations",
    )

    op.drop_index(
        "ix_threat_investigations_text_hash",
        table_name="threat_investigations",
    )

    op.drop_table("threat_investigations")
