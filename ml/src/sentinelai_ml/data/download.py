from __future__ import annotations

import hashlib
import shutil
import tempfile
import urllib.request
import zipfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[4]
RAW_DIR = PROJECT_ROOT / "ml" / "data" / "raw"

DATASET_URL = "https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip"

EXPECTED_FILES = {
    "SMSSpamCollection",
    "readme",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def download_dataset() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir) / "sms_spam_collection.zip"

        print(f"Downloading dataset from:\n{DATASET_URL}")

        urllib.request.urlretrieve(DATASET_URL, temp_path)

        print(f"Downloaded archive SHA-256: {sha256_file(temp_path)}")

        with zipfile.ZipFile(temp_path) as archive:
            members = {
                Path(member).name
                for member in archive.namelist()
                if not member.endswith("/")
            }

            missing = EXPECTED_FILES - members
            if missing:
                raise RuntimeError(
                    f"Dataset archive is missing expected files: {sorted(missing)}"
                )

            extract_dir = Path(temp_dir) / "extracted"
            archive.extractall(extract_dir)

        for expected_file in EXPECTED_FILES:
            candidates = list(extract_dir.rglob(expected_file))

            if not candidates:
                raise RuntimeError(f"Could not locate extracted file: {expected_file}")

            shutil.copy2(candidates[0], RAW_DIR / expected_file)

    print("\nDataset acquisition completed.")
    print(f"Raw directory: {RAW_DIR}")

    for path in sorted(RAW_DIR.iterdir()):
        if path.is_file():
            print(f"{path.name}: {path.stat().st_size} bytes")


if __name__ == "__main__":
    download_dataset()
