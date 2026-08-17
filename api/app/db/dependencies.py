from __future__ import annotations

from collections.abc import Generator

from sqlalchemy.orm import Session

from api.app.db.session import SessionLocal


def get_db() -> Generator[Session]:
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()
