"""Tests for the complete validation benchmark pipeline and API endpoints."""

import json
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from api import services
from api.main import app
from src.pipeline import process_image
from src.result_export import export_processing_result
from src.validation.alignment import align_elevation_reference
from src.validation.metrics import calculate_metrics


class FakeDepthModel:
    def predict(self, image: np.ndarray) -> np.ndarray:
        return image[..., 0].astype(np.float32)


def test_calculate_metrics_all_eight_metrics():
    """Verify calculate_metrics returns all 8 required metrics with correct keys and values."""
    pred = np.array([[10.0, 15.0], [20.0, 25.0]], dtype=np.float32)
    ref = np.array([[12.0, 14.0], [18.0, 26.0]], dtype=np.float32)

    metrics = calculate_metrics(pred, ref)
    d = metrics.to_dict()

    assert "mae" in d
    assert "rmse" in d
    assert "r2" in d
    assert "correlation" in d
    assert "pearson_correlation" in d
    assert d["pearson_correlation"] == d["correlation"]
    assert "mean_bias" in d
    assert "median_ae" in d
    assert "p95_ae" in d
    assert "valid_pixels" in d
    assert d["valid_pixels"] == 4

    # Absolute errors: [2, 1, 2, 1] -> MAE = 1.5
    assert np.isclose(d["mae"], 1.5)
    # Mean bias: (-2 + 1 + 2 - 1) / 4 = 0.0
    assert np.isclose(d["mean_bias"], 0.0)


def test_align_elevation_reference_shapes_and_nodata():
    """Verify alignment handles matching shapes, dimension interpolation, and nodata masking."""
    pred = np.ones((4, 4), dtype=np.float32) * 10.0
    pred[0, 0] = np.nan

    ref = np.ones((4, 4), dtype=np.float32) * 8.0
    ref[3, 3] = -9999.0  # Common nodata

    aligned_ref, mask = align_elevation_reference(pred, ref, nodata=-9999.0)

    assert aligned_ref.shape == (4, 4)
    assert not mask[0, 0]  # NaN in pred is masked
    assert not mask[3, 3]  # nodata in ref is masked
    assert mask[1, 1]  # valid pixel
    assert np.sum(mask) == 14

    # Test mismatched shape interpolation
    ref_small = np.ones((2, 2), dtype=np.float32) * 5.0
    aligned_small, mask_small = align_elevation_reference(pred, ref_small)
    assert aligned_small.shape == (4, 4)


def test_export_processing_result_validation_bundle(tmp_path):
    """Verify export_processing_result writes validation_report.json and validation_metrics.csv."""
    image = np.ones((4, 4, 3), dtype=np.uint8)
    result = process_image(image, FakeDepthModel())

    validation_data = {
        "available": True,
        "metrics": {
            "mae": 1.25,
            "rmse": 1.75,
            "r2": 0.92,
            "pearson_correlation": 0.96,
            "mean_bias": -0.1,
            "median_ae": 1.1,
            "p95_ae": 2.8,
            "valid_pixels": 16,
        },
        "reference": {
            "source": "test_ref.tif",
            "shape": [4, 4],
            "valid_pixels": 16,
        },
    }

    paths = export_processing_result(result, tmp_path, validation_data=validation_data)

    assert "validation_report" in paths
    assert paths["validation_report"].is_file()
    assert "validation_metrics" in paths
    assert paths["validation_metrics"].is_file()

    with open(paths["validation_report"], "r") as f:
        saved_report = json.load(f)
    assert saved_report["available"] is True
    assert saved_report["metrics"]["mae"] == 1.25

    csv_content = paths["validation_metrics"].read_text()
    assert "MAE" in csv_content
    assert "1.25" in csv_content
    assert "Pearson Correlation" in csv_content


def test_api_validation_endpoints():
    """Verify /validation/{job_id} contract for available vs unavailable reference and report downloads."""
    client = TestClient(app)

    # 1. Available validation
    job = services.jobs.create("test_scene.png")
    val_data = {
        "available": True,
        "metrics": {
            "mae": 1.5,
            "rmse": 2.0,
            "r2": 0.85,
            "pearson_correlation": 0.92,
            "mean_bias": 0.2,
            "median_ae": 1.3,
            "p95_ae": 3.1,
            "valid_pixels": 500,
        },
        "reference": {"source": "ground_truth.h5"},
    }
    services.jobs.update(job.job_id, status="COMPLETED", results={"validation": val_data})

    resp = client.get(f"/validation/{job.job_id}")
    assert resp.status_code == 200
    assert resp.json()["results"]["available"] is True
    assert resp.json()["results"]["metrics"]["mae"] == 1.5

    # 2. Unavailable validation on completed job
    job_unref = services.jobs.create("unreferenced.png")
    services.jobs.update(job_unref.job_id, status="COMPLETED", results={})
    resp_unref = client.get(f"/validation/{job_unref.job_id}")
    assert resp_unref.status_code == 200
    assert resp_unref.json()["results"]["available"] is False
    assert "reason" in resp_unref.json()["results"]

    # 3. Validation report file download
    job_dir = services.STORAGE_ROOT / job.job_id / "results"
    job_dir.mkdir(parents=True, exist_ok=True)
    report_file = job_dir / "validation_report.json"
    report_file.write_text(json.dumps(val_data))

    resp_rep = client.get(f"/validation/{job.job_id}/report.json")
    assert resp_rep.status_code == 200
    assert resp_rep.json()["available"] is True
