# SentinelAI — Project Status

## Current Phase

Phase 3 — Preprocessing & Leak-Free Feature Pipeline

## Completed Phases

- Phase 0 — Environment & Repository Bootstrap — August 17, 2026
- Phase 1 — Dataset Acquisition & Validation — August 17, 2026
- Phase 2 — Exploratory Data Analysis — August 17, 2026
- Phase 3 — Preprocessing & Leak-Free Feature Pipeline — August 17, 2026

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

Phase 4 — Model Training, Comparison & Selection

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
