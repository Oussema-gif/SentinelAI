from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path

ALLOWED_LABELS = frozenset({"ham", "spam"})


class DatasetValidationError(ValueError):
    """Raised when the dataset violates the SentinelAI data contract."""


@dataclass(frozen=True)
class DatasetValidationReport:
    path: str
    row_count: int
    label_counts: dict[str, int]
    label_percentages: dict[str, float]
    duplicate_rows: int
    empty_messages: int
    min_message_length: int
    max_message_length: int
    mean_message_length: float
    median_message_length: float
    encoding: str
    passed: bool

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def _read_lines(path: Path) -> list[str]:
    if not path.exists():
        raise DatasetValidationError(f"Dataset does not exist: {path}")

    if not path.is_file():
        raise DatasetValidationError(f"Dataset path is not a file: {path}")

    try:
        return path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError as exc:
        raise DatasetValidationError(f"Dataset is not valid UTF-8: {path}") from exc


def validate_dataset(path: str | Path) -> DatasetValidationReport:
    dataset_path = Path(path)

    lines = _read_lines(dataset_path)

    if not lines:
        raise DatasetValidationError("Dataset is empty.")

    labels: list[str] = []
    messages: list[str] = []
    malformed_rows: list[tuple[int, str]] = []

    for line_number, line in enumerate(lines, start=1):
        if "\t" not in line:
            malformed_rows.append((line_number, line))
            continue

        label, message = line.split("\t", maxsplit=1)

        if not label:
            malformed_rows.append((line_number, line))
            continue

        if label not in ALLOWED_LABELS:
            raise DatasetValidationError(
                f"Unsupported label on line {line_number}: {label!r}. "
                f"Expected one of {sorted(ALLOWED_LABELS)}."
            )

        labels.append(label)
        messages.append(message)

    if malformed_rows:
        sample = malformed_rows[:5]
        raise DatasetValidationError(
            f"Malformed dataset rows detected. Showing up to 5 examples: {sample}"
        )

    empty_messages = sum(not message.strip() for message in messages)

    if empty_messages:
        raise DatasetValidationError(
            f"Dataset contains {empty_messages} empty message(s)."
        )

    row_pairs = list(zip(labels, messages, strict=True))
    duplicate_rows = len(row_pairs) - len(set(row_pairs))

    # Duplicate rows are reported as a data-quality finding rather than
    # treated as a hard validation failure. The downstream modeling phase
    # must explicitly prevent duplicates from contaminating evaluation.
    message_lengths = [len(message) for message in messages]

    label_counts = Counter(labels)

    row_count = len(messages)

    if row_count == 0:
        raise DatasetValidationError("Dataset contains no valid rows.")

    if set(label_counts) != ALLOWED_LABELS:
        raise DatasetValidationError(
            f"Dataset must contain both required labels: {sorted(ALLOWED_LABELS)}."
        )

    label_percentages = {
        label: round(count / row_count * 100, 4)
        for label, count in sorted(label_counts.items())
    }

    return DatasetValidationReport(
        path=str(dataset_path),
        row_count=row_count,
        label_counts=dict(sorted(label_counts.items())),
        label_percentages=label_percentages,
        duplicate_rows=duplicate_rows,
        empty_messages=empty_messages,
        min_message_length=min(message_lengths),
        max_message_length=max(message_lengths),
        mean_message_length=round(statistics.mean(message_lengths), 4),
        median_message_length=round(statistics.median(message_lengths), 4),
        encoding="UTF-8",
        passed=True,
    )


def write_validation_report(
    report: DatasetValidationReport,
    output_path: str | Path,
) -> Path:
    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)

    destination.write_text(
        json.dumps(report.to_dict(), indent=2) + "\n",
        encoding="utf-8",
    )

    return destination


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate the SentinelAI SMS Spam Collection dataset."
    )
    parser.add_argument(
        "dataset",
        nargs="?",
        default="ml/data/raw/SMSSpamCollection",
        help="Path to the SMS dataset.",
    )
    parser.add_argument(
        "--report",
        default="ml/data/processed/validation_report.json",
        help="Output JSON validation report.",
    )

    args = parser.parse_args()

    try:
        report = validate_dataset(args.dataset)
    except DatasetValidationError as exc:
        print(f"VALIDATION FAILED: {exc}")
        return 1

    destination = write_validation_report(report, args.report)

    print("VALIDATION PASSED")
    print(f"Rows: {report.row_count}")
    print(f"Labels: {report.label_counts}")
    print(f"Label percentages: {report.label_percentages}")
    print(f"Duplicate rows: {report.duplicate_rows}")
    print(f"Message length: {report.min_message_length}-{report.max_message_length}")
    print(f"Mean length: {report.mean_message_length}")
    print(f"Median length: {report.median_message_length}")
    print(f"Report: {destination}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
