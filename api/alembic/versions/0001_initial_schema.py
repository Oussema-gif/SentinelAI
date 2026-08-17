"""Initial SentinelAI persistence schema.

Revision ID: 0001
Revises:
Create Date: 2026-08-17
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "model_versions",
        sa.Column(
            "version",
            sa.String(length=128),
            nullable=False,
        ),
        sa.Column(
            "model_type",
            sa.String(length=128),
            nullable=False,
        ),
        sa.Column(
            "metrics",
            postgresql.JSONB,
            nullable=False,
        ),
        sa.Column(
            "trained_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean,
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("version"),
    )

    op.create_table(
        "predictions",
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
            "predicted_label",
            sa.String(length=16),
            nullable=False,
        ),
        sa.Column(
            "confidence",
            sa.Float,
            nullable=True,
        ),
        sa.Column(
            "confidence_type",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "decision_score",
            sa.Float,
            nullable=True,
        ),
        sa.Column(
            "influential_terms",
            postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
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
        "ix_predictions_text_hash",
        "predictions",
        ["text_hash"],
    )

    op.create_index(
        "ix_predictions_predicted_label",
        "predictions",
        ["predicted_label"],
    )

    op.create_index(
        "ix_predictions_model_version",
        "predictions",
        ["model_version"],
    )

    op.create_index(
        "ix_predictions_created_at",
        "predictions",
        ["created_at"],
    )

    op.create_index(
        "ix_model_versions_is_active",
        "model_versions",
        ["is_active"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_model_versions_is_active",
        table_name="model_versions",
    )

    op.drop_index(
        "ix_predictions_created_at",
        table_name="predictions",
    )

    op.drop_index(
        "ix_predictions_model_version",
        table_name="predictions",
    )

    op.drop_index(
        "ix_predictions_predicted_label",
        table_name="predictions",
    )

    op.drop_index(
        "ix_predictions_text_hash",
        table_name="predictions",
    )

    op.drop_table("predictions")
    op.drop_table("model_versions")
