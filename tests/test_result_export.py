import json

import numpy as np
import rasterio
from rasterio.transform import from_origin

from src.calibration.scale_shift import CalibrationResult
from src.pipeline import process_image, process_path
from src.result_export import export_processing_result


class FakeDepthModel:
    def predict(self, image: np.ndarray) -> np.ndarray:
        return image[..., 0].astype(np.float32)


def test_export_processing_result_writes_relative_bundle(tmp_path) -> None:
    image = np.ones((2, 2, 3), dtype=np.uint8)
    result = process_image(image, FakeDepthModel())

    paths = export_processing_result(result, tmp_path)

    assert paths["relative_depth"].name == "relative_depth.npy"
    assert paths["dsm"].name == "relative_dsm.npy"
    assert paths["mesh"].is_file()
    assert json.loads(paths["metadata"].read_text())["is_metric"] is False


def test_export_processing_result_writes_geotiff_bundle(tmp_path) -> None:
    source = tmp_path / "scene.tif"
    transform = from_origin(100, 200, 2, 2)
    with rasterio.open(source, "w", driver="GTiff", width=2, height=2, count=3, dtype="uint8", crs="EPSG:32644", transform=transform) as dataset:
        data = np.zeros((3, 2, 2), dtype=np.uint8)
        data[0] = [[1, 2], [3, 4]]
        dataset.write(data)
    result = process_path(source, FakeDepthModel(), CalibrationResult(2.0, 10.0, 0.0, 4, 4))

    paths = export_processing_result(result, tmp_path)

    assert paths["dsm"].name == "absolute_dsm.tif"
    assert paths["relative_depth"].name == "relative_depth.tif"
    assert json.loads(paths["metadata"].read_text())["crs"] is not None


def test_export_processing_result_does_not_label_uncalibrated_dsm_as_absolute(tmp_path) -> None:
    source = tmp_path / "scene.tif"
    with rasterio.open(source, "w", driver="GTiff", width=2, height=2, count=3, dtype="uint8", crs="EPSG:32644", transform=from_origin(100, 200, 2, 2)) as dataset:
        dataset.write(np.ones((3, 2, 2), dtype=np.uint8))

    result = process_path(source, FakeDepthModel())
    paths = export_processing_result(result, tmp_path / "relative")

    assert paths["dsm"].name == "relative_dsm.tif"


def test_export_processing_result_writes_optional_uncertainty(tmp_path) -> None:
    image = np.zeros((2, 2, 3), dtype=np.uint8)
    image[..., 0] = [[1, 2], [3, 4]]
    calibration = CalibrationResult(2.0, 10.0, 0.0, 4, 4)
    result = process_image(
        image,
        FakeDepthModel(),
        calibration,
        reference_elevation=np.array([[12.0, 15.0], [16.0, 20.0]]),
    )

    paths = export_processing_result(result, tmp_path)

    assert paths["uncertainty"].name == "uncertainty.npy"
    assert json.loads(paths["metadata"].read_text())["has_uncertainty"] is True