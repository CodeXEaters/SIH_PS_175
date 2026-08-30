"""Postprocessing for relative monocular depth outputs."""

import numpy as np


def normalize_relative_depth(depth: np.ndarray) -> np.ndarray:
	"""Min-max normalize finite depth values to ``[0, 1]``.

	Invalid pixels remain NaN and are never interpreted as metric elevation.
	"""
	values = np.asarray(depth, dtype=np.float32)
	if values.ndim != 2:
		raise ValueError("depth must be a 2D array")
	finite = np.isfinite(values)
	if not np.any(finite):
		raise ValueError("depth contains no finite values")
	minimum = np.min(values[finite])
	maximum = np.max(values[finite])
	normalized = np.full(values.shape, np.nan, dtype=np.float32)
	if maximum > minimum:
		normalized[finite] = (values[finite] - minimum) / (maximum - minimum)
	else:
		normalized[finite] = 0.0
	return normalized
