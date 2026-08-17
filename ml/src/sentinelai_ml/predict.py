from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np

from sentinelai_ml.explain import (
    InfluentialTerm,
    extract_influential_terms,
)

PROJECT_ROOT = Path(__file__).resolve().parents[3]

DEFAULT_ARTIFACT = PROJECT_ROOT / "ml" / "models" / "sentinelai-sms-v1.0.0.joblib"

DEFAULT_MODEL_VERSION = "sentinelai-sms-v1.0.0"


@dataclass(frozen=True)
class PredictionResult:
    label: str
    confidence: float | None
    confidence_type: str
    decision_score: float | None
    influential_terms: tuple[InfluentialTerm, ...]
    model_version: str

    def to_dict(self) -> dict[str, Any]:
        result = asdict(self)

        result["influential_terms"] = [
            term.to_dict() for term in self.influential_terms
        ]

        return result


class SentinelPredictor:
    """Artifact-backed, framework-agnostic SentinelAI inference contract."""

    def __init__(
        self,
        pipeline: Any,
        *,
        model_version: str = DEFAULT_MODEL_VERSION,
    ) -> None:
        self._pipeline = pipeline
        self._model_version = model_version

        classifier = self._pipeline.named_steps.get("classifier")

        if classifier is None:
            raise ValueError("Artifact pipeline is missing a classifier step.")

        classes = list(getattr(classifier, "classes_", []))

        if classes != ["ham", "spam"]:
            raise ValueError("SentinelAI V1 requires binary classes ['ham', 'spam'].")

    @classmethod
    def from_artifact(
        cls,
        artifact_path: str | Path = DEFAULT_ARTIFACT,
        *,
        model_version: str = DEFAULT_MODEL_VERSION,
    ) -> SentinelPredictor:
        path = Path(artifact_path)

        if not path.exists():
            raise FileNotFoundError(f"Model artifact not found: {path}")

        pipeline = joblib.load(path)

        return cls(
            pipeline,
            model_version=model_version,
        )

    def predict(
        self,
        text: str,
        *,
        top_k: int = 5,
    ) -> PredictionResult:
        if not isinstance(text, str):
            raise TypeError("text must be a string.")

        if not text.strip():
            raise ValueError("text must not be empty.")

        prediction = str(self._pipeline.predict([text])[0])

        decision_score: float | None = None

        classifier = self._pipeline.named_steps["classifier"]

        if hasattr(classifier, "decision_function"):
            raw_score = self._pipeline.decision_function([text])
            score_array = np.asarray(raw_score).reshape(-1)

            if score_array.size != 1:
                raise ValueError("Expected exactly one decision score.")

            decision_score = round(
                float(score_array[0]),
                8,
            )

        influential_terms = extract_influential_terms(
            self._pipeline,
            text,
            top_k=top_k,
        )

        return PredictionResult(
            label=prediction,
            confidence=None,
            confidence_type="decision_score_not_probability",
            decision_score=decision_score,
            influential_terms=influential_terms,
            model_version=self._model_version,
        )


def load_predictor(
    artifact_path: str | Path = DEFAULT_ARTIFACT,
    *,
    model_version: str = DEFAULT_MODEL_VERSION,
) -> SentinelPredictor:
    """Load the model artifact once."""

    return SentinelPredictor.from_artifact(
        artifact_path,
        model_version=model_version,
    )


def predict(
    text: str,
    *,
    predictor: SentinelPredictor | None = None,
    top_k: int = 5,
) -> PredictionResult:
    """Framework-agnostic prediction entry point."""

    active_predictor = predictor or load_predictor()

    return active_predictor.predict(
        text,
        top_k=top_k,
    )
