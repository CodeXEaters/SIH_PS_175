import numpy as np
import pytest
from rasterio.transform import from_origin

from src.geospatial.geotransform import pixel_to_world, world_to_pixel
from src.geospatial.rasterize import rasterize_points
from src.geospatial.reprojection import reproject_raster
from src.validation.benchmark import benchmark_scenes


def test_geotransform_round_trips_pixel_center() -> None:
    transform = from_origin(100, 200, 2, 4)
    x, y = pixel_to_world(transform, 3, 5)
    assert (x, y) == (111, 186)
    assert world_to_pixel(transform, x, y) == pytest.approx((3, 5))


def test_rasterize_points_and_reproject_raster() -> None:
    transform = from_origin(0, 2, 1, 1)
    raster = rasterize_points([(0.5, 1.5, 8.0)], (2, 2), transform)
    assert raster[0, 0] == 8.0
    projected, target_transform = reproject_raster(raster, transform, "EPSG:32644", "EPSG:32644")
    assert projected.shape == raster.shape
    assert target_transform == transform


def test_benchmark_scenes_includes_overall_metrics() -> None:
    result = benchmark_scenes([("urban", np.array([1.0, 2.0]), np.array([1.0, 3.0]))])
    assert result["urban"].valid_count == 2
    assert result["overall"].mae == pytest.approx(0.5)