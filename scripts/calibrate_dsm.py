"""Calibrate a relative-depth NumPy array against reference elevations."""

import argparse
from pathlib import Path

import numpy as np

from src.calibration.scale_shift import calibrate_scale_shift
from src.dsm.generate import generate_metric_dsm


def main() -> int:
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("relative_depth", type=Path)
	parser.add_argument("reference", type=Path)
	parser.add_argument("--output", type=Path, required=True)
	parser.add_argument("--parameters", type=Path)
	args = parser.parse_args()
	relative_depth = np.load(args.relative_depth)
	reference = np.load(args.reference)
	calibration = calibrate_scale_shift(relative_depth, reference)
	args.output.parent.mkdir(parents=True, exist_ok=True)
	np.save(args.output, generate_metric_dsm(relative_depth, calibration))
	if args.parameters:
		args.parameters.parent.mkdir(parents=True, exist_ok=True)
		args.parameters.write_text(
			f"{{\"scale\": {calibration.scale}, \"shift\": {calibration.shift}, "
			f"\"residual_rmse\": {calibration.residual_rmse}}}\n",
			encoding="utf-8",
		)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
