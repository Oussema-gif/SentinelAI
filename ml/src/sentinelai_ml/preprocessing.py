from __future__ import annotations

import re
from typing import Any

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

_WHITESPACE_PATTERN = re.compile(r"\s+")


class TextCleaner(BaseEstimator, TransformerMixin):
    """
    Conservative text normalization for SentinelAI V1.

    Based on Phase 2 EDA decisions:
    - preserve case
    - preserve punctuation
    - preserve digits
    - preserve Unicode
    - preserve SMS abbreviations
    - preserve URL-like content
    - normalize repeated whitespace
    - strip surrounding whitespace
    """

    def fit(
        self,
        X: Any,
        y: Any = None,
    ) -> TextCleaner:
        self._validate_texts(X)
        return self

    def transform(self, X: Any) -> np.ndarray:
        texts = self._validate_texts(X)

        cleaned = [_WHITESPACE_PATTERN.sub(" ", text).strip() for text in texts]

        return np.asarray(cleaned, dtype=object)

    @staticmethod
    def _validate_texts(X: Any) -> list[str]:
        try:
            texts = list(X)
        except TypeError as exc:
            raise TypeError("Expected an iterable of text values.") from exc

        for index, text in enumerate(texts):
            if not isinstance(text, str):
                raise TypeError(
                    f"Expected text at index {index}, received {type(text).__name__}."
                )

        return texts
