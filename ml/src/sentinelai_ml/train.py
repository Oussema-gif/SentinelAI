from __future__ import annotations

import hashlib
import json
import platform
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from importlib.metadata import PackageNotFoundError, version
from itertools import pairwise
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.base import ClassifierMixin
from sklearn.calibration import calibration_curve
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import (
    GridSearchCV,
    StratifiedGroupKFold,
    cross_val_predict,
)
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC

from sentinelai_ml.pipeline import build_pipeline

PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATASET_PATH = PROJECT_ROOT / "ml" / "data" / "raw" / "SMSSpamCollection"
MODELS_DIR = PROJECT_ROOT / "ml" / "models"
DOCS_DIR = PROJECT_ROOT / "docs"

MODEL_VERSION = "sentinelai-sms-v1.0.0"

RANDOM_STATE = 42
N_SPLITS = 5


def _spam_probability_or_score(estimator: Any, X: Any) -> np.ndarray:
    if hasattr(estimator, "predict_proba"):
        probabilities = estimator.predict_proba(X)
        classes = list(estimator.classes_)
        spam_index = classes.index("spam")
        return probabilities[:, spam_index]

    if hasattr(estimator, "decision_function"):
        return np.asarray(estimator.decision_function(X))

    raise TypeError("Estimator must provide predict_proba or decision_function.")


def spam_precision_scorer(estimator: Any, X: Any, y: Any) -> float:
    predictions = estimator.predict(X)
    return float(
        precision_score(
            y,
            predictions,
            pos_label="spam",
            zero_division=0,
        )
    )


def spam_recall_scorer(estimator: Any, X: Any, y: Any) -> float:
    predictions = estimator.predict(X)
    return float(
        recall_score(
            y,
            predictions,
            pos_label="spam",
            zero_division=0,
        )
    )


def spam_f1_scorer(estimator: Any, X: Any, y: Any) -> float:
    predictions = estimator.predict(X)
    return float(
        f1_score(
            y,
            predictions,
            pos_label="spam",
            zero_division=0,
        )
    )


def spam_pr_auc_scorer(estimator: Any, X: Any, y: Any) -> float:
    scores = _spam_probability_or_score(estimator, X)
    y_binary = (np.asarray(y) == "spam").astype(int)
    return float(average_precision_score(y_binary, scores))


@dataclass(frozen=True)
class CandidateResult:
    model_family: str
    best_params: dict[str, Any]
    mean_precision: float
    mean_recall: float
    mean_f1: float
    mean_pr_auc: float
    std_f1: float
    cv_score: float


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def normalize_for_grouping(text: str) -> str:
    """
    Conservative normalization used only to prevent duplicate contamination.

    This is intentionally separate from the production TextCleaner.
    """

    return re.sub(r"\s+", " ", text.strip().lower())


def load_dataset() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATASET_PATH}")

    rows: list[dict[str, Any]] = []

    with DATASET_PATH.open("r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if "\t" not in line:
                raise ValueError(f"Malformed row at line {line_number}")

            label, message = line.rstrip("\n").split("\t", maxsplit=1)

            rows.append(
                {
                    "message": message,
                    "label": label,
                    "group": normalize_for_grouping(message),
                }
            )

    dataframe = pd.DataFrame(rows)

    if set(dataframe["label"].unique()) != {"ham", "spam"}:
        raise ValueError("Dataset must contain exactly ham and spam labels.")

    conflicting_groups = (
        dataframe.groupby("group")["label"].nunique().loc[lambda values: values > 1]
    )

    if not conflicting_groups.empty:
        raise ValueError(
            "Some normalized message groups contain conflicting labels. "
            f"Conflicting groups: {len(conflicting_groups)}"
        )

    return dataframe


def create_final_holdout(
    dataframe: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Create a duplicate-aware, approximately stratified final holdout.

    We use one fold from StratifiedGroupKFold so normalized duplicate groups
    cannot cross train/test boundaries.
    """

    splitter = StratifiedGroupKFold(
        n_splits=N_SPLITS,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    train_indices, test_indices = next(
        splitter.split(
            dataframe["message"],
            dataframe["label"],
            groups=dataframe["group"],
        )
    )

    development = dataframe.iloc[train_indices].reset_index(drop=True)
    final_test = dataframe.iloc[test_indices].reset_index(drop=True)

    train_groups = set(development["group"])
    test_groups = set(final_test["group"])

    overlap = train_groups & test_groups

    if overlap:
        raise RuntimeError(
            f"Duplicate-group leakage detected: {len(overlap)} overlapping groups."
        )

    return development, final_test


def build_candidates() -> dict[str, tuple[ClassifierMixin, dict[str, list[Any]]]]:
    return {
        "Multinomial Naive Bayes": (
            MultinomialNB(),
            {
                "classifier__alpha": [0.1, 0.5, 1.0],
            },
        ),
        "Logistic Regression": (
            LogisticRegression(
                max_iter=3000,
                random_state=RANDOM_STATE,
            ),
            {
                "classifier__C": [0.5, 1.0, 2.0],
                "classifier__class_weight": [None, "balanced"],
            },
        ),
        "Linear SVM": (
            LinearSVC(
                random_state=RANDOM_STATE,
                max_iter=5000,
            ),
            {
                "classifier__C": [0.5, 1.0, 2.0],
                "classifier__class_weight": [None, "balanced"],
            },
        ),
    }


def evaluate_predictions(
    y_true: pd.Series | np.ndarray,
    predictions: np.ndarray,
    scores: np.ndarray | None = None,
) -> dict[str, float]:
    metrics = {
        "accuracy": round(
            float(accuracy_score(y_true, predictions)),
            6,
        ),
        "precision": round(
            float(
                precision_score(
                    y_true,
                    predictions,
                    pos_label="spam",
                    zero_division=0,
                )
            ),
            6,
        ),
        "recall": round(
            float(
                recall_score(
                    y_true,
                    predictions,
                    pos_label="spam",
                    zero_division=0,
                )
            ),
            6,
        ),
        "f1": round(
            float(
                f1_score(
                    y_true,
                    predictions,
                    pos_label="spam",
                    zero_division=0,
                )
            ),
            6,
        ),
    }

    if scores is not None:
        metrics["pr_auc"] = round(
            float(average_precision_score(y_true == "spam", scores)),
            6,
        )

    return metrics


def calibration_audit(
    estimator: Any,
    X: pd.Series,
    y: pd.Series,
    groups: pd.Series,
) -> dict[str, Any]:
    """
    Audit native probability outputs using grouped out-of-fold predictions.

    A native predict_proba result is intentionally NOT automatically approved
    as a user-facing probability.
    """

    if not hasattr(estimator, "predict_proba"):
        return {
            "available": False,
            "approved": False,
            "reason": "Selected classifier has no native predict_proba.",
            "confidence_type": "decision_score_or_none",
        }

    splitter = StratifiedGroupKFold(
        n_splits=N_SPLITS,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    probabilities = cross_val_predict(
        estimator,
        X,
        y,
        groups=groups,
        cv=splitter,
        method="predict_proba",
        n_jobs=-1,
    )

    classes = list(estimator.classes_)
    spam_index = classes.index("spam")

    spam_probabilities = probabilities[:, spam_index]
    y_binary = (y.to_numpy() == "spam").astype(int)

    brier = float(
        brier_score_loss(
            y_binary,
            spam_probabilities,
        )
    )

    fraction_positive, mean_predicted_value = calibration_curve(
        y_binary,
        spam_probabilities,
        n_bins=10,
        strategy="uniform",
    )

    ece = 0.0

    bins = np.linspace(0.0, 1.0, 11)

    for lower, upper in pairwise(bins):
        mask = (spam_probabilities >= lower) & (
            spam_probabilities < upper if upper < 1.0 else spam_probabilities <= upper
        )

        if not np.any(mask):
            continue

        empirical_rate = float(y_binary[mask].mean())
        predicted_rate = float(spam_probabilities[mask].mean())
        weight = float(mask.mean())

        ece += weight * abs(empirical_rate - predicted_rate)

    return {
        "available": True,
        "approved": False,
        "confidence_type": "native_probability_pending_calibration_review",
        "brier_score": round(brier, 6),
        "expected_calibration_error": round(ece, 6),
        "reliability_points": [
            {
                "mean_predicted_probability": round(float(predicted), 6),
                "fraction_positive": round(float(actual), 6),
            }
            for predicted, actual in zip(
                mean_predicted_value,
                fraction_positive,
                strict=True,
            )
        ],
        "note": (
            "Native probabilities are not automatically exposed as user-facing "
            "confidence. Phase 5 must use this audit before labeling a value "
            "as a probability."
        ),
    }


def package_versions() -> dict[str, str]:
    package_names = [
        "numpy",
        "pandas",
        "scikit-learn",
        "joblib",
    ]

    versions: dict[str, str] = {}

    for package_name in package_names:
        try:
            versions[package_name] = version(package_name)
        except PackageNotFoundError:
            versions[package_name] = "unknown"

    versions["python"] = platform.python_version()

    return versions


def write_model_comparison(
    results: list[CandidateResult],
    selected_name: str,
    final_test_metrics: dict[str, float],
    calibration: dict[str, Any],
    dataset_hash: str,
    development: pd.DataFrame,
    final_test: pd.DataFrame,
) -> None:
    path = DOCS_DIR / "model_comparison.md"

    lines = [
        "# SentinelAI V1 — Model Comparison",
        "",
        "## Dataset and Evaluation Protocol",
        "",
        f"- Dataset SHA-256: `{dataset_hash}`",
        f"- Total records: {len(development) + len(final_test):,}",
        f"- Development records: {len(development):,}",
        f"- Final holdout records: {len(final_test):,}",
        "- CV strategy: StratifiedGroupKFold",
        f"- CV folds: {N_SPLITS}",
        f"- Random seed: {RANDOM_STATE}",
        "- Group key: conservative normalized message",
        "",
        (
            "The final holdout was isolated before model comparison and was not used "
            "for model selection or hyperparameter tuning."
        ),
        "",
        "## Model Selection Policy",
        "",
        (
            "The dataset contains 13.4015% spam and 86.5985% ham. Accuracy is therefore "
            "not sufficient as the primary selection criterion."
        ),
        "",
        (
            "For V1, F1 is the primary selection metric because no production operator "
            "has supplied an asymmetric false-positive/false-negative cost matrix. "
            "Precision, recall, and PR-AUC remain mandatory secondary measures."
        ),
        "",
        (
            "If deployment requirements later establish a different operational cost, "
            "the selection rule should be revisited rather than silently changing it."
        ),
        "",
        "## Cross-Validation Results",
        "",
        "| Model | Precision | Recall | F1 | PR-AUC | F1 Std |",
        "|---|---:|---:|---:|---:|---:|",
    ]

    for result in results:
        lines.append(
            f"| {result.model_family} | "
            f"{result.mean_precision:.6f} | "
            f"{result.mean_recall:.6f} | "
            f"{result.mean_f1:.6f} | "
            f"{result.mean_pr_auc:.6f} | "
            f"{result.std_f1:.6f} |"
        )

    selected = next(
        result for result in results if result.model_family == selected_name
    )

    lines.extend(
        [
            "",
            "## Selected Model",
            "",
            f"**{selected_name}**",
            "",
            (
                "Selection was made from the cross-validation comparison above using "
                "mean F1 as the primary criterion, with PR-AUC as a secondary tie-break."
            ),
            "",
            "Best hyperparameters:",
            "",
            "```json",
            json.dumps(selected.best_params, indent=2),
            "```",
            "",
            "## Final Held-Out Test Metrics",
            "",
            "| Metric | Value |",
            "|---|---:|",
        ]
    )

    for metric, value in final_test_metrics.items():
        lines.append(f"| {metric} | {value:.6f} |")

    lines.extend(
        [
            "",
            "## Calibration Audit",
            "",
            "```json",
            json.dumps(calibration, indent=2),
            "```",
            "",
            (
                "User-facing confidence is not approved merely because a classifier "
                "implements `predict_proba`. Calibration must be reviewed and, if "
                "necessary, explicitly calibrated before a probability is exposed."
            ),
            "",
            "## Limitations",
            "",
            "- Benchmark performance does not establish production performance.",
            "- The dataset is English-language and consists of short messages.",
            (
                "- Duplicate-aware evaluation reduces contamination but does not "
                "eliminate domain-shift risk."
            ),
            (
                "- V1 does not include phishing, malicious URL, or multi-class threat "
                "detection."
            ),
        ]
    )

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def train() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    DOCS_DIR.mkdir(parents=True, exist_ok=True)

    dataframe = load_dataset()

    development, final_test = create_final_holdout(dataframe)

    X_dev = development["message"]
    y_dev = development["label"]
    groups_dev = development["group"]

    X_test = final_test["message"]
    y_test = final_test["label"]

    cv = StratifiedGroupKFold(
        n_splits=N_SPLITS,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    candidates = build_candidates()

    results: list[CandidateResult] = []
    fitted_models: dict[str, Any] = {}

    print("========================================")
    print(" SentinelAI Model Training")
    print("========================================")
    print(f"Dataset rows: {len(dataframe):,}")
    print(f"Development rows: {len(development):,}")
    print(f"Final test rows: {len(final_test):,}")
    print(
        "Development/test duplicate-group overlap:",
        len(set(development["group"]) & set(final_test["group"])),
    )
    print()

    for model_name, (classifier, param_grid) in candidates.items():
        print(f"Training candidate: {model_name}")

        pipeline = build_pipeline(classifier)

        search = GridSearchCV(
            estimator=pipeline,
            param_grid=param_grid,
            scoring={
                "precision": spam_precision_scorer,
                "recall": spam_recall_scorer,
                "f1": spam_f1_scorer,
                "pr_auc": spam_pr_auc_scorer,
            },
            refit="f1",
            cv=cv,
            n_jobs=-1,
            return_train_score=False,
        )

        search.fit(
            X_dev,
            y_dev,
            groups=groups_dev,
        )

        index = search.best_index_
        cv_results = search.cv_results_

        result = CandidateResult(
            model_family=model_name,
            best_params=search.best_params_,
            mean_precision=round(
                float(cv_results["mean_test_precision"][index]),
                6,
            ),
            mean_recall=round(
                float(cv_results["mean_test_recall"][index]),
                6,
            ),
            mean_f1=round(
                float(cv_results["mean_test_f1"][index]),
                6,
            ),
            mean_pr_auc=round(
                float(cv_results["mean_test_pr_auc"][index]),
                6,
            ),
            std_f1=round(
                float(cv_results["std_test_f1"][index]),
                6,
            ),
            cv_score=round(
                float(search.best_score_),
                6,
            ),
        )

        results.append(result)
        fitted_models[model_name] = search.best_estimator_

        print(
            f"  F1={result.mean_f1:.6f} "
            f"Recall={result.mean_recall:.6f} "
            f"PR-AUC={result.mean_pr_auc:.6f}"
        )

    results.sort(
        key=lambda result: (
            result.mean_f1,
            result.mean_pr_auc,
        ),
        reverse=True,
    )

    selected_name = results[0].model_family
    selected_model = fitted_models[selected_name]

    print()
    print(f"Selected model: {selected_name}")
    print(f"Best parameters: {results[0].best_params}")

    # The selected GridSearchCV estimator is already refit on all development
    # data after CV selection. This is the first and only model fit before the
    # final holdout is evaluated.
    predictions = selected_model.predict(X_test)

    scores: np.ndarray | None = None

    if hasattr(selected_model, "predict_proba"):
        probabilities = selected_model.predict_proba(X_test)
        classes = list(selected_model.classes_)
        spam_index = classes.index("spam")
        scores = probabilities[:, spam_index]
    elif hasattr(selected_model, "decision_function"):
        scores = selected_model.decision_function(X_test)

    final_test_metrics = evaluate_predictions(
        y_test,
        predictions,
        scores=scores,
    )

    calibration = calibration_audit(
        selected_model,
        X_dev,
        y_dev,
        groups_dev,
    )

    dataset_hash = sha256_file(DATASET_PATH)

    metadata = {
        "model_version": MODEL_VERSION,
        "dataset": {
            "path": str(DATASET_PATH.relative_to(PROJECT_ROOT)),
            "sha256": dataset_hash,
            "rows": len(dataframe),
            "ham": int((dataframe["label"] == "ham").sum()),
            "spam": int((dataframe["label"] == "spam").sum()),
            "exact_duplicate_rows": 403,
            "normalized_duplicate_rows": int(
                len(dataframe)
                - dataframe[["label", "group"]].drop_duplicates().shape[0]
            ),
        },
        "preprocessing_version": "phase3-conservative-whitespace-v1",
        "model_type": selected_name,
        "hyperparameters": results[0].best_params,
        "training_date_utc": datetime.now(timezone.utc).isoformat(),
        "random_state": RANDOM_STATE,
        "cv": {
            "strategy": "StratifiedGroupKFold",
            "n_splits": N_SPLITS,
            "group_definition": "lowercase + whitespace normalization",
        },
        "development_rows": len(development),
        "final_test_rows": len(final_test),
        "cv_results": [asdict(result) for result in results],
        "final_test_metrics": final_test_metrics,
        "calibration": calibration,
        "package_versions": package_versions(),
    }

    artifact_path = MODELS_DIR / f"{MODEL_VERSION}.joblib"
    metadata_path = MODELS_DIR / f"{MODEL_VERSION}.metadata.json"

    joblib.dump(
        selected_model,
        artifact_path,
    )

    metadata_path.write_text(
        json.dumps(metadata, indent=2) + "\n",
        encoding="utf-8",
    )

    write_model_comparison(
        results,
        selected_name,
        final_test_metrics,
        calibration,
        dataset_hash,
        development,
        final_test,
    )

    print()
    print("========================================")
    print(" Final Held-Out Test")
    print("========================================")

    for metric, value in final_test_metrics.items():
        print(f"{metric}: {value:.6f}")

    print()
    print(f"Artifact: {artifact_path}")
    print(f"Metadata: {metadata_path}")
    print(f"Comparison: {DOCS_DIR / 'model_comparison.md'}")


if __name__ == "__main__":
    train()
