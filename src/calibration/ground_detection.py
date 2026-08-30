"""Conservative calibration-region masking utilities."""

import numpy as np


def calibration_mask(
	relative_depth: np.ndarray,
	reference_elevation: np.ndarray,
	supplied_mask: np.ndarray | None = None,
) -> np.ndarray:
	"""Return finite pixels eligible for calibration.

	This baseline does not claim to distinguish bare ground from buildings,
	trees, water, or roads. A future semantic model can provide
	``supplied_mask`` to narrow the eligible region.
	"""
	depth = np.asarray(relative_depth)
	elevation = np.asarray(reference_elevation)
	if depth.shape != elevation.shape:
		raise ValueError("relative_depth and reference_elevation must have the same shape")
	mask = np.isfinite(depth) & np.isfinite(elevation)
	if supplied_mask is not None:
		external = np.asarray(supplied_mask, dtype=bool)
		if external.shape != depth.shape:
			raise ValueError("supplied_mask must have the same shape as the input arrays")
		mask &= external
	return mask
