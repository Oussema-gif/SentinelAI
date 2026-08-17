from __future__ import annotations

from pathlib import Path

import pytest
from sentinelai_ml.pipeline import build_pipeline
from sentinelai_ml.predict import (
    PredictionResult,
    SentinelPredictor,
)

ARTIFACT = Path("ml/models/sentinelai-sms-v1.0.0.joblib")


def train_fixture_predictor() -> SentinelPredictor:
    texts = [
        "hello friend",
        "see you tomorrow",
        "meeting later",
        "FREE prize now",
        "WIN money now",
        "claim your reward",
        "hello there",
        "FREE entry prize",
    ]

    labels = [
        "ham",
        "ham",
        "ham",
        "spam",
        "spam",
        "spam",
        "ham",
        "spam",
    ]

    pipeline = build_pipeline()
    pipeline.fit(texts, labels)

    return SentinelPredictor(
        pipeline,
        model_version="test-model",
    )


def test_prediction_result_shape() -> None:
    predictor = train_fixture_predictor()

    result = predictor.predict("FREE prize now")

    assert isinstance(result, PredictionResult)
    assert result.label in {"ham", "spam"}
    assert result.confidence is None
    assert result.confidence_type == ("decision_score_not_probability")
    assert result.decision_score is not None
    assert result.model_version == "test-model"


def test_prediction_contains_model_derived_explanations() -> None:
    predictor = train_fixture_predictor()

    result = predictor.predict(
        "FREE prize now",
        top_k=3,
    )

    assert result.influential_terms
    assert len(result.influential_terms) <= 6

    for term in result.influential_terms:
        assert term.term
        assert term.contribution != 0
        assert term.direction in {"ham", "spam"}


def test_prediction_is_deterministic() -> None:
    predictor = train_fixture_predictor()

    first = predictor.predict(
        "FREE prize now",
        top_k=3,
    )

    second = predictor.predict(
        "FREE prize now",
        top_k=3,
    )

    assert first.to_dict() == second.to_dict()


def test_empty_message_is_rejected() -> None:
    predictor = train_fixture_predictor()

    with pytest.raises(
        ValueError,
        match="must not be empty",
    ):
        predictor.predict("   ")


def test_non_string_input_is_rejected() -> None:
    predictor = train_fixture_predictor()

    with pytest.raises(
        TypeError,
        match="must be a string",
    ):
        predictor.predict(123)  # type: ignore[arg-type]


def test_top_k_must_be_positive() -> None:
    predictor = train_fixture_predictor()

    with pytest.raises(
        ValueError,
        match="top_k",
    ):
        predictor.predict(
            "hello",
            top_k=0,
        )


def test_real_artifact_loads_and_predicts() -> None:
    if not ARTIFACT.exists():
        pytest.skip("Phase 4 artifact is not present yet.")

    predictor = SentinelPredictor.from_artifact(
        ARTIFACT,
        model_version="sentinelai-sms-v1.0.0",
    )

    result = predictor.predict("URGENT! You have won a £500 prize. Call now!")

    assert result.label in {"ham", "spam"}
    assert result.confidence is None
    assert result.confidence_type == ("decision_score_not_probability")
    assert result.decision_score is not None
    assert result.model_version == ("sentinelai-sms-v1.0.0")
