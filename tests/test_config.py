import pytest

from src.config import load_config


def test_load_config_reads_default_sections() -> None:
    config = load_config("configs/default.yaml")

    assert config["model"]["tile_size"] == 512
    assert config["calibration"]["method"] == "huber_scale_shift"


def test_load_config_rejects_missing_sections(tmp_path) -> None:
    config_path = tmp_path / "invalid.yaml"
    config_path.write_text("model: {}\n", encoding="utf-8")

    with pytest.raises(ValueError, match="missing sections"):
        load_config(config_path)