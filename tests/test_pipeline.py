import numpy as np
import pytest
from PIL import Image
import rasterio
from rasterio.transform import from_origin

from src.calibration.scale_shift import CalibrationResult
from src.pipeline import process_image, process_path


class FakeDepthModel:
    def predict(self, image: np.ndarray) -> np.ndarray:
        return image[..., 0].astype(np.float32)


def test_process_image_generates_relative_product_without_calibration() -> None:
    image = np.zeros((2, 2, 3), dtype=np.uint8)
    image[..., 0] = [[1, 2], [3, 4]]

    result = process_image(image, FakeDepthModel(), transform=from_origin(10, 20, 2, 2))

    assert not result.is_metric
    assert np.array_equal(result.relative_depth, result.dsm)
    assert result.mesh.triangles.shape == (2, 3)
    assert np.allclose(result.heightfield.vertices[0], [11, 19, 1])


def test_process_image_generates_metric_product_with_calibration() -> None:
    image = np.zeros((2, 2, 3), dtype=np.uint8)
    image[..., 0] = [[1, 2], [3, 4]]
    calibration = CalibrationResult(2.0, 10.0, 0.0, 4, 4)

    result = process_image(image, FakeDepthModel(), calibration)

    assert result.is_metric
    assert np.array_equal(result.dsm, [[12, 14], [16, 18]])


def test_process_image_supports_configured_tiled_inference() -> None:
    image = np.zeros((3, 5, 3), dtype=np.uint8)
    image[..., 0] = np.arange(15, dtype=np.uint8).reshape(3, 5)

    result = process_image(image, FakeDepthModel(), tile_size=3, overlap=0.5)

    assert np.array_equal(result.relative_depth, image[..., 0])


def test_process_image_rejects_invalid_rgb_input() -> None:
    with pytest.raises(ValueError, match="shape"):
        process_image(np.zeros((2, 2)), FakeDepthModel())


def test_process_image_requires_calibration_for_uncertainty() -> None:
    image = np.ones((2, 2, 3), dtype=np.uint8)
    with pytest.raises(ValueError, match="requires calibration"):
        process_image(image, FakeDepthModel(), reference_elevation=np.ones((2, 2)))


def test_process_path_routes_png_to_pixel_coordinates(tmp_path) -> None:
    source = tmp_path / "scene.png"
    Image.fromarray(np.full((2, 2, 3), 4, dtype=np.uint8)).save(source)

    result = process_path(source, FakeDepthModel())

    assert result.raster_metadata is None
    assert np.allclose(result.heightfield.vertices[:, :2], [[0.5, 0.5], [1.5, 0.5], [0.5, 1.5], [1.5, 1.5]])


def test_process_path_preserves_geotiff_metadata(tmp_path) -> None:
    source = tmp_path / "scene.tif"
    transform = from_origin(100, 200, 2, 2)
    with rasterio.open(source, "w", driver="GTiff", width=2, height=2, count=3, dtype="uint8", crs="EPSG:32644", transform=transform) as dataset:
        dataset.write(np.full((3, 2, 2), 4, dtype=np.uint8))

    result = process_path(source, FakeDepthModel())

    assert result.raster_metadata is not None
    assert result.raster_metadata.crs.to_epsg() == 32644
    assert result.raster_metadata.transform == transform