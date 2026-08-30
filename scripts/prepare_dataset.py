"""Prepare a flat image dataset directory from a source tree."""

import argparse
import shutil
from pathlib import Path


SUPPORTED_IMAGES = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


def main() -> int:
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("source", type=Path)
	parser.add_argument("--output", type=Path, required=True)
	args = parser.parse_args()
	if not args.source.is_dir():
		parser.error(f"dataset directory does not exist: {args.source}")
	files = sorted(path for path in args.source.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED_IMAGES)
	if not files:
		parser.error("dataset contains no supported images")
	args.output.mkdir(parents=True, exist_ok=True)
	for index, source in enumerate(files):
		destination = args.output / f"{index:06d}{source.suffix.lower()}"
		shutil.copy2(source, destination)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
