from pathlib import Path

from scripts.prepare_dataset import main as prepare_main


def test_prepare_dataset_copies_supported_images_flattened(tmp_path, monkeypatch) -> None:
    source = tmp_path / "source"
    (source / "nested").mkdir(parents=True)
    (source / "nested" / "scene.JPG").write_bytes(b"image")
    output = tmp_path / "prepared"
    monkeypatch.setattr("sys.argv", ["prepare", str(source), "--output", str(output)])

    assert prepare_main() == 0
    assert list(output.iterdir()) == [output / "000000.jpg"]