from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from api.app.db.models import ModelVersion, Prediction
from api.app.db.session import SessionLocal
from api.app.main import app


@pytest.fixture
def client():
    session = SessionLocal()

    session.execute(delete(Prediction))
    session.execute(delete(ModelVersion))
    session.commit()
    session.close()

    with TestClient(app) as test_client:
        yield test_client

    session = SessionLocal()

    session.execute(delete(Prediction))
    session.execute(delete(ModelVersion))
    session.commit()
    session.close()


def test_health(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_returns_model_result(
    client: TestClient,
) -> None:
    response = client.post(
        "/predictions",
        json={
            "text": "URGENT! You won a £500 prize!",
            "top_k": 5,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["label"] in {"ham", "spam"}
    assert body["confidence"] is None
    assert body["confidence_type"] == ("decision_score_not_probability")
    assert body["decision_score"] is not None
    assert body["model_version"] == ("sentinelai-sms-v1.0.0")
    assert isinstance(body["influential_terms"], list)


def test_predict_persists_in_repository(
    client: TestClient,
) -> None:
    first = client.post(
        "/predictions",
        json={
            "text": "Hello there",
        },
    )

    assert first.status_code == 200

    history = client.get(
        "/predictions",
        params={
            "page": 1,
            "page_size": 20,
        },
    )

    assert history.status_code == 200

    body = history.json()

    assert body["total"] == 1
    assert len(body["items"]) == 1


def test_prediction_history_filter(
    client: TestClient,
) -> None:
    client.post(
        "/predictions",
        json={
            "text": "Hello there",
        },
    )

    client.post(
        "/predictions",
        json={
            "text": "FREE prize now!",
        },
    )

    response = client.get(
        "/predictions",
        params={"label": "spam"},
    )

    assert response.status_code == 200

    body = response.json()

    assert body["total"] >= 1
    assert all(item["label"] == "spam" for item in body["items"])


def test_model_info(client: TestClient) -> None:
    response = client.get("/model/info")

    assert response.status_code == 200

    body = response.json()

    assert body["model_version"] == ("sentinelai-sms-v1.0.0")
    assert body["model_type"] == "Linear SVM"
    assert body["dataset_sha256"]
    assert "final_test_metrics" in body
    assert "calibration" in body


def test_model_analytics(client: TestClient) -> None:
    response = client.get("/analytics/model")

    assert response.status_code == 200

    body = response.json()

    assert body["model_version"] == ("sentinelai-sms-v1.0.0")
    assert body["model_type"] == "Linear SVM"
    assert body["cv_results"]
    assert body["final_test_metrics"]


def test_usage_analytics(client: TestClient) -> None:
    client.post(
        "/predictions",
        json={"text": "Hello there"},
    )

    response = client.get("/analytics/usage")

    assert response.status_code == 200

    body = response.json()

    assert body["total_predictions"] == 1
    assert body["ham_predictions"] + body["spam_predictions"] == 1
    assert 0.0 <= body["spam_rate"] <= 1.0


def test_empty_text_is_rejected(
    client: TestClient,
) -> None:
    response = client.post(
        "/predictions",
        json={"text": ""},
    )

    assert response.status_code == 422


def test_whitespace_text_reaches_service_but_fails(
    client: TestClient,
) -> None:
    response = client.post(
        "/predictions",
        json={"text": "   "},
    )

    assert response.status_code == 422


def test_unknown_field_is_rejected(
    client: TestClient,
) -> None:
    response = client.post(
        "/predictions",
        json={
            "text": "hello",
            "unknown": "value",
        },
    )

    assert response.status_code == 422


def test_invalid_page_is_rejected(
    client: TestClient,
) -> None:
    response = client.get(
        "/predictions",
        params={"page": 0},
    )

    assert response.status_code == 422


def test_openapi_is_available(
    client: TestClient,
) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200

    body = response.json()

    assert "paths" in body
    assert "/predictions" in body["paths"]
    assert "/model/info" in body["paths"]
    assert "/analytics/model" in body["paths"]
