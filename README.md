# SentinelAI

SentinelAI is a containerized SMS threat-analysis application. It classifies messages as spam or ham, explains influential terms from a trained Linear SVM, persists prediction metadata in PostgreSQL, and presents the results in a weather-radar-inspired React interface.

The application is designed as a local-first project with a production-oriented container layout:

- React + TypeScript + Vite frontend.
- FastAPI backend.
- PostgreSQL persistence.
- Scikit-learn Linear SVM model.
- Alembic migrations.
- Podman Compose deployment.
- Automated ML, API, and frontend verification.

## Features

- Analyze SMS-style text for spam or ham classification.
- Preserve honest model semantics: decision score is shown separately from probability; no false probability is exposed.
- Show influential TF-IDF/Linear-SVM terms with spam or ham direction.
- Persist predictions and model metadata in PostgreSQL.
- Provide prediction history and usage analytics.
- Present threat severity through a radar interface, forecast card, regional overview, model panel, and clickable Storm History timeline.
- Use a shared severity color scale across the interface.
- Support reduced-motion preferences for atmospheric UI effects.
- Run the frontend behind nginx and expose the stack at port `8080`.

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
  +--> Scikit-learn model artifact
  |
  +--> PostgreSQL container
```

The frontend is served by nginx. The API is intentionally not exposed directly on the host; nginx proxies browser API requests through `/api`.

## Project layout

```text
api/                    FastAPI application, database models, migrations, tests
frontend/               React/Vite interface and nginx configuration
ml/                     Training pipeline, model artifact, dataset utilities, ML tests
docs/                   Data card, EDA report, model comparison, production checklist
ops/                    Operational scripts and log guidance
scripts/                Full verification and live smoke-test scripts
compose.yaml            Local Podman Compose stack
compose.production.yaml Production Compose override/configuration
Containerfile.api       API image build
Containerfile.frontend  Frontend/nginx image build
```

## Prerequisites

Install:

- Podman and `podman-compose`.
- Python 3.14-compatible environments for `api/` and `ml/`.
- Node.js and npm for the frontend.
- `curl`, Git, and Bash.

The documented local workflow assumes Fedora/Linux.

## Quick start

### 1. Configure environment

Create or update `.env.local`:

```dotenv
POSTGRES_DB=sentinelai
POSTGRES_USER=sentinelai
POSTGRES_PASSWORD=sentinelai_dev
DATABASE_URL=postgresql+psycopg://sentinelai:sentinelai_dev@postgres:5432/sentinelai
APP_ENV=development
CORS_ALLOWED_ORIGINS=
```

For host-side development commands, `.env` can use the host address:

```dotenv
DATABASE_URL=postgresql+psycopg://sentinelai:sentinelai_dev@127.0.0.1:5432/sentinelai
MODEL_ARTIFACT_PATH=ml/models/sentinelai-sms-v1.0.0.joblib
MODEL_VERSION=sentinelai-sms-v1.0.0
```

Do not commit real production credentials.

### 2. Start the stack

```bash
podman-compose --env-file .env.local up -d --build
```

Check service status:

```bash
podman-compose --env-file .env.local ps
```

Open the application:

```text
http://127.0.0.1:8080
```

### 3. Stop the stack

```bash
podman-compose --env-file .env.local down
```

Stopping containers does not remove the named PostgreSQL volume.

## API overview

All browser API requests are available through:

```text
http://127.0.0.1:8080/api
```

Core endpoints include:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Basic API health check |
| GET | `/health/ready` | Readiness health check |
| POST | `/predictions` | Analyze a message |
| GET | `/predictions` | Paginated prediction history |
| GET | `/model/info` | Active model metadata and evaluation metrics |
| GET | `/analytics/model` | Model analytics |
| GET | `/analytics/usage` | Prediction usage analytics |
| POST | `/threat/analyze` | Create a threat investigation |
| GET | `/threat/history` | Retrieve threat-investigation history |
| GET | `/threat/overview` | Regional threat overview |
| GET | `/threat/timeline` | Threat timeline data |

Use the OpenAPI UI when the API is directly reachable in a development environment:

```text
http://127.0.0.1:8000/docs
```

In the container stack, the API is intended to be accessed through nginx at `/api`.

## Example prediction

```bash
curl -X POST http://127.0.0.1:8080/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "text": "URGENT! You have won £500. Claim now at https://bit.ly/win500",
    "top_k": 6
  }'
```

The response includes:

- `label`: `spam` or `ham`.
- `decision_score`: signed Linear SVM decision score.
- `confidence`: `null` because the selected model has no approved calibrated probability.
- `confidence_type`: explains the score semantics.
- `influential_terms`: positive spam and negative ham feature contributions.
- `model_version`.

## Model

SentinelAI uses model artifact:

```text
ml/models/sentinelai-sms-v1.0.0.joblib
```

Current model characteristics:

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

The model does not provide an approved calibrated probability. SentinelAI therefore exposes a decision score rather than presenting an uncalibrated value as user-facing confidence.

See:

- `docs/data_card.md`
- `docs/eda_report.md`
- `docs/model_comparison.md`

## Database and migrations

PostgreSQL stores model metadata, predictions, and threat-investigation records.

Run migrations against a configured database:

```bash
source api/.venv/bin/activate
export PYTHONPATH="$PWD:$PWD/ml/src"
export DATABASE_URL="postgresql+psycopg://sentinelai:sentinelai_dev@127.0.0.1:5432/sentinelai"

alembic -c api/alembic.ini upgrade head

deactivate
```

For tests, use a separate database named `sentinelai_test`:

```bash
podman exec -it sentinelai-postgres \
  psql -U sentinelai -d postgres \
  -c "CREATE DATABASE sentinelai_test;"
```

The test script defaults to:

```text
postgresql+psycopg://sentinelai:sentinelai_dev@127.0.0.1:5432/sentinelai_test
```

## Testing and verification

Run the complete verification suite:

```bash
./scripts/test-all.sh
```

It runs:

1. ML linting, formatting, and tests.
2. API linting, formatting, migrations, and tests.
3. Frontend TypeScript validation and production build.
4. Git status output.

Run the live smoke test after the stack is running:

```bash
./scripts/smoke-test.sh
```

The smoke test verifies:

- Health endpoint.
- Model metadata.
- Spam prediction.
- Ham prediction.
- Prediction history.
- Usage analytics.

## Frontend notes

The frontend uses a weather-radar visual system:

- Risk levels share one severity color scale.
- Storm History cards use matching labels, dots, borders, and glow.
- Clicking a Storm History item restores that investigation in the main analysis view.
- Decorative atmosphere is behind interactive content.
- `prefers-reduced-motion: reduce` disables cloud, star, and lightning animation.

Primary frontend entry points:

```text
frontend/src/App.tsx
frontend/src/App.css
frontend/src/components/
frontend/src/api/
```

## Production notes

Use `.env.production.example` as the template for a production environment.

Production requirements include:

- A long random `MESSAGE_FINGERPRINT_SECRET`.
- A real PostgreSQL URL.
- Explicit `CORS_ALLOWED_ORIGINS`.
- HTTPS terminated by the deployment environment or reverse proxy.
- A persistent PostgreSQL backup and restore plan.
- No raw message persistence for anonymous/public deployments when `PERSIST_RAW_MESSAGE_TEXT=false`.

See `docs/production-checklist.md` for the production checklist.

## Troubleshooting

### Containers are stopped

```bash
podman-compose --env-file .env.local up -d
podman-compose --env-file .env.local ps
```

### Inspect logs

```bash
podman-compose --env-file .env.local logs --tail=150 postgres
podman-compose --env-file .env.local logs --tail=150 api
podman-compose --env-file .env.local logs --tail=150 frontend
```

### API tests cannot connect to PostgreSQL

Confirm the database exists and credentials match:

```bash
podman exec -it sentinelai-postgres \
  psql -U sentinelai -d postgres -c '\l'
```

The API test database should be `sentinelai_test`.

### Frontend does not show latest changes

Rebuild and recreate the frontend container:

```bash
npm --prefix frontend run build
podman-compose --env-file .env.local up -d --build --force-recreate frontend
```

Then hard-refresh the browser:

```text
Ctrl+Shift+R
```

## Useful commands

```bash
# Check repository state
git status

# Start containers
podman-compose --env-file .env.local up -d

# Stop containers
podman-compose --env-file .env.local down

# Run full verification
./scripts/test-all.sh

# Run live API smoke test
./scripts/smoke-test.sh

# Inspect recent project state
./scripts/session_snapshot.sh
```

## License

No license has been declared yet. Add a `LICENSE` file before distributing the project publicly.
