"""Level-of-detail helpers for terrain meshes."""

import numpy as np


def downsample_dsm(dsm: np.ndarray, factor: int) -> np.ndarray:
	"""Downsample a DSM by finite-cell mean without modifying the source."""
	source = np.asarray(dsm, dtype=np.float32)
	if source.ndim != 2:
		raise ValueError("dsm must be a 2D array")
	if factor < 1:
		raise ValueError("factor must be positive")
	if factor == 1:
		return source.copy()
	height = source.shape[0] // factor
	width = source.shape[1] // factor
	if height < 1 or width < 1:
		raise ValueError("factor is larger than the DSM")
	trimmed = source[: height * factor, : width * factor]
	blocks = trimmed.reshape(height, factor, width, factor)
	finite = np.isfinite(blocks)
	count = finite.sum(axis=(1, 3))
	result = np.nansum(blocks, axis=(1, 3)) / np.maximum(count, 1)
	result[count == 0] = np.nan
	return result.astype(np.float32)
