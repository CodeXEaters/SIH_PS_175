"""Validate and stage a locally acquired DEM for reproducible processing."""

import argparse
import shutil
from pathlib import Path


def main() -> int:
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("source", type=Path, help="locally downloaded DEM/GeoTIFF")
	parser.add_argument("--output", type=Path, required=True)
	args = parser.parse_args()
	if not args.source.is_file():
		parser.error(f"DEM does not exist: {args.source}")
	if args.source.suffix.lower() not in {".tif", ".tiff"}:
		parser.error("DEM must be a GeoTIFF (.tif or .tiff)")
	args.output.parent.mkdir(parents=True, exist_ok=True)
	shutil.copy2(args.source, args.output)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
