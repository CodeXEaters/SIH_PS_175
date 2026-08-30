"""Alignment of coarse DEM/SRTM rasters to image geometry."""

import numpy as np
from rasterio.crs import CRS
from rasterio.enums import Resampling
from rasterio.transform import Affine

from src.validation.alignment import align_raster


def align_dem_to_image(
	dem: np.ndarray,
	dem_transform: Affine,
	dem_crs: CRS | str,
	image_shape: tuple[int, int],
	image_transform: Affine,
	image_crs: CRS | str,
	*,
	resampling: Resampling = Resampling.bilinear,
) -> np.ndarray:
	"""Resample a DEM onto the image pixel grid without changing the RGB data."""
	return align_raster(
		dem,
		dem_transform,
		dem_crs,
		image_shape,
		image_transform,
		image_crs,
		resampling=resampling,
	)
