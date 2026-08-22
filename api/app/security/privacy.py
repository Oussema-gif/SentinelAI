from __future__ import annotations

import hashlib
import hmac
import os
from urllib.parse import urlsplit, urlunsplit

MAX_SIGNAL_EVIDENCE_LENGTH = 256


def message_fingerprint(text: str) -> str:
    secret = os.getenv("MESSAGE_FINGERPRINT_SECRET")

    if not secret:
        if os.getenv("APP_ENV", "development").lower() == "production":
            raise RuntimeError("MESSAGE_FINGERPRINT_SECRET is required in production.")

        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    return hmac.new(
        secret.encode("utf-8"),
        text.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def safe_url_for_storage(url: str) -> str:
    parsed = urlsplit(url)

    if not parsed.scheme or not parsed.netloc:
        return ""

    return urlunsplit(
        (
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path,
            "",
            "",
        )
    )


def safe_evidence_for_storage(evidence: str) -> str:
    normalized = " ".join(evidence.split())

    return normalized[:MAX_SIGNAL_EVIDENCE_LENGTH]
