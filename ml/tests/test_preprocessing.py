from __future__ import annotations

import numpy as np
import pytest
from sentinelai_ml.pipeline import build_pipeline
from sentinelai_ml.preprocessing import TextCleaner
from sklearn.linear_model import LogisticRegression


def test_cleaner_normalizes_whitespace_without_destroying_content() -> None:
    cleaner = TextCleaner()

    result = cleaner.fit_transform(
        [
            "  FREE   50%   NOW!!!  ",
            "U ÄM 4u ü £",
        ]
    )

    assert result.tolist() == [
        "FREE 50% NOW!!!",
        "U ÄM 4u ü £",
    ]


def test_cleaner_handles_empty_string() -> None:
    cleaner = TextCleaner()

    result = cleaner.fit_transform([""])

    assert result.tolist() == [""]


def test_cleaner_preserves_non_ascii() -> None:
    cleaner = TextCleaner()

    result = cleaner.fit_transform(["I’ll pay £50 — déjà vu ü"])

    assert result[0] == "I’ll pay £50 — déjà vu ü"


def test_cleaner_preserves_uppercase_and_digits() -> None:
    cleaner = TextCleaner()

    result = cleaner.fit_transform(["FREE 2 WIN 50% NOW"])

    assert result[0] == "FREE 2 WIN 50% NOW"


def test_cleaner_preserves_html_fragments() -> None:
    cleaner = TextCleaner()

    result = cleaner.fit_transform(["<b>FREE</b> <a href='example.com'>CLICK</a>"])

    assert result[0] == "<b>FREE</b> <a href='example.com'>CLICK</a>"


def test_cleaner_handles_very_long_input() -> None:
    cleaner = TextCleaner()

    message = "A" * 100_000
    result = cleaner.fit_transform([message])

    assert result[0] == message
    assert len(result[0]) == 100_000


def test_cleaner_rejects_non_string_values() -> None:
    cleaner = TextCleaner()

    with pytest.raises(TypeError, match="Expected text"):
        cleaner.fit_transform(["valid", None])


def test_pipeline_contains_cleaner_and_tfidf() -> None:
    pipeline = build_pipeline()

    assert list(pipeline.named_steps) == [
        "cleaner",
        "tfidf",
        "classifier",
    ]

    assert pipeline.named_steps["tfidf"].lowercase is False


def test_pipeline_fits_end_to_end() -> None:
    texts = [
        "hello friend",
        "FREE prize now",
        "see you tomorrow",
        "WIN money immediately",
    ]
    labels = [
        "ham",
        "spam",
        "ham",
        "spam",
    ]

    pipeline = build_pipeline(
        LogisticRegression(
            max_iter=1000,
            random_state=42,
        )
    )

    pipeline.fit(texts, labels)

    predictions = pipeline.predict(
        [
            "hello tomorrow",
            "FREE money prize",
        ]
    )

    assert predictions.shape == (2,)
    assert set(predictions).issubset({"ham", "spam"})


def test_pipeline_handles_zero_vocabulary_overlap() -> None:
    train_texts = [
        "hello friend",
        "FREE prize",
        "see you",
        "WIN money",
    ]
    labels = ["ham", "spam", "ham", "spam"]

    pipeline = build_pipeline()
    pipeline.fit(train_texts, labels)

    predictions = pipeline.predict(["zzzz qqqq"])

    assert predictions.shape == (1,)


def test_tfidf_is_fitted_only_on_training_text() -> None:
    """
    Leakage-prevention regression test.

    The validation-only token must not appear in the learned TF-IDF vocabulary
    when the Pipeline is fitted only on the training fold.

    A design that pre-fits TF-IDF on the full dataset would fail this test.
    """

    train_texts = [
        "common ham message",
        "common spam message",
        "ordinary ham text",
        "ordinary spam text",
    ]
    train_labels = [
        "ham",
        "spam",
        "ham",
        "spam",
    ]

    validation_texts = [
        "validationonlytoken exclusive",
    ]

    pipeline = build_pipeline()
    pipeline.fit(train_texts, train_labels)

    vocabulary = pipeline.named_steps["tfidf"].vocabulary_

    assert "validationonlytoken" not in vocabulary

    # The pipeline must still be able to transform the validation message.
    transformed = pipeline.named_steps["tfidf"].transform(
        pipeline.named_steps["cleaner"].transform(validation_texts)
    )

    assert transformed.shape[0] == 1
    assert transformed.shape[1] == len(vocabulary)


def test_pipeline_prediction_is_deterministic() -> None:
    texts = [
        "hello friend",
        "FREE prize now",
        "see you tomorrow",
        "WIN money immediately",
    ]
    labels = ["ham", "spam", "ham", "spam"]

    pipeline_a = build_pipeline()
    pipeline_b = build_pipeline()

    pipeline_a.fit(texts, labels)
    pipeline_b.fit(texts, labels)

    test_texts = [
        "hello there",
        "FREE money now",
        "see you soon",
    ]

    predictions_a = pipeline_a.predict(test_texts)
    predictions_b = pipeline_b.predict(test_texts)

    assert np.array_equal(predictions_a, predictions_b)
