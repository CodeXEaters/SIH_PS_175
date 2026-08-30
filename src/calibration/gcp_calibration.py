"""Sparse ground-control-point calibration."""

from dataclasses import dataclass

import numpy as np

from src.calibration.scale_shift import CalibrationResult, calibrate_scale_shift


@dataclass(frozen=True)
class GroundControlPoint:
	"""A pixel coordinate and its surveyed metric elevation."""

	row: int
	column: int
	elevation: float


def calibrate_from_gcps(
	relative_depth: np.ndarray,
	gcps: list[GroundControlPoint],
) -> CalibrationResult:
	"""Fit depth-to-elevation parameters from sparse image GCPs."""
	depth = np.asarray(relative_depth, dtype=np.float64)
	if depth.ndim != 2:
		raise ValueError("relative_depth must be a 2D array")
	if len(gcps) < 2:
		raise ValueError("at least two GCPs are required")

	depth_samples = []
	elevation_samples = []
	for gcp in gcps:
		if not 0 <= gcp.row < depth.shape[0] or not 0 <= gcp.column < depth.shape[1]:
			raise ValueError(f"GCP pixel is outside the depth raster: ({gcp.row}, {gcp.column})")
		depth_samples.append(depth[gcp.row, gcp.column])
		elevation_samples.append(gcp.elevation)
	return calibrate_scale_shift(np.asarray(depth_samples), np.asarray(elevation_samples))
