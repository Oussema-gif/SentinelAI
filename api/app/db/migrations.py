from __future__ import annotations

import pathlib

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import Connection, text


def get_alembic_cfg() -> Config:
    api_root = pathlib.Path(__file__).resolve().parents[2]
    alembic_ini = api_root / "alembic.ini"

    if not alembic_ini.exists():
        raise FileNotFoundError(f"alembic.ini not found at {alembic_ini}")

    return Config(str(alembic_ini))


def get_current_revision(conn: Connection) -> str | None:
    result = conn.execute(text("SELECT version_num FROM alembic_version")).fetchone()
    return result[0] if result else None


def get_head_revision() -> str:
    cfg = get_alembic_cfg()
    script = ScriptDirectory.from_config(cfg)
    return script.get_current_head()


def is_at_head(conn: Connection) -> bool:
    current = get_current_revision(conn)
    head = get_head_revision()
    return current == head
