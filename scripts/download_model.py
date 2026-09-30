"""Model checkpoint verification and download utility for deployment."""

from __future__ import annotations

import argparse
import os
import sys
import urllib.request
from pathlib import Path

DEFAULT_CHECKPOINT = Path("models/checkpoints/depth_anything_v2_vits.pt")
EXPECTED_MIN_BYTES = 50 * 1024 * 1024  # ~50 MB minimum for valid weights


def download_file(url: str, dest_path: Path) -> None:
    """Download a file from url with a terminal progress indicator."""
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = dest_path.with_suffix(dest_path.suffix + ".tmp")

    print(f"Downloading model from {url} to {dest_path}...")

    def progress(blocks_transferred: int, block_size: int, total_size: int) -> None:
        if total_size > 0:
            percent = (blocks_transferred * block_size * 100) / total_size
            downloaded_mb = (blocks_transferred * block_size) / (1024 * 1024)
            total_mb = total_size / (1024 * 1024)
            sys.stdout.write(f"\rDownloading: {downloaded_mb:.1f} MB / {total_mb:.1f} MB ({percent:.1f}%)")
            sys.stdout.flush()

    try:
        urllib.request.urlretrieve(url, temp_path, reporthook=progress)
        temp_path.replace(dest_path)
        print(f"\nDownload completed successfully: {dest_path} ({dest_path.stat().st_size} bytes)")
    except Exception as exc:
        if temp_path.exists():
            temp_path.unlink()
        raise RuntimeError(f"Failed to download from {url}: {exc}") from exc


def verify_or_download_checkpoint(checkpoint_path: Path, download_url: str | None = None) -> bool:
    """Verify if checkpoint exists, or download from URL if provided."""
    checkpoint_path = checkpoint_path.resolve()

    if checkpoint_path.is_file():
        file_size = checkpoint_path.stat().st_size
        if file_size >= EXPECTED_MIN_BYTES:
            print(f"[OK] Valid checkpoint found at: {checkpoint_path} ({file_size / (1024 * 1024):.1f} MB)")
            return True
        print(f"[WARN] Checkpoint exists but appears truncated: {checkpoint_path} ({file_size} bytes)")

    if download_url:
        print(f"[INFO] Checkpoint not found locally. Initiating download from DEPTH_MODEL_URL...")
        download_file(download_url, checkpoint_path)
        return True

    print(
        f"[INFO] No checkpoint found at {checkpoint_path}.\n"
        "       The backend will start cleanly, but depth inference jobs will require the checkpoint.\n"
        "       To provide it in containerized environments:\n"
        "       1. Mount a volume: -v ./models/checkpoints:/app/models/checkpoints\n"
        "       2. Set DEPTH_MODEL_URL to a direct download link for depth_anything_v2_vits.pt\n"
        "       3. Or copy the model file into models/checkpoints/ before building."
    )
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--checkpoint",
        type=Path,
        default=Path(os.getenv("DEPTH_CHECKPOINT", str(DEFAULT_CHECKPOINT))),
        help="Path to TorchScript checkpoint",
    )
    parser.add_argument(
        "--url",
        type=str,
        default=os.getenv("DEPTH_MODEL_URL"),
        help="Direct download URL for the TorchScript checkpoint",
    )
    args = parser.parse_args()

    found = verify_or_download_checkpoint(args.checkpoint, args.url)
    return 0 if found else 0  # non-fatal so build/entrypoint continues gracefully


if __name__ == "__main__":
    raise SystemExit(main())
