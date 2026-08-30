"""Small-gap filling for DSM rasters."""

import numpy as np


def fill_holes(dsm: np.ndarray, iterations: int = 1) -> np.ndarray:
	"""Fill NaN pixels from finite 4-neighbor means for a limited number of passes."""
	result = np.asarray(dsm, dtype=np.float32).copy()
	if result.ndim != 2:
		raise ValueError("dsm must be a 2D array")
	if iterations < 1:
		raise ValueError("iterations must be positive")
	for _ in range(iterations):
		missing = ~np.isfinite(result)
		if not np.any(missing):
			break
		padded = np.pad(result, 1, mode="constant", constant_values=np.nan)
		neighbors = np.stack(
			[padded[:-2, 1:-1], padded[2:, 1:-1], padded[1:-1, :-2], padded[1:-1, 2:]],
			axis=0,
		)
		valid_count = np.sum(np.isfinite(neighbors), axis=0)
		replacement = np.nansum(neighbors, axis=0) / np.maximum(valid_count, 1)
		fillable = missing & (valid_count > 0)
		result[fillable] = replacement[fillable]
	return result
