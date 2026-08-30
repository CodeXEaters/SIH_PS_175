"""Conservative DSM outlier filtering."""

import numpy as np


def filter_outliers(dsm: np.ndarray, threshold: float = 3.5) -> np.ndarray:
	"""Replace robustly detected global outliers with NaN.

	The function preserves finite DSM values within ``threshold`` robust
	deviations and never changes the input array.
	"""
	result = np.asarray(dsm, dtype=np.float32).copy()
	if result.ndim != 2:
		raise ValueError("dsm must be a 2D array")
	if threshold <= 0:
		raise ValueError("threshold must be positive")
	finite = np.isfinite(result)
	if not np.any(finite):
		return result
	median = np.median(result[finite])
	deviation = np.median(np.abs(result[finite] - median))
	if deviation <= np.finfo(np.float32).eps:
		return result
	robust_z = 0.6745 * (result - median) / deviation
	result[finite & (np.abs(robust_z) > threshold)] = np.nan
	return result
