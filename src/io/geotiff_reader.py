"""GeoTIFF loading with geospatial metadata preservation."""

import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import rasterio

from src.io.metadata import RasterMetadata

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class GeoTiffImage:
	"""Raster pixels and their source geospatial metadata."""

	data: np.ndarray
	metadata: RasterMetadata


def read_geotiff(path: str | Path) -> GeoTiffImage:
	"""Read a GeoTIFF as ``(height, width, bands)`` array.

	Raises:
		ValueError: If the file is not a TIFF or has no CRS.
	"""
	image_path = Path(path)
	if not image_path.is_file():
		raise FileNotFoundError(f"GeoTIFF does not exist: {image_path}")
	if image_path.suffix.lower() not in {".tif", ".tiff"}:
		raise ValueError("GeoTIFF input must have a .tif or .tiff extension")

	with rasterio.open(image_path) as dataset:
		if dataset.crs is None:
			raise ValueError(f"GeoTIFF has no CRS: {image_path}")
		band_data = dataset.read()
		if band_data.size == 0:
			raise ValueError(f"GeoTIFF contains no raster data: {image_path}")
		metadata = RasterMetadata(
			crs=dataset.crs,
			transform=dataset.transform,
			bounds=(dataset.bounds.left, dataset.bounds.bottom, dataset.bounds.right, dataset.bounds.top),
			width=dataset.width,
			height=dataset.height,
			band_count=dataset.count,
			nodata=dataset.nodata,
			dtype=dataset.dtypes[0],
		)

	data = np.moveaxis(band_data, 0, -1)
	LOGGER.info("Loaded GeoTIFF %s (%s, CRS %s)", image_path, data.shape, metadata.crs)
	return GeoTiffImage(data=data, metadata=metadata)
