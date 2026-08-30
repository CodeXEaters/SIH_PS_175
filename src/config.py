"""Validated loading of DepthWizard YAML configuration."""

from pathlib import Path
from typing import Any

import yaml


REQUIRED_SECTIONS = {"model", "calibration", "mesh", "outputs"}


def load_config(path: str | Path) -> dict[str, Any]:
    """Load and validate a DepthWizard configuration mapping."""
    config_path = Path(path)
    if not config_path.is_file():
        raise FileNotFoundError(f"configuration does not exist: {config_path}")
    with config_path.open("r", encoding="utf-8") as stream:
        config = yaml.safe_load(stream)
    if not isinstance(config, dict):
        raise ValueError("configuration root must be a mapping")
    missing = REQUIRED_SECTIONS - set(config)
    if missing:
        raise ValueError(f"configuration is missing sections: {', '.join(sorted(missing))}")
    return config