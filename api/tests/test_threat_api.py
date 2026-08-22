from __future__ import annotations

from fastapi.testclient import TestClient

from api.app.main import app

client = TestClient(app)


def test_threat_api_detects_critical_smishing():
    response = client.post(
        "/threat/analyze",
        json={
            "text": (
                "URGENT! Your bank account will be suspended today. "
                "Verify your password and OTP now at "
                "https://bit.ly/security-check"
            ),
            "top_k": 6,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["classifier_label"] in {"ham", "spam"}
    assert body["threat_label"] == "malicious_or_high_risk"
    assert body["risk_level"] == "critical"
    assert body["severity"] >= 75
    assert body["category"] == "smishing"

    signal_types = {signal["type"] for signal in body["signals"]}

    assert "credential_request" in signal_types
    assert "short_link" in signal_types

    assert len(body["links"]) == 1

    link = body["links"][0]

    assert link["host"] == "bit.ly"
    assert link["shortener"] is True
    assert link["ip_address"] is False
    assert link["suspicious_path"] is True

    assert body["model_version"] == "sentinelai-sms-v1.0.0"


def test_threat_api_detects_financial_lure():
    response = client.post(
        "/threat/analyze",
        json={
            "text": ("Congratulations! You won $500. Claim your prize now."),
            "top_k": 6,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["classifier_label"] == "spam"
    assert body["category"] == "financial_lure"
    assert body["risk_level"] == "high"
    assert body["severity"] >= 55

    assert any(signal["type"] == "financial_lure" for signal in body["signals"])


def test_threat_api_detects_ip_url():
    response = client.post(
        "/threat/analyze",
        json={
            "text": ("Verify your account at http://192.168.1.10/login"),
            "top_k": 6,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["threat_label"] == "malicious_or_high_risk"
    assert body["risk_level"] == "critical"
    assert body["category"] == "smishing"

    assert any(signal["type"] == "ip_url" for signal in body["signals"])

    assert body["links"][0]["ip_address"] is True


def test_threat_api_accepts_benign_message():
    response = client.post(
        "/threat/analyze",
        json={
            "text": ("Hey, are you free tonight? We can meet after class."),
            "top_k": 6,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert body["classifier_label"] == "ham"
    assert body["threat_label"] == "benign"
    assert body["risk_level"] == "low"
    assert body["severity"] == 0
    assert body["category"] == "benign_message"
    assert body["signals"] == []
    assert body["links"] == []


def test_threat_api_rejects_empty_text():
    response = client.post(
        "/threat/analyze",
        json={
            "text": "",
            "top_k": 6,
        },
    )

    assert response.status_code == 422


def test_threat_api_rejects_unknown_fields():
    response = client.post(
        "/threat/analyze",
        json={
            "text": "hello",
            "top_k": 6,
            "unexpected": True,
        },
    )

    assert response.status_code == 422


def test_threat_api_rejects_invalid_top_k():
    response = client.post(
        "/threat/analyze",
        json={
            "text": "hello",
            "top_k": 0,
        },
    )

    assert response.status_code == 422
