"""GeoTIFF writing utilities."""

from pathlib import Path

import numpy as np
import rasterio

from src.io.metadata import RasterMetadata


def write_geotiff(
	path: str | Path,
	data: np.ndarray,
	metadata: RasterMetadata,
	*,
	dtype: str | np.dtype | None = None,
) -> Path:
	"""Write a 2D or HWC raster while preserving spatial metadata."""
	array = np.asarray(data)
	if array.ndim == 2:
		bands = array[np.newaxis, ...]
	elif array.ndim == 3:
		bands = np.moveaxis(array, -1, 0)
	else:
		raise ValueError("data must be a 2D or 3D array")
	if bands.shape[1:] != (metadata.height, metadata.width):
		raise ValueError("data dimensions do not match raster metadata")

	output_path = Path(path)
	output_path.parent.mkdir(parents=True, exist_ok=True)
	output_dtype = np.dtype(dtype or array.dtype)
	with rasterio.open(
		output_path,
		"w",
		driver="GTiff",
		width=metadata.width,
		height=metadata.height,
		count=bands.shape[0],
		dtype=output_dtype,
		crs=metadata.crs,
		transform=metadata.transform,
		nodata=metadata.nodata,
	) as dataset:
		dataset.write(bands.astype(output_dtype, copy=False))
	return output_path
