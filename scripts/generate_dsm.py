"""Apply optional DSM cleanup stages to a NumPy raster."""

import argparse
from pathlib import Path

import numpy as np

from src.dsm.filtering import filter_outliers
from src.dsm.hole_filling import fill_holes
from src.dsm.smoothing import smooth_dsm


def main() -> int:
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("source", type=Path)
	parser.add_argument("--output", type=Path, required=True)
	parser.add_argument("--fill-holes", action="store_true")
	parser.add_argument("--filter-outliers", action="store_true")
	parser.add_argument("--smooth", action="store_true")
	args = parser.parse_args()
	dsm = np.load(args.source)
	if args.filter_outliers:
		dsm = filter_outliers(dsm)
	if args.fill_holes:
		dsm = fill_holes(dsm)
	if args.smooth:
		dsm = smooth_dsm(dsm)
	args.output.parent.mkdir(parents=True, exist_ok=True)
	np.save(args.output, dsm)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
