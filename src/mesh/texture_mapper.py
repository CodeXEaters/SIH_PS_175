"""RGB texture correspondence helpers for terrain meshes."""

import numpy as np


def prepare_texture(image: np.ndarray) -> np.ndarray:
	"""Validate and copy an HWC RGB image for mesh texture use."""
	texture = np.asarray(image)
	if texture.ndim != 3 or texture.shape[2] != 3:
		raise ValueError("texture must have shape (height, width, 3)")
	if texture.dtype != np.uint8:
		raise ValueError("texture must use uint8 RGB values")
	return texture.copy()


def uv_from_pixel(row: int, column: int, height: int, width: int) -> tuple[float, float]:
	"""Map a pixel coordinate to a normalized UV coordinate."""
	if not 0 <= row < height or not 0 <= column < width:
		raise ValueError("pixel coordinate is outside texture dimensions")
	if height < 1 or width < 1:
		raise ValueError("texture dimensions must be positive")
	return column / max(width - 1, 1), 1.0 - row / max(height - 1, 1)
