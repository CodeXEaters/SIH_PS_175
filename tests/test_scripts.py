import json

import numpy as np
from PIL import Image

from scripts.calibrate_dsm import main as calibrate_main
from scripts.evaluate import main as evaluate_main
from scripts.run_inference import main as inference_main


def test_evaluate_script_writes_report(tmp_path, monkeypatch) -> None:
    estimated = tmp_path / "estimated.npy"
    reference = tmp_path / "reference.npy"
    output = tmp_path / "metrics.json"
    np.save(estimated, np.array([1.0, 2.0]))
    np.save(reference, np.array([1.0, 3.0]))
    monkeypatch.setattr("sys.argv", ["evaluate", str(estimated), str(reference), "--output", str(output)])

    assert evaluate_main() == 0
    assert json.loads(output.read_text())["metrics"]["mae"] == 0.5


def test_calibrate_script_writes_metric_dsm(tmp_path, monkeypatch) -> None:
    relative = tmp_path / "relative.npy"
    reference = tmp_path / "reference.npy"
    output = tmp_path / "metric.npy"
    np.save(relative, np.array([[1.0, 2.0], [3.0, 4.0]]))
    np.save(reference, np.array([[12.0, 14.0], [16.0, 18.0]]))
    monkeypatch.setattr("sys.argv", ["calibrate", str(relative), str(reference), "--output", str(output)])

    assert calibrate_main() == 0
    assert np.array_equal(np.load(output), np.array([[12.0, 14.0], [16.0, 18.0]], dtype=np.float32))


def test_inference_script_accepts_rgb_image(tmp_path, monkeypatch) -> None:
    source = tmp_path / "scene.png"
    output = tmp_path / "depth.npy"
    Image.fromarray(np.full((2, 2, 3), 7, dtype=np.uint8)).save(source)
    monkeypatch.setattr(
        "sys.argv",
        ["inference", str(source), "--model", "fake", "--builder", "tests.test_depth:FakeDepthModel", "--output", str(output)],
    )

    assert inference_main() == 0
    assert np.array_equal(np.load(output), np.full((2, 2), 7, dtype=np.float32))