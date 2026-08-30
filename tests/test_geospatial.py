import numpy as np
import pytest
import rasterio
from rasterio.transform import from_origin
from rasterio.enums import Resampling

from src.geospatial.geotiff import write_geotiff
from src.io.geotiff_reader import read_geotiff
from src.calibration.srtm_alignment import align_dem_to_image
from src.validation.alignment import align_raster


def test_read_geotiff_preserves_spatial_metadata(tmp_path) -> None:
	source = tmp_path / "scene.tif"
	transform = from_origin(500000, 4600000, 2, 2)
	with rasterio.open(
		source,
		"w",
		driver="GTiff",
		width=3,
		height=2,
		count=3,
		dtype="uint8",
		crs="EPSG:32644",
		transform=transform,
		nodata=0,
	) as dataset:
		dataset.write(np.arange(18, dtype=np.uint8).reshape(3, 2, 3))

	loaded = read_geotiff(source)

	assert loaded.data.shape == (2, 3, 3)
	assert loaded.metadata.crs.to_epsg() == 32644
	assert loaded.metadata.transform == transform
	assert loaded.metadata.resolution == (2, 2)
	assert loaded.metadata.bounds == (500000, 4599996, 500006, 4600000)
	assert loaded.metadata.band_count == 3
	assert loaded.metadata.nodata == 0
	assert loaded.metadata.dtype == "uint8"


def test_read_geotiff_requires_crs(tmp_path) -> None:
	source = tmp_path / "unreferenced.tif"
	with rasterio.open(source, "w", driver="GTiff", width=1, height=1, count=1, dtype="float32") as dataset:
		dataset.write(np.ones((1, 1, 1), dtype=np.float32))

	with pytest.raises(ValueError, match="no CRS"):
		read_geotiff(source)


def test_write_geotiff_round_trips_data_and_metadata(tmp_path) -> None:
	source = tmp_path / "source.tif"
	output = tmp_path / "nested" / "output.tif"
	transform = from_origin(10, 20, 1, 1)
	with rasterio.open(
		source,
		"w",
		driver="GTiff",
		width=2,
		height=2,
		count=1,
		dtype="float32",
		crs="EPSG:4326",
		transform=transform,
		nodata=-9999,
	) as dataset:
		dataset.write(np.array([[[1.0, 2.0], [3.0, -9999.0]]], dtype=np.float32))

	loaded = read_geotiff(source)
	write_geotiff(output, np.array([[4.0, 5.0], [6.0, 7.0]], dtype=np.float32), loaded.metadata)
	round_tripped = read_geotiff(output)

	assert np.array_equal(round_tripped.data[..., 0], [[4.0, 5.0], [6.0, 7.0]])
	assert round_tripped.metadata.crs == loaded.metadata.crs
	assert round_tripped.metadata.transform == transform
	assert round_tripped.metadata.nodata == -9999


def test_align_raster_reprojects_to_target_geometry() -> None:
	source = np.full((2, 2), 7.0, dtype=np.float32)

	aligned = align_raster(
		source,
		from_origin(0, 4, 2, 2),
		"EPSG:32644",
		(4, 4),
		from_origin(0, 4, 1, 1),
		"EPSG:32644",
		resampling=Resampling.nearest,
	)

	assert aligned.shape == (4, 4)
	assert np.all(aligned == 7.0)


def test_align_raster_rejects_non_overlapping_extent() -> None:
	with pytest.raises(ValueError, match="does not overlap"):
		align_raster(
			np.ones((2, 2), dtype=np.float32),
			from_origin(0, 2, 1, 1),
			"EPSG:32644",
			(2, 2),
			from_origin(100, 102, 1, 1),
			"EPSG:32644",
		)


def test_align_dem_to_image_uses_image_pixel_grid() -> None:
	aligned = align_dem_to_image(
		np.full((2, 2), 120.0, dtype=np.float32),
		from_origin(0, 4, 2, 2),
		"EPSG:32644",
		(4, 4),
		from_origin(0, 4, 1, 1),
		"EPSG:32644",
		resampling=Resampling.nearest,
	)

	assert aligned.shape == (4, 4)
	assert np.all(aligned == 120.0)
