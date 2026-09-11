import numpy as np
import pytest
from PIL import Image

from src.io.image_loader import load_image
from src.io.hdf5_loader import load_hdf5_elevation


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


def test_load_image_from_hdf5(tmp_path) -> None:
	import h5py

	# Test 1: HDF5 with explicit 'rgb' dataset (H, W, 3)
	h5_path = tmp_path / "test_scene.h5"
	data_hwc = np.ones((64, 64, 3), dtype=np.uint8) * 128
	with h5py.File(h5_path, "w") as f:
		f.create_dataset("rgb", data=data_hwc)

	loaded = load_image(h5_path)
	assert loaded.path == h5_path
	assert loaded.data.shape == (64, 64, 3)
	assert loaded.data.dtype == np.uint8
	assert loaded.data[0, 0, 0] == 128

	# Test 2: HDF5 with float (3, H, W) normalized [0, 1]
	hdf5_path = tmp_path / "test_chw.hdf5"
	data_chw = np.full((3, 32, 48), 0.5, dtype=np.float32)
	with h5py.File(hdf5_path, "w") as f:
		f.create_dataset("image", data=data_chw)

	loaded_chw = load_image(hdf5_path)
	assert loaded_chw.path == hdf5_path
	assert loaded_chw.data.shape == (32, 48, 3)
	assert loaded_chw.data.dtype == np.uint8
	assert np.allclose(loaded_chw.data[0, 0], [127, 127, 127], atol=2)


def test_load_hdf5_elevation_dataset(tmp_path) -> None:
	import h5py

	source = tmp_path / "scene_AGL.h5"
	elevation = np.arange(64, dtype=np.float32).reshape(8, 8)
	with h5py.File(source, "w") as h5_file:
		h5_file.create_dataset("AGL", data=elevation)

	loaded = load_hdf5_elevation(source)

	assert loaded is not None
	assert loaded.shape == (8, 8)
	assert np.array_equal(loaded, elevation)
