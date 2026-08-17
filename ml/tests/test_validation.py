from __future__ import annotations

from pathlib import Path

import pytest
from sentinelai_ml.validation import (
    DatasetValidationError,
    validate_dataset,
    write_validation_report,
)


def write_dataset(tmp_path: Path, content: str) -> Path:
    path = tmp_path / "SMSSpamCollection"
    path.write_text(content, encoding="utf-8")
    return path


def test_valid_dataset(tmp_path: Path) -> None:
    path = write_dataset(
        tmp_path,
        "ham\tHello there\nspam\tWIN a free prize now\nham\tSee you tomorrow\n",
    )

    report = validate_dataset(path)

    assert report.passed is True
    assert report.row_count == 3
    assert report.label_counts == {"ham": 2, "spam": 1}
    assert report.duplicate_rows == 0
    assert report.empty_messages == 0
    assert report.encoding == "UTF-8"


def test_missing_dataset_fails(tmp_path: Path) -> None:
    with pytest.raises(DatasetValidationError, match="does not exist"):
        validate_dataset(tmp_path / "missing")


def test_invalid_utf8_fails(tmp_path: Path) -> None:
    path = tmp_path / "dataset"
    path.write_bytes(b"ham\tHello\nspam\t\xff\xfe")

    with pytest.raises(DatasetValidationError, match="UTF-8"):
        validate_dataset(path)


def test_malformed_row_without_tab_fails(tmp_path: Path) -> None:
    path = write_dataset(
        tmp_path,
        "ham\tHello\nspam This row is malformed\n",
    )

    with pytest.raises(DatasetValidationError, match="Malformed"):
        validate_dataset(path)


def test_unknown_label_fails(tmp_path: Path) -> None:
    path = write_dataset(
        tmp_path,
        "ham\tHello\npromotion\tBuy this product\n",
    )

    with pytest.raises(DatasetValidationError, match="Unsupported label"):
        validate_dataset(path)


def test_empty_message_fails(tmp_path: Path) -> None:
    path = write_dataset(
        tmp_path,
        "ham\tHello\nspam\t   \n",
    )

    with pytest.raises(DatasetValidationError, match="empty message"):
        validate_dataset(path)


def test_duplicate_rows_are_reported(tmp_path: Path) -> None:
    path = write_dataset(
        tmp_path,
        "ham\tHello\nspam\tWin money\nham\tHello\n",
    )

    report = validate_dataset(path)

    assert report.passed is True
    assert report.duplicate_rows == 1


def test_dataset_requires_both_classes(tmp_path: Path) -> None:
    path = write_dataset(
        tmp_path,
        "ham\tHello\nham\tGood morning\n",
    )

    with pytest.raises(DatasetValidationError, match="both required labels"):
        validate_dataset(path)


def test_message_statistics_are_computed(tmp_path: Path) -> None:
    path = write_dataset(
        tmp_path,
        "ham\ta\nspam\tabcd\nham\tabcdef\n",
    )

    report = validate_dataset(path)

    assert report.min_message_length == 1
    assert report.max_message_length == 6
    assert report.mean_message_length == pytest.approx(11 / 3, abs=0.00005)
    assert report.median_message_length == 4


def test_report_can_be_written(tmp_path: Path) -> None:
    path = write_dataset(
        tmp_path,
        "ham\tHello\nspam\tWin now\n",
    )

    report = validate_dataset(path)
    output = write_validation_report(
        report,
        tmp_path / "validation_report.json",
    )

    assert output.exists()
    assert '"passed": true' in output.read_text(encoding="utf-8")
