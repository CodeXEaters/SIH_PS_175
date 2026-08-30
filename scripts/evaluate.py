"""Evaluate two aligned NumPy elevation arrays and write a JSON report."""

import argparse
from pathlib import Path

import numpy as np

from src.validation.metrics import calculate_metrics
from src.validation.reports import write_metrics_report


def main() -> int:
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("estimated", type=Path)
	parser.add_argument("reference", type=Path)
	parser.add_argument("--output", type=Path, required=True)
	args = parser.parse_args()
	estimated = np.load(args.estimated)
	reference = np.load(args.reference)
	metrics = calculate_metrics(estimated, reference)
	write_metrics_report(args.output, metrics, metadata={"estimated": str(args.estimated), "reference": str(args.reference)})
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
