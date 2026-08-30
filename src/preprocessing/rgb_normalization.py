"""RGB normalization utilities for depth-model inputs."""

import numpy as np


def normalize_rgb(
	image: np.ndarray,
	mean: tuple[float, float, float] | None = None,
	standard_deviation: tuple[float, float, float] | None = None,
) -> np.ndarray:
	"""Convert an RGB image to channel-first float32 model input.

	Values are scaled from uint8's ``[0, 255]`` range to ``[0, 1]`` before
	optional per-channel standardization.
	"""
	array = np.asarray(image)
	if array.ndim != 3 or array.shape[2] != 3:
		raise ValueError("image must have shape (height, width, 3)")
	if not np.issubdtype(array.dtype, np.number):
		raise ValueError("image must contain numeric values")

	normalized = array.astype(np.float32) / 255.0
	if np.any(normalized < 0) or np.any(normalized > 1):
		raise ValueError("image values must be in the range [0, 255]")
	if (mean is None) != (standard_deviation is None):
		raise ValueError("mean and standard_deviation must be provided together")
	if mean is not None and standard_deviation is not None:
		channel_mean = np.asarray(mean, dtype=np.float32)
		channel_std = np.asarray(standard_deviation, dtype=np.float32)
		if channel_mean.shape != (3,) or channel_std.shape != (3,):
			raise ValueError("mean and standard_deviation must each contain three values")
		if np.any(channel_std <= 0):
			raise ValueError("standard_deviation values must be positive")
		normalized = (normalized - channel_mean) / channel_std

	return np.moveaxis(normalized, -1, 0)
