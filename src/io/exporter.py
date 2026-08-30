"""Export intermediate NumPy products and metadata."""

import json
from pathlib import Path
from typing import Any

import numpy as np


def save_array(path: str | Path, array: np.ndarray) -> Path:
	"""Save an intermediate array as NumPy ``.npy`` data."""
	output = Path(path)
	if output.suffix.lower() != ".npy":
		raise ValueError("array output must use the .npy extension")
	output.parent.mkdir(parents=True, exist_ok=True)
	np.save(output, np.asarray(array))
	return output


def save_metadata(path: str | Path, metadata: dict[str, Any]) -> Path:
	"""Save JSON-serializable run metadata."""
	output = Path(path)
	output.parent.mkdir(parents=True, exist_ok=True)
	output.write_text(json.dumps(metadata, indent=2, allow_nan=False) + "\n", encoding="utf-8")
	return output
