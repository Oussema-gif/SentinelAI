from __future__ import annotations

import pytest

from api.app.security.privacy import (
    message_fingerprint,
    safe_evidence_for_storage,
    safe_url_for_storage,
)


def test_message_fingerprint_changes_with_secret(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("MESSAGE_FINGERPRINT_SECRET", "first-secret")
    first = message_fingerprint("same message")

    monkeypatch.setenv("MESSAGE_FINGERPRINT_SECRET", "second-secret")
    second = message_fingerprint("same message")

    assert first != second
    assert len(first) == 64


def test_message_fingerprint_requires_secret_in_production(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("MESSAGE_FINGERPRINT_SECRET", raising=False)

    with pytest.raises(RuntimeError, match="MESSAGE_FINGERPRINT_SECRET"):
        message_fingerprint("private message")


def test_message_fingerprint_uses_development_fallback(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("MESSAGE_FINGERPRINT_SECRET", raising=False)

    fingerprint = message_fingerprint("private message")

    assert len(fingerprint) == 64


def test_safe_url_for_storage_removes_query_and_fragment() -> None:
    assert (
        safe_url_for_storage("HTTPS://Example.COM/reset?token=secret#confirmation")
        == "https://example.com/reset"
    )


def test_safe_url_for_storage_rejects_non_absolute_url() -> None:
    assert safe_url_for_storage("/private/path?token=secret") == ""


def test_safe_evidence_for_storage_normalizes_and_limits() -> None:
    evidence = "  sensitive    phrase\\n" + ("x" * 300)

    stored = safe_evidence_for_storage(evidence)

    assert stored.startswith("sensitive phrase")
    assert len(stored) == 256
