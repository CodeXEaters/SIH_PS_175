"""Explicit raster reprojection helpers."""

import numpy as np
from rasterio.crs import CRS
from rasterio.enums import Resampling
from rasterio.transform import Affine
from rasterio.warp import calculate_default_transform, reproject


def reproject_raster(
	source: np.ndarray,
	source_transform: Affine,
	source_crs: CRS | str,
	target_crs: CRS | str,
	*,
	resampling: Resampling = Resampling.bilinear,
) -> tuple[np.ndarray, Affine]:
	"""Reproject a 2D raster to a default target grid."""
	array = np.asarray(source, dtype=np.float32)
	if array.ndim != 2:
		raise ValueError("source raster must be a 2D array")
	target_transform, width, height = calculate_default_transform(
		source_crs, target_crs, array.shape[1], array.shape[0], *array_bounds(array.shape, source_transform)
	)
	destination = np.full((height, width), np.nan, dtype=np.float32)
	reproject(
		array, destination, src_transform=source_transform, src_crs=source_crs,
		dst_transform=target_transform, dst_crs=target_crs, src_nodata=np.nan,
		dst_nodata=np.nan, resampling=resampling,
	)
	return destination, target_transform


def array_bounds(shape: tuple[int, int], transform: Affine) -> tuple[float, float, float, float]:
	"""Return left, bottom, right, top bounds for a raster shape."""
	height, width = shape
	corners = [transform * point for point in ((0, 0), (width, 0), (0, height), (width, height))]
	xs, ys = zip(*corners)
	return min(xs), min(ys), max(xs), max(ys)
