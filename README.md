# SentinelAI

**SMS threat analysis, powered by a transparent, explainable machine learning pipeline.**

SentinelAI is a full-stack SMS threat-analysis application that classifies SMS-style messages as **spam** or **ham**, explains the model's most influential terms, stores prediction metadata in PostgreSQL, and presents results in a React dashboard.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.14-blue.svg)
![TypeScript](https://img.shields.io/badge/frontend-React%20%2B%20TypeScript-informational.svg)
![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)

> **Important:** SentinelAI is a demonstration and decision-support project. It should not be the sole control used to block messages, make security decisions, or assess user trust.

## Demo

A short demo video is available here:

- [SentinelAI demo (Google Drive)](https://drive.google.com/file/d/1EJf-1N_AWuypDv36tUD6wxM5NBLN9GGl/view?usp=sharing)

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [API](#api)
- [Model semantics](#model-semantics)
- [Data and artifacts](#data-and-artifacts)
- [Database migrations](#database-migrations)
- [Verification](#verification)
- [Development guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [License](#license)

## Features

- Classifies SMS-style text as `spam` or `ham`
- Uses a trained scikit-learn **Linear SVM**
- Displays a signed model decision score without falsely presenting it as a probability
- Explains predictions through influential TF-IDF / Linear SVM terms
- Persists predictions, model metadata, and threat-investigation records in PostgreSQL
- Provides prediction history, usage analytics, model analytics, and threat timelines
- Uses FastAPI, React, TypeScript, Vite, PostgreSQL, Alembic, nginx, and Podman Compose
- Includes automated ML, API, database, and frontend verification

## Architecture

```text
Browser
  |
  | http://127.0.0.1:8080
  v
nginx frontend container
  |
  | /api/*
  v
FastAPI API container
  |
  +--> scikit-learn model artifact
  |
  +--> PostgreSQL database
```

The frontend is exposed on port `8080`. Browser API traffic is proxied through nginx at `/api`; the API is not intended to be directly exposed by the Compose stack.

## Repository layout

| Path | Description |
|---|---|
| `api/` | FastAPI application, PostgreSQL models, Alembic, API tests |
| `frontend/` | React + TypeScript + Vite interface and nginx configuration |
| `ml/` | Dataset tools, training, inference, explanations, ML tests |
| `docs/` | Data card, EDA, model evaluation, production guidance |
| `ops/` | Operational guidance and maintenance assets |
| `scripts/` | Supported verification and smoke-test scripts |
| `.github/` | CI workflows, issue templates, pull-request template |
| `compose.yaml` | Local Podman Compose stack |
| `compose.production.yaml` | Production Compose configuration |
| `Containerfile.api` | API image build |
| `Containerfile.frontend` | Frontend/nginx image build |

## Requirements

Install the following local tools:

- Podman and `podman-compose`
- Python 3.14-compatible runtime
- Node.js and npm
- PostgreSQL client tools (optional but recommended)
- `curl`, Git, and Bash

The documented workflow targets Fedora or another Linux environment.

## Quick start

### 1. Configure local environment

Copy the example environment file and update values as appropriate:

```bash
cp .env.example .env.local
```

Example local container configuration:

```dotenv
POSTGRES_DB=sentinelai
POSTGRES_USER=sentinelai
POSTGRES_PASSWORD=sentinelai_dev
DATABASE_URL=postgresql+psycopg://sentinelai:sentinelai_dev@postgres:5432/sentinelai
APP_ENV=development
CORS_ALLOWED_ORIGINS=
```

> Do not commit `.env`, `.env.local`, production credentials, API keys, or database backups.

### 2. Start the stack

```bash
podman-compose --env-file .env.local up -d --build
```

Check the service state:

```bash
podman-compose --env-file .env.local ps
```

### 3. Open SentinelAI

```text
http://127.0.0.1:8080
```

### 4. Stop the stack

```bash
podman-compose --env-file .env.local down
```

Stopping the stack does not remove the named PostgreSQL data volume.

## API

All browser-facing endpoints are available through nginx:

```text
http://127.0.0.1:8080/api
```

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | API health check |
| `GET` | `/health/ready` | Readiness health check |
| `POST` | `/predictions` | Analyze an SMS message |
| `GET` | `/predictions` | Retrieve paginated prediction history |
| `GET` | `/model/info` | Get active model metadata and evaluation metrics |
| `GET` | `/analytics/model` | Get model analytics |
| `GET` | `/analytics/usage` | Get prediction usage analytics |
| `POST` | `/threat/analyze` | Create a threat investigation |
| `GET` | `/threat/history` | Retrieve prior threat investigations |
| `GET` | `/threat/overview` | Retrieve regional threat overview |
| `GET` | `/threat/timeline` | Retrieve threat timeline data |

### Example prediction

```bash
curl -X POST http://127.0.0.1:8080/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "text": "URGENT! You have won £500. Claim now at https://bit.ly/win500",
    "top_k": 6
  }'
```

Example response shape:

```json
{
  "label": "spam",
  "confidence": null,
  "confidence_type": "decision_score_not_probability",
  "decision_score": 0.75499697,
  "influential_terms": [
    {
      "term": "won",
      "contribution": 0.42570204,
      "direction": "spam"
    }
  ],
  "model_version": "sentinelai-sms-v1.0.0"
}
```

## Model semantics

SentinelAI uses a Linear SVM trained on the UCI SMS Spam Collection.

| Property | Value |
|---|---|
| Model | Linear SVM |
| Preprocessing | `phase3-conservative-whitespace-v1` |
| Dataset | UCI SMS Spam Collection |
| Holdout accuracy | 0.988341 |
| Holdout precision | 1.000000 |
| Holdout recall | 0.913333 |
| Holdout F1 | 0.954704 |
| Holdout PR-AUC | 0.968298 |

The model's `decision_score` is not a calibrated probability. SentinelAI deliberately returns `confidence: null` and identifies the score as `decision_score_not_probability` rather than exposing misleading confidence values.

See:

- [Data Card](docs/data_card.md)
- [EDA Report](docs/eda_report.md)
- [Model Comparison](docs/model_comparison.md)

## Data and artifacts

Raw datasets, generated reports, local model artifacts, database exports, and runtime caches should not be committed to Git.

Download the source dataset locally:

```bash
source ml/.venv/bin/activate

PYTHONPATH="$PWD/ml/src" python -m sentinelai_ml.data.download

deactivate
```

Train a local artifact:

```bash
source ml/.venv/bin/activate

PYTHONPATH="$PWD/ml/src" python -m sentinelai_ml.train

deactivate
```

The default local model path is:

```text
ml/models/sentinelai-sms-v1.0.0.joblib
```

For deployments, distribute model artifacts through a release, artifact registry, object store, or reproducible training pipeline — not ordinary Git commits.

## Database migrations

Apply migrations against a configured host database:

```bash
source api/.venv/bin/activate

export PYTHONPATH="$PWD:$PWD/ml/src"
export DATABASE_URL="postgresql+psycopg://sentinelai:sentinelai_dev@127.0.0.1:5432/sentinelai"

alembic -c api/alembic.ini upgrade head

deactivate
```

The API test suite uses a separate database by default:

```text
sentinelai_test
```

Create it if needed:

```bash
podman exec -it sentinelai-postgres \
  psql -U sentinelai -d postgres \
  -c "CREATE DATABASE sentinelai_test;"
```

## Verification

Run all supported checks:

```bash
./scripts/test-all.sh
```

This runs:

1. ML linting, formatting, and tests
2. API linting, formatting, migrations, and tests
3. Frontend TypeScript validation and production build
4. Repository status output

Run the live smoke test after starting the container stack:

```bash
./scripts/smoke-test.sh
```

The smoke test verifies:

- API health
- Active model metadata
- Spam prediction
- Ham prediction
- Prediction history
- Usage analytics

## Development guidelines

- Keep secrets and local configuration out of Git.
- Do not commit `.env` files, raw data, generated model artifacts, notebook checkpoints, build output, dependency directories, or caches.
- Keep feature preparation inside the shared scikit-learn pipeline.
- Preserve duplicate-aware train/test separation in model evaluation.
- Do not label an uncalibrated decision score as a probability.
- Add or update tests when changing model, API, persistence, or frontend behavior.

## Troubleshooting

<details>
<summary><strong>Containers are not running</strong></summary>

```bash
podman-compose --env-file .env.local up -d
podman-compose --env-file .env.local ps
```

</details>

<details>
<summary><strong>Inspect logs</strong></summary>

```bash
podman-compose --env-file .env.local logs --tail=150 postgres
podman-compose --env-file .env.local logs --tail=150 api
podman-compose --env-file .env.local logs --tail=150 frontend
```

</details>

<details>
<summary><strong>API tests cannot connect</strong></summary>

Verify the test database and its credentials:

```bash
podman exec -it sentinelai-postgres \
  psql -U sentinelai -d postgres \
  -c '\l'
```

</details>

<details>
<summary><strong>Frontend changes are missing</strong></summary>

```bash
npm --prefix frontend run build

podman-compose --env-file .env.local \
  up -d --build --force-recreate frontend
```

Then hard-refresh the browser:

```text
Ctrl+Shift+R
```

</details>

## Security

Do not submit sensitive, confidential, or real production message content to public SentinelAI deployments. Configure `PERSIST_RAW_MESSAGE_TEXT=false` for anonymous or public-facing deployments.

See the production checklist in [`docs/production-checklist.md`](docs/production-checklist.md).

## License

This project is licensed under the MIT License. See [`LICENSE`](LICENSE).