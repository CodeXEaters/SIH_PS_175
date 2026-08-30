"""Transparent uncertainty proxies for calibrated elevation products."""

import numpy as np

from src.calibration.scale_shift import CalibrationResult


def calibration_uncertainty(
	relative_depth: np.ndarray,
	reference_elevation: np.ndarray,
	calibration: CalibrationResult,
) -> np.ndarray:
	"""Return absolute calibration residuals as an uncertainty proxy.

	This is a residual diagnostic in elevation units, not a confidence
	interval. Pixels with invalid inputs remain NaN.
	"""
	depth = np.asarray(relative_depth, dtype=np.float32)
	reference = np.asarray(reference_elevation, dtype=np.float32)
	if depth.shape != reference.shape or depth.ndim != 2:
		raise ValueError("depth and reference elevation must be matching 2D arrays")
	predicted = calibration.apply(depth)
	uncertainty = np.abs(predicted - reference).astype(np.float32)
	uncertainty[~(np.isfinite(depth) & np.isfinite(reference))] = np.nan
	return uncertainty
