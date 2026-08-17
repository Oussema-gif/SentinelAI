from __future__ import annotations

from sklearn.base import ClassifierMixin
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from sentinelai_ml.preprocessing import TextCleaner

DEFAULT_TOKEN_PATTERN = r"(?u)\b\w[\w']+\b"


def build_pipeline(
    classifier: ClassifierMixin | None = None,
) -> Pipeline:
    """
    Build the single source of truth for text preprocessing and classification.

    The default classifier exists only for Phase 3 smoke tests.
    Phase 4 will supply and compare the actual candidate classifiers.

    Important:
    - TextCleaner is inside the Pipeline.
    - TF-IDF is inside the Pipeline.
    - lowercase=False preserves case information identified during EDA.
    - The vectorizer is not fitted until Pipeline.fit() is called.
    """

    if classifier is None:
        classifier = LogisticRegression(
            max_iter=1000,
            random_state=42,
        )

    vectorizer = TfidfVectorizer(
        lowercase=False,
        token_pattern=DEFAULT_TOKEN_PATTERN,
        strip_accents=None,
    )

    return Pipeline(
        steps=[
            ("cleaner", TextCleaner()),
            ("tfidf", vectorizer),
            ("classifier", classifier),
        ]
    )
