from __future__ import annotations

import os


def get_database_url() -> str:
    value = os.getenv("DATABASE_URL")

    if not value:
        raise RuntimeError("DATABASE_URL environment variable is required.")

    return value
