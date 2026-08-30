"""Affine pixel/world coordinate conversions."""

from rasterio.transform import Affine


def pixel_to_world(transform: Affine, row: float, column: float, *, center: bool = True) -> tuple[float, float]:
	"""Convert a raster row/column to CRS coordinates."""
	offset = 0.5 if center else 0.0
	return transform * (column + offset, row + offset)


def world_to_pixel(transform: Affine, x: float, y: float, *, center: bool = True) -> tuple[float, float]:
	"""Convert CRS coordinates to floating-point row/column coordinates."""
	column, row = (~transform) * (x, y)
	offset = 0.5 if center else 0.0
	return row - offset, column - offset
