"""Raster alignment for trustworthy elevation comparisons."""

import numpy as np
from rasterio.crs import CRS
from rasterio.enums import Resampling
from rasterio.transform import Affine, array_bounds
from rasterio.warp import reproject, transform_bounds


def align_raster(
	source: np.ndarray,
	source_transform: Affine,
	source_crs: CRS | str,
	target_shape: tuple[int, int],
	target_transform: Affine,
	target_crs: CRS | str,
	*,
	resampling: Resampling = Resampling.bilinear,
) -> np.ndarray:
	"""Reproject a raster onto target geometry, using NaN for uncovered pixels."""
	source_array = np.asarray(source, dtype=np.float32)
	if source_array.ndim != 2:
		raise ValueError("source raster must be a 2D array")
	if len(target_shape) != 2 or any(size < 1 for size in target_shape):
		raise ValueError("target_shape must contain two positive dimensions")
	source_crs = CRS.from_user_input(source_crs)
	target_crs = CRS.from_user_input(target_crs)
	source_bounds = transform_bounds(
		source_crs,
		target_crs,
		*array_bounds(source_array.shape[0], source_array.shape[1], source_transform),
	)
	target_bounds = array_bounds(target_shape[0], target_shape[1], target_transform)
	if (
		source_bounds[2] <= target_bounds[0]
		or source_bounds[0] >= target_bounds[2]
		or source_bounds[3] <= target_bounds[1]
		or source_bounds[1] >= target_bounds[3]
	):
		raise ValueError("source raster does not overlap target extent")

	aligned = np.full(target_shape, np.nan, dtype=np.float32)
	reproject(
		source=source_array,
		destination=aligned,
		src_transform=source_transform,
		src_crs=source_crs,
		dst_transform=target_transform,
		dst_crs=target_crs,
		src_nodata=np.nan,
		dst_nodata=np.nan,
		resampling=resampling,
	)
	return aligned
