import numpy as np
from PIL import Image

from scripts.process import main as process_main


def test_process_script_exports_relative_bundle(tmp_path, monkeypatch) -> None:
    source = tmp_path / "scene.png"
    output = tmp_path / "bundle"
    Image.fromarray(np.full((2, 2, 3), 5, dtype=np.uint8)).save(source)
    monkeypatch.setattr(
        "sys.argv",
        [
            "process",
            str(source),
            "--model",
            "fake",
            "--builder",
            "src.depth.demo_model:DemoDepthModel",
            "--output",
            str(output),
        ],
    )

    assert process_main() == 0
    assert (output / "relative_dsm.npy").is_file()
    assert (output / "terrain.glb").is_file()