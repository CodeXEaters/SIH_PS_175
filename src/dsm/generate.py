"""Digital surface model generation from depth products."""

import numpy as np

from src.calibration.scale_shift import CalibrationResult


def generate_relative_dsm(relative_depth: np.ndarray) -> np.ndarray:
	"""Return a validated copy of a relative depth surface."""
	depth = np.asarray(relative_depth, dtype=np.float32)
	if depth.ndim != 2:
		raise ValueError("relative_depth must be a 2D array")
	if not np.any(np.isfinite(depth)):
		raise ValueError("relative_depth contains no finite values")
	return depth.copy()


def generate_metric_dsm(
	relative_depth: np.ndarray,
	calibration: CalibrationResult,
) -> np.ndarray:
	"""Apply calibrated scale and shift to produce metric elevation."""
	relative_dsm = generate_relative_dsm(relative_depth)
	metric_dsm = calibration.apply(relative_dsm).astype(np.float32)
	metric_dsm[~np.isfinite(relative_dsm)] = np.nan
	return metric_dsm
