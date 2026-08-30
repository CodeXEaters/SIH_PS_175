"""Masked DSM smoothing utilities."""

import numpy as np


def smooth_dsm(dsm: np.ndarray, iterations: int = 1) -> np.ndarray:
	"""Apply a 3x3 finite-neighbor mean without filling isolated holes."""
	result = np.asarray(dsm, dtype=np.float32).copy()
	if result.ndim != 2:
		raise ValueError("dsm must be a 2D array")
	if iterations < 1:
		raise ValueError("iterations must be positive")
	for _ in range(iterations):
		padded = np.pad(result, 1, mode="constant", constant_values=np.nan)
		windows = np.lib.stride_tricks.sliding_window_view(padded, (3, 3))
		finite = np.isfinite(windows)
		count = finite.sum(axis=(-2, -1))
		total = np.nansum(windows, axis=(-2, -1))
		smoothed = total / np.maximum(count, 1)
		smoothed[count == 0] = np.nan
		smoothed[~np.isfinite(result)] = np.nan
		result = smoothed.astype(np.float32)
	return result
