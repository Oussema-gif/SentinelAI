from __future__ import annotations

from sentinelai_ml.predict import PredictionResult

from api.app.db.session import SessionLocal
from api.app.services.threat_analysis_service import (
    ThreatAnalysisService,
)
from api.app.services.threat_investigation_repository import (
    PostgreSQLThreatInvestigationRepository,
)


def test_threat_investigation_can_be_persisted():
    service = ThreatAnalysisService()

    prediction = PredictionResult(
        label="ham",
        confidence=None,
        confidence_type="decision_score_not_probability",
        decision_score=-0.31,
        influential_terms=[],
        model_version="sentinelai-sms-v1.0.0",
    )

    result = service.analyze(
        (
            "URGENT! Your bank account will be suspended today. "
            "Verify your password and OTP now at "
            "https://bit.ly/security-check"
        ),
        prediction,
    )

    with SessionLocal() as session:
        repository = PostgreSQLThreatInvestigationRepository(session)

        stored = repository.save(
            text=(
                "URGENT! Your bank account will be suspended today. "
                "Verify your password and OTP now at "
                "https://bit.ly/security-check"
            ),
            classifier_label=prediction.label,
            classifier_decision_score=prediction.decision_score,
            result=result,
            model_version=prediction.model_version,
        )

        assert stored.id > 0
        assert stored.result.risk_level == "critical"
        assert stored.result.category == "smishing"

        loaded = repository.get(stored.id)

        assert loaded is not None
        assert loaded.id == stored.id
        assert loaded.result.threat_label == ("malicious_or_high_risk")
        assert len(loaded.result.signals) >= 2
        assert len(loaded.result.links) == 1
