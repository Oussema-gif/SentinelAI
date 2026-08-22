from __future__ import annotations

from sentinelai_ml.predict import PredictionResult

from api.app.services.threat_analysis_service import (
    ThreatAnalysisService,
)


def prediction(
    label: str,
    decision_score: float,
) -> PredictionResult:
    return PredictionResult(
        label=label,
        confidence=None,
        confidence_type="decision_score_not_probability",
        decision_score=decision_score,
        influential_terms=[],
        model_version="sentinelai-sms-v1.0.0",
    )


def test_critical_smishing_message():
    service = ThreatAnalysisService()

    result = service.analyze(
        (
            "URGENT! Your bank account will be suspended today. "
            "Verify your password and OTP now at "
            "https://bit.ly/security-check"
        ),
        prediction("ham", -0.31),
    )

    assert result.risk_level == "critical"
    assert result.severity >= 75
    assert result.threat_label == "malicious_or_high_risk"
    assert result.category == "smishing"

    assert any(signal.type == "credential_request" for signal in result.signals)

    assert any(signal.type == "short_link" for signal in result.signals)

    assert len(result.links) == 1
    assert result.links[0].shortener is True


def test_benign_message():
    service = ThreatAnalysisService()

    result = service.analyze(
        "Hey, are you free tonight? We can meet after class.",
        prediction("ham", -0.73),
    )

    assert result.risk_level == "low"
    assert result.threat_label == "benign"
    assert result.category == "benign_message"
    assert result.severity < 30
    assert result.signals == []
    assert result.links == []


def test_financial_lure():
    service = ThreatAnalysisService()

    result = service.analyze(
        "Congratulations! You won $500. Claim your prize now.",
        prediction("spam", 1.8),
    )

    assert result.category == "financial_lure"
    assert result.threat_label in {
        "spam",
        "likely_threat",
        "malicious_or_high_risk",
    }

    assert any(signal.type == "financial_lure" for signal in result.signals)


def test_ip_address_url():
    service = ThreatAnalysisService()

    result = service.analyze(
        "Verify your account at http://192.168.1.10/login",
        prediction("ham", -0.2),
    )

    assert any(signal.type == "ip_url" for signal in result.signals)

    assert len(result.links) == 1
    assert result.links[0].ip_address is True


def test_suspicious_credential_path():
    service = ThreatAnalysisService()

    result = service.analyze(
        "Confirm your account at https://example.com/verify/login",
        prediction("ham", -0.1),
    )

    assert any(signal.type == "credential_path" for signal in result.signals)

    assert result.links[0].suspicious_path is True


def test_spam_classifier_can_increase_risk():
    service = ThreatAnalysisService()

    result = service.analyze(
        "Free bonus claim now",
        prediction("spam", 0.9),
    )

    assert any(signal.type == "classifier_spam" for signal in result.signals)

    assert result.threat_label != "benign"
