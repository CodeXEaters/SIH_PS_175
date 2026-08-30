"""Geometry-preserving augmentation for image/depth training pairs."""

import numpy as np


def flip_pair(
	image: np.ndarray,
	target: np.ndarray,
	*,
	horizontal: bool = False,
	vertical: bool = False,
) -> tuple[np.ndarray, np.ndarray]:
	"""Apply matching horizontal/vertical flips to an image and target."""
	image_array = np.asarray(image)
	target_array = np.asarray(target)
	if image_array.shape[:2] != target_array.shape[:2]:
		raise ValueError("image and target must have matching spatial dimensions")
	image_result = image_array.copy()
	target_result = target_array.copy()
	axes = []
	if vertical:
		axes.append(0)
	if horizontal:
		axes.append(1)
	if axes:
		image_result = np.flip(image_result, axis=tuple(axes)).copy()
		target_result = np.flip(target_result, axis=tuple(axes)).copy()
	return image_result, target_result
