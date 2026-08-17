from __future__ import annotations

import hashlib
import os

import pytest
from sentinelai_ml.explain import InfluentialTerm
from sentinelai_ml.predict import PredictionResult
from sqlalchemy import delete, text
from sqlalchemy.orm import Session

from api.app.db.models import Prediction
from api.app.db.session import SessionLocal
from api.app.services.prediction_repository import (
    PostgreSQLPredictionRepository,
)

pytestmark = pytest.mark.skipif(
    not os.getenv("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL is not configured.",
)


def make_result() -> PredictionResult:
    return PredictionResult(
        label="spam",
        confidence=None,
        confidence_type="decision_score_not_probability",
        decision_score=1.88297545,
        influential_terms=(
            InfluentialTerm(
                term="prize",
                contribution=0.42695131,
                direction="spam",
            ),
            InfluentialTerm(
                term="Call",
                contribution=0.69011176,
                direction="spam",
            ),
        ),
        model_version="sentinelai-sms-v1.0.0",
    )


@pytest.fixture
def session() -> Session:
    session = SessionLocal()

    session.execute(delete(Prediction))
    session.commit()

    try:
        yield session
    finally:
        session.execute(delete(Prediction))
        session.commit()
        session.close()


def test_prediction_round_trip(session: Session) -> None:
    repository = PostgreSQLPredictionRepository(session)

    message = "URGENT! You have won a £500 prize. Call now!"
    result = make_result()

    stored = repository.save(
        message,
        result,
    )

    assert stored.id > 0
    assert stored.result.label == "spam"
    assert stored.result.confidence is None
    assert stored.result.confidence_type == "decision_score_not_probability"
    assert stored.result.decision_score == pytest.approx(1.88297545)
    assert stored.result.model_version == ("sentinelai-sms-v1.0.0")

    assert stored.result.influential_terms[0].term == "prize"


def test_raw_text_is_not_stored(
    session: Session,
) -> None:
    repository = PostgreSQLPredictionRepository(session)

    message = "PRIVATE MESSAGE SHOULD NOT BE STORED"

    stored = repository.save(
        message,
        make_result(),
    )

    expected_hash = hashlib.sha256(message.encode("utf-8")).hexdigest()

    row = session.execute(
        text(
            """
            SELECT text_hash
            FROM predictions
            WHERE id = :id
            """
        ),
        {"id": stored.id},
    ).one()

    assert row.text_hash == expected_hash

    columns = (
        session.execute(
            text(
                """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'predictions'
            """
            )
        )
        .scalars()
        .all()
    )

    assert "text" not in columns
    assert "message" not in columns


def test_prediction_history_and_counts(
    session: Session,
) -> None:
    repository = PostgreSQLPredictionRepository(session)

    repository.save(
        "hello there",
        PredictionResult(
            label="ham",
            confidence=None,
            confidence_type="decision_score_not_probability",
            decision_score=-1.2,
            influential_terms=(),
            model_version="sentinelai-sms-v1.0.0",
        ),
    )

    repository.save(
        "free prize",
        make_result(),
    )

    items, total = repository.list(
        page=1,
        page_size=20,
    )

    assert total >= 2
    assert len(items) >= 2

    total_count, ham_count, spam_count = repository.counts()

    assert total_count >= 2
    assert ham_count >= 1
    assert spam_count >= 1
