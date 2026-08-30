import numpy as np
import pytest
from PIL import Image

from src.io.image_loader import load_image


def test_load_image_converts_input_to_rgb(tmp_path) -> None:
	source = tmp_path / "sample.png"
	Image.fromarray(np.array([[10, 20], [30, 40]], dtype=np.uint8), mode="L").save(source)

	loaded = load_image(source)

	assert loaded.path == source
	assert loaded.data.shape == (2, 2, 3)
	assert loaded.data.dtype == np.uint8
	assert np.array_equal(loaded.data[0, 0], [10, 10, 10])


def test_load_image_rejects_missing_and_unsupported_files(tmp_path) -> None:
	with pytest.raises(FileNotFoundError):
		load_image(tmp_path / "missing.png")

	source = tmp_path / "sample.bmp"
	source.write_bytes(b"not an accepted input")
	with pytest.raises(ValueError, match="unsupported image extension"):
		load_image(source)
