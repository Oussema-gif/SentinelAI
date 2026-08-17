from __future__ import annotations

import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from api.app.db.models import ModelVersion


def register_active_model(
    session: Session,
    metadata_path,
) -> None:
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))

    version = metadata["model_version"]

    existing = session.scalar(
        select(ModelVersion).where(ModelVersion.version == version)
    )

    if existing is None:
        model = ModelVersion(
            version=version,
            model_type=metadata["model_type"],
            metrics={
                "cv_results": metadata["cv_results"],
                "final_test_metrics": metadata["final_test_metrics"],
                "calibration": metadata["calibration"],
                "hyperparameters": metadata["hyperparameters"],
            },
            trained_at=datetime.fromisoformat(metadata["training_date_utc"]),
            is_active=True,
        )

        session.add(model)
    else:
        existing.is_active = True

    session.query(ModelVersion).filter(ModelVersion.version != version).update(
        {"is_active": False},
        synchronize_session=False,
    )

    session.commit()
