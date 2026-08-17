# SentinelAI — Project Status

## Current Phase

Phase 5 — Inference Contract & Explanation Layer

## Completed Phases

- Phase 0 — Environment & Repository Bootstrap — August 17, 2026
- Phase 1 — Dataset Acquisition & Validation — August 17, 2026
- Phase 2 — Exploratory Data Analysis — August 17, 2026
- Phase 3 — Preprocessing & Leak-Free Feature Pipeline — August 17, 2026
- Phase 4 — Model Training, Comparison & Selection — August 17, 2026
- Phase 5 — Inference Contract & Explanation Layer — August 17, 2026

## Key Decisions

- Monorepo architecture with `ml/`, `api/`, and `frontend/`
- Python virtual environments for ML and API
- PostgreSQL 16
- Alembic for database migrations
- React + TypeScript + Vite for the frontend
- Docker Compose for full-stack orchestration
- Primary dataset: UCI SMS Spam Collection
- Dataset license: CC BY 4.0
- Dataset acquisition is reproducible through a Python download script
- Raw dataset files are excluded from Git
- Duplicate rows are reported rather than automatically deleted
- Duplicate contamination must be prevented during model evaluation
- Core dataset validation is implemented with failure-oriented tests

## Dataset Validation

- Rows: 5,574
- Ham: 4,827 (86.5985%)
- Spam: 747 (13.4015%)
- Duplicate rows: 403
- Minimum message length: 2
- Maximum message length: 910
- Mean message length: 80.4783
- Median message length: 62

## Open Questions

- Determine preprocessing decisions from Phase 2 EDA.
- Determine the exact duplicate-handling strategy for train/test evaluation.
- Determine the final metric-selection policy from the observed class imbalance.

## Known Issues

- No known Phase 1 validation failures.
- Full-stack Dockerization is intentionally deferred to later phases.

## Next Phase

Phase 6 — FastAPI Service

## Phase 1 Exit Gate

- [x] Dataset acquired programmatically
- [x] Source and license documented
- [x] Dataset schema validated
- [x] Encoding validated
- [x] Invalid labels rejected
- [x] Empty messages rejected
- [x] Duplicate rows detected and quantified
- [x] Class balance measured
- [x] Message length distribution measured
- [x] Failure-oriented validation tests pass
- [x] Real dataset validation passes

## Approval

Phase 2 requires explicit approval from Oussema before implementation begins.


## Phase 2 Exit Gate

- [x] Class balance analyzed
- [x] Message length analyzed
- [x] Raw token frequencies analyzed
- [x] Exact duplicates analyzed
- [x] Normalized duplicates analyzed
- [x] Punctuation density analyzed
- [x] Digit density analyzed
- [x] Uppercase density analyzed
- [x] Unicode usage analyzed
- [x] Explicit preprocessing decisions documented
- [x] EDA notebook saved
- [x] EDA report saved
- [x] Existing ML test suite passes

## Approval

Phase 3 requires explicit approval from Oussema before implementation begins.


## Phase 3 Exit Gate

- [x] Custom sklearn-compatible text transformer implemented
- [x] Conservative preprocessing policy implemented from Phase 2
- [x] TF-IDF contained inside the production Pipeline
- [x] Classifier contained inside the production Pipeline
- [x] Case information preserved
- [x] Digits preserved
- [x] Punctuation preserved
- [x] Unicode preserved
- [x] SMS abbreviations preserved
- [x] URL-like content preserved
- [x] Empty-string edge case tested
- [x] Non-ASCII edge case tested
- [x] Uppercase and digit preservation tested
- [x] HTML-fragment edge case tested
- [x] Very-long-input edge case tested
- [x] Invalid input types rejected
- [x] Pipeline end-to-end test passed
- [x] Zero-vocabulary-overlap case tested
- [x] Leakage-prevention regression test passed
- [x] Deterministic prediction test passed
- [x] Ruff checks passed
- [x] Ruff formatting passed
- [x] Full ML suite passes

## Approval

Phase 4 requires explicit approval from Oussema before implementation begins.


## Phase 4 Model Selection

- Selected model: Linear SVM
- Hyperparameters:
  - C: 2.0
  - class_weight: balanced
- CV F1: 0.949272
- CV PR-AUC: 0.981990
- Final held-out F1: 0.954704
- Final held-out precision: 1.000000
- Final held-out recall: 0.913333
- Final held-out PR-AUC: 0.968298
- Final holdout size: 1,115
- Duplicate-group overlap: 0
- Probability exposure: not approved; selected model has no native predict_proba

## Phase 4 Exit Gate

- [x] Final holdout isolated before model comparison
- [x] Duplicate-aware holdout implemented
- [x] Three model families compared
- [x] Identical preprocessing used across candidates
- [x] Stratified grouped 5-fold CV
- [x] Precision reported
- [x] Recall reported
- [x] F1 reported
- [x] PR-AUC reported
- [x] Hyperparameter search performed
- [x] Model selected from comparison table
- [x] Final held-out test evaluated once
- [x] Calibration audited
- [x] Joblib artifact created
- [x] Metadata sidecar created
- [x] Model comparison report created
- [x] Artifact load/predict smoke test passed
- [x] Full ML test suite passes
- [x] Ruff checks pass

## Approval

Phase 5 requires explicit approval from Oussema before implementation begins.


## Phase 5 Inference Contract

- Prediction interface: `predict(text: str) -> PredictionResult`
- Artifact loaded once through `SentinelPredictor`
- Selected model: Linear SVM
- Probability exposure: not approved
- Confidence type: `decision_score_not_probability`
- Decision score preserved separately from confidence
- Influential terms derived from TF-IDF values multiplied by learned Linear SVM coefficients
- Explanations contain direction (`ham` / `spam`) and deterministic contribution values
- Empty messages rejected
- Non-string input rejected
- Zero-vocabulary-overlap behavior tested
- Long-input behavior inherited from Phase 3 pipeline
- Artifact load/predict regression test passes

## Phase 5 Exit Gate

- [x] Pure-Python inference contract implemented
- [x] Production artifact loaded by inference layer
- [x] PredictionResult implemented
- [x] Honest confidence semantics implemented
- [x] No uncalibrated probability exposed
- [x] Linear-model explanation logic implemented
- [x] Contributions derived from real model parameters
- [x] Explanation output deterministic
- [x] Empty input tested
- [x] Invalid input type tested
- [x] Real artifact smoke test passed
- [x] Full ML test suite passes
- [x] Ruff checks pass

## Known Warning

The real-artifact tests currently emit a NumPy 2.5 deprecation warning from the
joblib loading path. Predictions remain correct and all tests pass. Dependency
compatibility should be reviewed during the dependency/CI consolidation phase.

## Approval

Phase 6 requires explicit approval from Oussema before implementation begins.
