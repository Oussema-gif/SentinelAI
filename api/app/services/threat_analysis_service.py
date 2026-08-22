from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass
from urllib.parse import urlparse

from sentinelai_ml.predict import PredictionResult

SHORTENER_HOSTS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
}

SUSPICIOUS_TLDS = {
    ".click",
    ".country",
    ".download",
    ".gq",
    ".icu",
    ".link",
    ".live",
    ".monster",
    ".online",
    ".pw",
    ".quest",
    ".rest",
    ".shop",
    ".site",
    ".stream",
    ".support",
    ".top",
    ".win",
    ".work",
    ".xin",
    ".xyz",
}

URL_PATTERN = re.compile(
    r"https?://[^\s<>\"]+",
    re.IGNORECASE,
)

SUSPICIOUS_PATH_PATTERNS = (
    "login",
    "signin",
    "verify",
    "verification",
    "secure",
    "security",
    "account",
    "password",
    "passcode",
    "otp",
    "confirm",
    "payment",
    "billing",
    "recover",
    "unlock",
    "suspend",
    "claim",
)

RULES = (
    (
        "urgency_pressure",
        "Urgency / pressure",
        0.82,
        (
            "urgent",
            "immediately",
            "act now",
            "hurry",
            "limited time",
            "expires",
            "within 24 hours",
            "final warning",
            "last chance",
        ),
    ),
    (
        "financial_lure",
        "Financial / reward lure",
        0.91,
        (
            "won",
            "winner",
            "prize",
            "reward",
            "cash",
            "money",
            "£",
            "$",
            "€",
            "claim",
            "bonus",
            "jackpot",
        ),
    ),
    (
        "credential_request",
        "Credential request",
        0.95,
        (
            "password",
            "passcode",
            "pin",
            "otp",
            "one-time password",
            "verification code",
            "login",
            "username",
            "credentials",
        ),
    ),
    (
        "account_threat",
        "Account threat",
        0.88,
        (
            "account suspended",
            "account will be closed",
            "verify your account",
            "security alert",
            "unauthorized activity",
            "blocked account",
            "account locked",
        ),
    ),
    (
        "authority_abuse",
        "Authority / impersonation language",
        0.84,
        (
            "police",
            "government",
            "irs",
            "fbi",
            "bank security",
            "fraud department",
            "support team",
            "official notice",
        ),
    ),
    (
        "social_pressure",
        "Social / emotional pressure",
        0.74,
        (
            "do not tell anyone",
            "keep this secret",
            "help me",
            "emergency",
            "family",
            "danger",
            "please respond",
        ),
    ),
    (
        "call_to_action",
        "Suspicious call-to-action",
        0.66,
        (
            "call now",
            "click here",
            "click the link",
            "visit now",
            "reply now",
            "confirm now",
            "claim now",
        ),
    ),
)


@dataclass(frozen=True)
class ThreatSignalResult:
    type: str
    label: str
    severity: float
    evidence: str


@dataclass(frozen=True)
class ThreatLinkResult:
    url: str
    host: str
    shortener: bool
    ip_address: bool
    suspicious_path: bool


@dataclass(frozen=True)
class ThreatAnalysisResult:
    threat_label: str
    risk_level: str
    severity: int
    category: str
    signals: list[ThreatSignalResult]
    links: list[ThreatLinkResult]
    recommendation: str


class ThreatAnalysisService:
    def analyze(
        self,
        text: str,
        prediction: PredictionResult,
    ) -> ThreatAnalysisResult:
        normalized = text.lower()

        signals: list[ThreatSignalResult] = []

        self._collect_language_signals(
            normalized,
            signals,
        )

        links = self._analyze_links(
            text,
            signals,
        )

        if prediction.label == "spam":
            signals.append(
                ThreatSignalResult(
                    type="classifier_spam",
                    label="ML classifier: spam",
                    severity=0.70,
                    evidence=(
                        f"decision score {prediction.decision_score:.4f}"
                        if prediction.decision_score is not None
                        else "spam classification"
                    ),
                )
            )

        unique_signals = self._deduplicate_signals(
            signals,
        )

        severity = self._calculate_severity(
            unique_signals,
            prediction,
            links,
        )

        risk_level = self._risk_level(
            severity,
        )

        threat_label = self._threat_label(
            risk_level,
            prediction,
            unique_signals,
        )

        category = self._category(
            prediction,
            unique_signals,
        )

        recommendation = self._recommendation(
            risk_level,
            unique_signals,
        )

        return ThreatAnalysisResult(
            threat_label=threat_label,
            risk_level=risk_level,
            severity=severity,
            category=category,
            signals=unique_signals,
            links=links,
            recommendation=recommendation,
        )

    @staticmethod
    def _collect_language_signals(
        normalized: str,
        signals: list[ThreatSignalResult],
    ) -> None:
        for (
            signal_type,
            label,
            severity,
            patterns,
        ) in RULES:
            matched = [pattern for pattern in patterns if pattern in normalized]

            if not matched:
                continue

            signals.append(
                ThreatSignalResult(
                    type=signal_type,
                    label=label,
                    severity=severity,
                    evidence=", ".join(matched[:3]),
                )
            )

    @staticmethod
    def _analyze_links(
        text: str,
        signals: list[ThreatSignalResult],
    ) -> list[ThreatLinkResult]:
        links: list[ThreatLinkResult] = []

        for raw_url in URL_PATTERN.findall(text):
            url = raw_url.rstrip(".,!?;:)")

            parsed = urlparse(url)

            host = parsed.hostname.lower() if parsed.hostname else ""

            shortener = host in SHORTENER_HOSTS or any(
                host.endswith(f".{domain}") for domain in SHORTENER_HOSTS
            )

            ip_address = False

            try:
                if host:
                    ipaddress.ip_address(host)
                    ip_address = True
            except ValueError:
                ip_address = False

            path = f"{parsed.path} {parsed.query}".lower()

            matched_path_patterns = [
                pattern for pattern in SUSPICIOUS_PATH_PATTERNS if pattern in path
            ]

            suspicious_path = bool(matched_path_patterns)

            if shortener:
                signals.append(
                    ThreatSignalResult(
                        type="short_link",
                        label="URL shortener",
                        severity=0.86,
                        evidence=url,
                    )
                )

            if ip_address:
                signals.append(
                    ThreatSignalResult(
                        type="ip_url",
                        label="IP-address URL",
                        severity=0.92,
                        evidence=host,
                    )
                )

            if any(host.endswith(tld) for tld in SUSPICIOUS_TLDS):
                signals.append(
                    ThreatSignalResult(
                        type="suspicious_tld",
                        label="Suspicious URL domain",
                        severity=0.74,
                        evidence=host,
                    )
                )

            if suspicious_path:
                signals.append(
                    ThreatSignalResult(
                        type="credential_path",
                        label="Credential / account URL path",
                        severity=0.83,
                        evidence=", ".join(
                            matched_path_patterns[:3],
                        ),
                    )
                )

            links.append(
                ThreatLinkResult(
                    url=url,
                    host=host,
                    shortener=shortener,
                    ip_address=ip_address,
                    suspicious_path=suspicious_path,
                )
            )

        return links

    @staticmethod
    def _deduplicate_signals(
        signals: list[ThreatSignalResult],
    ) -> list[ThreatSignalResult]:
        result: list[ThreatSignalResult] = []
        seen: set[str] = set()

        for signal in sorted(
            signals,
            key=lambda item: item.severity,
            reverse=True,
        ):
            if signal.type in seen:
                continue

            seen.add(signal.type)
            result.append(signal)

        return result

    @staticmethod
    def _calculate_severity(
        signals: list[ThreatSignalResult],
        prediction: PredictionResult,
        links: list[ThreatLinkResult],
    ) -> int:
        if not signals:
            return 0

        signal_types = {signal.type for signal in signals}

        top_signal = max(signal.severity for signal in signals)

        signal_factor = min(
            len(signals) / 6,
            1.0,
        )

        classifier_factor = 0.18 if prediction.label == "spam" else 0.0

        link_factor = min(
            sum(
                (0.08 if link.shortener else 0.0)
                + (0.10 if link.ip_address else 0.0)
                + (0.06 if link.suspicious_path else 0.0)
                for link in links
            ),
            0.28,
        )

        high_confidence_factor = (
            0.10
            if {
                "credential_request",
                "account_threat",
            }
            & signal_types
            else 0.0
        )

        coordinated_attack_factor = (
            0.08
            if len(
                signal_types
                & {
                    "credential_request",
                    "account_threat",
                    "urgency_pressure",
                    "short_link",
                    "credential_path",
                    "ip_url",
                }
            )
            >= 3
            else 0.0
        )

        raw_score = (
            top_signal * 0.48
            + signal_factor * 0.22
            + classifier_factor
            + link_factor
            + high_confidence_factor
            + coordinated_attack_factor
        )

        return round(
            max(
                0.0,
                min(
                    100.0,
                    raw_score * 100,
                ),
            )
        )

    @staticmethod
    def _risk_level(
        severity: int,
    ) -> str:
        if severity >= 75:
            return "critical"

        if severity >= 55:
            return "high"

        if severity >= 30:
            return "medium"

        return "low"

    @staticmethod
    def _threat_label(
        risk_level: str,
        prediction: PredictionResult,
        signals: list[ThreatSignalResult],
    ) -> str:
        if risk_level == "critical":
            return "malicious_or_high_risk"

        if risk_level == "high":
            return "likely_threat"

        if prediction.label == "spam":
            return "spam"

        if signals:
            return "suspicious"

        return "benign"

    @staticmethod
    def _category(
        prediction: PredictionResult,
        signals: list[ThreatSignalResult],
    ) -> str:
        signal_types = {signal.type for signal in signals}

        if {
            "credential_request",
            "account_threat",
            "short_link",
            "credential_path",
            "ip_url",
        } & signal_types:
            return "smishing"

        if "financial_lure" in signal_types:
            return "financial_lure"

        if "authority_abuse" in signal_types:
            return "impersonation"

        if "social_pressure" in signal_types:
            return "social_engineering"

        if prediction.label == "spam":
            return "spam"

        if signals:
            return "suspicious_message"

        return "benign_message"

    @staticmethod
    def _recommendation(
        risk_level: str,
        signals: list[ThreatSignalResult],
    ) -> str:
        signal_types = {signal.type for signal in signals}

        if risk_level == "critical":
            return (
                "Do not click links, disclose credentials, "
                "send money, or follow the requested action. "
                "Verify the sender through an independent channel."
            )

        if risk_level == "high":
            return (
                "Treat this message as potentially malicious. "
                "Do not follow links or disclose sensitive information "
                "until the request is independently verified."
            )

        if "credential_request" in signal_types:
            return (
                "Never provide passwords, OTPs, PINs, or login codes "
                "through an unverified message."
            )

        if risk_level == "medium":
            return (
                "Treat the message cautiously and verify the sender "
                "before taking action."
            )

        return (
            "No strong manipulation pattern was detected. "
            "Continue using normal message safety practices."
        )
