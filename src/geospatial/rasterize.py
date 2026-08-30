"""Rasterization of sparse point elevations."""

import numpy as np
from rasterio.features import rasterize
from rasterio.transform import Affine


def rasterize_points(
	points: list[tuple[float, float, float]],
	out_shape: tuple[int, int],
	transform: Affine,
	*,
	fill: float = np.nan,
) -> np.ndarray:
	"""Rasterize ``(x, y, value)`` points into a float32 elevation grid."""
	if len(out_shape) != 2 or any(size < 1 for size in out_shape):
		raise ValueError("out_shape must contain two positive dimensions")
	shapes = [({"type": "Point", "coordinates": (x, y)}, value) for x, y, value in points]
	return rasterize(shapes, out_shape=out_shape, transform=transform, fill=fill, dtype="float32")
