from __future__ import annotations

import pandas as pd
import pytest
from sentinelai_ml.pipeline import build_pipeline
from sentinelai_ml.train import (
    build_candidates,
    create_final_holdout,
    normalize_for_grouping,
    spam_f1_scorer,
    spam_pr_auc_scorer,
    spam_precision_scorer,
    spam_recall_scorer,
)
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC


def test_normalize_for_grouping_is_conservative() -> None:
    assert normalize_for_grouping("  FREE   50%   NOW!!!  ") == "free 50% now!!!"


def test_holdout_has_no_group_overlap() -> None:
    dataframe = pd.DataFrame(
        {
            "message": [
                "same message",
                "same   message",
                "ordinary ham one",
                "ordinary ham two",
                "ordinary ham three",
                "ordinary ham four",
                "ordinary ham five",
                "free prize one",
                "free prize two",
                "another spam",
                "claim prize",
                "free offer",
                "urgent reward",
                "win money",
                "special promotion",
            ],
            "label": [
                "ham",
                "ham",
                "ham",
                "ham",
                "ham",
                "ham",
                "ham",
                "spam",
                "spam",
                "spam",
                "spam",
                "spam",
                "spam",
                "spam",
                "spam",
            ],
        }
    )

    dataframe["group"] = dataframe["message"].map(normalize_for_grouping)

    development, final_test = create_final_holdout(dataframe)

    assert set(development["group"]).isdisjoint(set(final_test["group"]))

    assert set(development["label"]) == {"ham", "spam"}
    assert set(final_test["label"]) == {"ham", "spam"}


def test_candidate_models_use_same_pipeline_factory() -> None:
    candidates = build_candidates()

    assert set(candidates) == {
        "Multinomial Naive Bayes",
        "Logistic Regression",
        "Linear SVM",
    }

    for classifier, _ in candidates.values():
        pipeline = build_pipeline(classifier)

        assert list(pipeline.named_steps) == [
            "cleaner",
            "tfidf",
            "classifier",
        ]

        assert pipeline.named_steps["tfidf"].lowercase is False


@pytest.mark.parametrize(
    "classifier",
    [
        MultinomialNB(alpha=1.0),
        LogisticRegression(max_iter=1000, random_state=42),
        LinearSVC(random_state=42, max_iter=5000),
    ],
)
def test_all_candidate_families_fit_through_same_pipeline(
    classifier,
) -> None:
    texts = [
        "hello friend",
        "FREE prize now",
        "see you tomorrow",
        "WIN money",
        "meeting at five",
        "claim your reward",
    ]
    labels = [
        "ham",
        "spam",
        "ham",
        "spam",
        "ham",
        "spam",
    ]

    pipeline = build_pipeline(classifier)
    pipeline.fit(texts, labels)

    predictions = pipeline.predict(
        [
            "hello tomorrow",
            "FREE reward",
        ]
    )

    assert predictions.shape == (2,)
    assert set(predictions).issubset({"ham", "spam"})


def test_spam_scorers_support_string_labels() -> None:
    texts = [
        "hello friend",
        "FREE prize",
        "see you later",
        "WIN money",
    ]
    labels = ["ham", "spam", "ham", "spam"]

    pipeline = build_pipeline(
        LogisticRegression(
            max_iter=1000,
            random_state=42,
        )
    )
    pipeline.fit(texts, labels)

    assert spam_precision_scorer(pipeline, texts, labels) >= 0.0
    assert spam_recall_scorer(pipeline, texts, labels) >= 0.0
    assert spam_f1_scorer(pipeline, texts, labels) >= 0.0
    assert spam_pr_auc_scorer(pipeline, texts, labels) >= 0.0
