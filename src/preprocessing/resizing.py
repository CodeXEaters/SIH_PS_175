"""Image resizing helpers for model input preparation."""

import numpy as np
from PIL import Image


def resize_rgb(image: np.ndarray, size: tuple[int, int]) -> np.ndarray:
	"""Resize an RGB HWC array to ``(height, width)`` using Lanczos sampling."""
	array = np.asarray(image)
	if array.ndim != 3 or array.shape[2] != 3:
		raise ValueError("image must have shape (height, width, 3)")
	height, width = size
	if height < 1 or width < 1:
		raise ValueError("size dimensions must be positive")
	if not np.issubdtype(array.dtype, np.integer) or np.any(array < 0) or np.any(array > 255):
		raise ValueError("image must contain integer values in the range [0, 255]")

	resized = Image.fromarray(array.astype(np.uint8), mode="RGB").resize(
		(width, height), Image.Resampling.LANCZOS
	)
	return np.asarray(resized, dtype=np.uint8).copy()
