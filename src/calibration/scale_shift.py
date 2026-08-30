"""Robust scale-and-shift calibration for relative depth."""

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class CalibrationResult:
	"""Parameters and diagnostics for a depth-to-elevation fit."""

	scale: float
	shift: float
	residual_rmse: float
	inlier_count: int
	sample_count: int

	def apply(self, relative_depth: np.ndarray) -> np.ndarray:
		"""Convert relative depth values to metric elevation."""
		return self.scale * np.asarray(relative_depth, dtype=np.float64) + self.shift


def calibrate_scale_shift(
	relative_depth: np.ndarray,
	reference_elevation: np.ndarray,
	valid_mask: np.ndarray | None = None,
	*,
	iterations: int = 20,
	huber_delta: float = 1.345,
) -> CalibrationResult:
	"""Estimate ``elevation = scale * depth + shift`` robustly.

	Invalid values and pixels excluded by ``valid_mask`` are ignored. Huber
	reweighting reduces the influence of mismatched DEM samples and outliers.
	"""
	depth = np.asarray(relative_depth, dtype=np.float64)
	elevation = np.asarray(reference_elevation, dtype=np.float64)
	if depth.shape != elevation.shape:
		raise ValueError("relative_depth and reference_elevation must have the same shape")
	if valid_mask is not None:
		mask = np.asarray(valid_mask, dtype=bool)
		if mask.shape != depth.shape:
			raise ValueError("valid_mask must have the same shape as the input arrays")
	else:
		mask = np.ones(depth.shape, dtype=bool)

	mask &= np.isfinite(depth) & np.isfinite(elevation)
	depth_values = depth[mask].ravel()
	elevation_values = elevation[mask].ravel()
	if depth_values.size < 2:
		raise ValueError("at least two valid calibration samples are required")
	if np.ptp(depth_values) <= np.finfo(np.float64).eps:
		raise ValueError("relative depth must contain more than one distinct value")
	if iterations < 1 or huber_delta <= 0:
		raise ValueError("iterations must be positive and huber_delta must be positive")

	design = np.column_stack((depth_values, np.ones(depth_values.size)))
	weights = np.ones(depth_values.size)
	coefficients = np.linalg.lstsq(design, elevation_values, rcond=None)[0]
	for _ in range(iterations):
		coefficients = np.linalg.lstsq(
			design * np.sqrt(weights)[:, None],
			elevation_values * np.sqrt(weights),
			rcond=None,
		)[0]
		residuals = elevation_values - design @ coefficients
		scale = np.median(np.abs(residuals - np.median(residuals))) * 1.4826
		if scale <= np.finfo(np.float64).eps:
			break
		standardized = np.abs(residuals) / scale
		weights = np.minimum(1.0, huber_delta / np.maximum(standardized, np.finfo(float).eps))

	residuals = elevation_values - design @ coefficients
	robust_scale = np.median(np.abs(residuals - np.median(residuals))) * 1.4826
	inliers = (
		np.ones(residuals.size, dtype=bool)
		if robust_scale <= np.finfo(np.float64).eps
		else np.abs(residuals) <= huber_delta * robust_scale
	)
	return CalibrationResult(
		scale=float(coefficients[0]),
		shift=float(coefficients[1]),
		residual_rmse=float(np.sqrt(np.mean(residuals**2))),
		inlier_count=int(np.count_nonzero(inliers)),
		sample_count=int(residuals.size),
	)
