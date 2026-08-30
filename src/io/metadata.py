"""Metadata models shared by geospatial raster processing."""

from dataclasses import dataclass

from rasterio import CRS
from rasterio.transform import Affine


@dataclass(frozen=True)
class RasterMetadata:
	"""Spatial and storage metadata for a raster."""

	crs: CRS
	transform: Affine
	bounds: tuple[float, float, float, float]
	width: int
	height: int
	band_count: int
	nodata: float | None
	dtype: str

	@property
	def resolution(self) -> tuple[float, float]:
		"""Return pixel width and height in source CRS units."""
		return abs(self.transform.a), abs(self.transform.e)
