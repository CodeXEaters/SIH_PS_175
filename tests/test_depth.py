import numpy as np
import pytest
import torch

from src.depth.inference import predict_relative_depth, predict_tiled_relative_depth
from src.depth.depth_anything import DepthAnythingModel, TorchScriptDepthModel
from src.depth.model_factory import (
	available_depth_models,
	create_depth_model,
	register_depth_model,
)
from src.depth.postprocess import normalize_relative_depth
from src.preprocessing.tiling import extract_tiles, merge_tiles


class FakeDepthModel:
	def predict(self, image: np.ndarray) -> np.ndarray:
		return image[..., 0].astype(np.float32)


def test_model_factory_registers_and_constructs_model() -> None:
	register_depth_model("fake", FakeDepthModel)

	model = create_depth_model("FAKE")

	assert isinstance(model, FakeDepthModel)
	assert "fake" in available_depth_models()


def test_model_factory_rejects_unknown_model() -> None:
	with pytest.raises(ValueError, match="unknown depth model"):
		create_depth_model("missing-model")


def test_model_factory_requires_checkpoint_for_depth_anything() -> None:
	with pytest.raises(ValueError, match="checkpoint"):
		create_depth_model("depth_anything")


def test_predict_relative_depth_uses_model_and_preserves_shape() -> None:
	image = np.zeros((3, 4, 3), dtype=np.uint8)
	image[..., 0] = np.arange(12, dtype=np.uint8).reshape(3, 4)

	depth = predict_relative_depth(FakeDepthModel(), image)

	assert depth.shape == (3, 4)
	assert depth.dtype == np.float32
	assert np.array_equal(depth, image[..., 0])


def test_depth_anything_adapter_accepts_injected_predictor() -> None:
	image = np.zeros((2, 3, 3), dtype=np.uint8)
	model = DepthAnythingModel(lambda value: value[..., 1].astype(np.float32))

	depth = predict_relative_depth(model, image)

	assert depth.shape == (2, 3)
	assert np.all(depth == 0)


def test_torchscript_depth_model_loads_checkpoint_and_resizes_output(tmp_path) -> None:
	class TinyModel(torch.nn.Module):
		def forward(self, value):
			return value[:, :1, ::2, ::2]

	checkpoint = tmp_path / "depth.pt"
	torch.jit.trace(TinyModel(), torch.zeros(1, 3, 4, 4)).save(str(checkpoint))
	model = TorchScriptDepthModel.from_checkpoint(checkpoint, device="cpu")

	depth = model.predict(np.full((5, 7, 3), 128, dtype=np.uint8))

	assert depth.shape == (5, 7)
	assert depth.dtype == np.float32

	fixed_size = TorchScriptDepthModel.from_checkpoint(checkpoint, device="cpu", input_size=4)
	resized = fixed_size.predict(np.full((5, 7, 3), 128, dtype=np.uint8))
	assert resized.shape == (5, 7)


def test_predict_tiled_relative_depth_reconstructs_full_resolution_map() -> None:
	image = np.zeros((5, 7, 3), dtype=np.uint8)
	image[..., 0] = np.arange(35, dtype=np.uint8).reshape(5, 7)

	depth = predict_tiled_relative_depth(FakeDepthModel(), image, tile_size=4, overlap=0.5)

	assert depth.shape == (5, 7)
	assert np.array_equal(depth, image[..., 0])


def test_normalize_relative_depth_preserves_nan_pixels() -> None:
	depth = np.array([[2.0, 4.0], [np.nan, 6.0]], dtype=np.float32)

	normalized = normalize_relative_depth(depth)

	assert np.allclose(normalized[[0, 0, 1], [0, 1, 1]], [0.0, 0.5, 1.0])
	assert np.isnan(normalized[1, 0])


def test_predict_relative_depth_rejects_bad_model_output() -> None:
	class BadModel:
		def predict(self, image: np.ndarray) -> np.ndarray:
			return np.ones((2, 2), dtype=np.float32)

	with pytest.raises(ValueError, match="match image"):
		predict_relative_depth(BadModel(), np.zeros((3, 3, 3), dtype=np.uint8))


def test_overlapping_tiles_reconstruct_non_divisible_image() -> None:
	image = np.arange(5 * 7 * 3, dtype=np.uint8).reshape(5, 7, 3)

	tiles = extract_tiles(image, tile_size=4, overlap=0.5)
	reconstructed = merge_tiles(tiles, image.shape)

	assert len(tiles) == 6
	assert reconstructed.dtype == np.float32
	assert np.array_equal(reconstructed, image)


@pytest.mark.parametrize(
	"tile_size, overlap",
	[(0, 0.25), (4, -0.1), (4, 1.0)],
)
def test_extract_tiles_rejects_invalid_parameters(tile_size: int, overlap: float) -> None:
	with pytest.raises(ValueError):
		extract_tiles(np.zeros((4, 4)), tile_size, overlap)
