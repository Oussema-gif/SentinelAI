from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
from scipy import sparse


@dataclass(frozen=True)
class InfluentialTerm:
    term: str
    contribution: float
    direction: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "term": self.term,
            "contribution": self.contribution,
            "direction": self.direction,
        }


def extract_influential_terms(
    pipeline: Any,
    text: str,
    *,
    top_k: int = 5,
) -> tuple[InfluentialTerm, ...]:
    """
    Explain a binary linear-model prediction using learned coefficients.

    For each present TF-IDF feature:

        contribution = tfidf_value * learned_coefficient

    Positive contributions point toward spam.
    Negative contributions point toward ham.
    """

    if top_k < 1:
        raise ValueError("top_k must be at least 1.")

    classifier = pipeline.named_steps["classifier"]
    vectorizer = pipeline.named_steps["tfidf"]
    cleaner = pipeline.named_steps["cleaner"]

    if not hasattr(classifier, "coef_"):
        raise TypeError(
            "Influential-term extraction requires a linear classifier with coef_."
        )

    classes = list(classifier.classes_)

    if classes != ["ham", "spam"]:
        raise ValueError(f"Expected binary classes ['ham', 'spam'], got {classes!r}.")

    coefficients = np.asarray(classifier.coef_)

    if coefficients.shape[0] != 1:
        raise ValueError(
            "Expected a binary linear classifier with one coefficient vector."
        )

    cleaned_text = cleaner.transform([text])
    transformed = vectorizer.transform(cleaned_text)

    if not sparse.issparse(transformed):
        transformed = sparse.csr_matrix(transformed)

    row = transformed.getrow(0)
    feature_names = vectorizer.get_feature_names_out()
    coef = coefficients[0]

    contributions: list[InfluentialTerm] = []

    for feature_index, tfidf_value in zip(
        row.indices,
        row.data,
        strict=True,
    ):
        contribution = float(tfidf_value * coef[feature_index])

        if contribution > 0:
            direction = "spam"
        elif contribution < 0:
            direction = "ham"
        else:
            continue

        contributions.append(
            InfluentialTerm(
                term=str(feature_names[feature_index]),
                contribution=round(contribution, 8),
                direction=direction,
            )
        )

    contributions.sort(
        key=lambda item: (
            -abs(item.contribution),
            item.term,
            item.direction,
        )
    )

    spam_terms = [item for item in contributions if item.direction == "spam"][:top_k]

    ham_terms = [item for item in contributions if item.direction == "ham"][:top_k]

    return tuple(
        sorted(
            [*spam_terms, *ham_terms],
            key=lambda item: (
                -abs(item.contribution),
                item.term,
            ),
        )
    )
