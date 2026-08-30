"""Conversion of elevation rasters into spatial terrain vertices."""

from dataclasses import dataclass

import numpy as np
from rasterio.transform import Affine


@dataclass(frozen=True)
class Heightfield:
	"""Terrain vertices, UVs, and source-grid shape."""

	vertices: np.ndarray
	uvs: np.ndarray
	shape: tuple[int, int]


def create_heightfield(
	dsm: np.ndarray,
	transform: Affine,
	vertical_exaggeration: float = 1.0,
) -> Heightfield:
	"""Create pixel-center terrain vertices from a 2D metric DSM."""
	elevation = np.asarray(dsm, dtype=np.float32)
	if elevation.ndim != 2:
		raise ValueError("dsm must be a 2D array")
	if vertical_exaggeration <= 0:
		raise ValueError("vertical_exaggeration must be positive")
	height, width = elevation.shape
	rows, columns = np.indices(elevation.shape, dtype=np.float64)
	x, y = transform * (columns + 0.5, rows + 0.5)
	vertices = np.column_stack((x.ravel(), y.ravel(), (elevation * vertical_exaggeration).ravel()))
	uvs = np.column_stack((columns.ravel() / max(width - 1, 1), 1 - rows.ravel() / max(height - 1, 1)))
	return Heightfield(vertices=vertices, uvs=uvs.astype(np.float32), shape=(height, width))
