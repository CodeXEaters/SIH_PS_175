"""Model-independent relative depth inference."""

import logging
from typing import Protocol

import numpy as np

from src.preprocessing.tiling import extract_tiles, merge_tiles
from src.preprocessing.tiling import Tile

LOGGER = logging.getLogger(__name__)


class DepthModel(Protocol):
	"""Interface required by the processing pipeline's depth model."""

	def predict(self, image: np.ndarray) -> np.ndarray:
		"""Predict a relative-depth map for an RGB image."""


def predict_relative_depth(model: DepthModel, image: np.ndarray) -> np.ndarray:
	"""Run a model and validate its relative-depth output shape."""
	rgb_image = np.asarray(image)
	if rgb_image.ndim != 3 or rgb_image.shape[2] != 3:
		raise ValueError("image must have shape (height, width, 3)")
	depth = np.asarray(model.predict(rgb_image), dtype=np.float32)
	if depth.shape != rgb_image.shape[:2]:
		raise ValueError("depth model output must match image height and width")
	if not np.any(np.isfinite(depth)):
		raise ValueError("depth model output contains no finite values")
	LOGGER.info("Relative depth inference complete with shape %s", depth.shape)
	return depth


def predict_tiled_relative_depth(
	model: DepthModel,
	image: np.ndarray,
	tile_size: int,
	overlap: float = 0.25,
) -> np.ndarray:
	"""Run relative-depth inference on overlapping tiles and merge at full size."""
	rgb_image = np.asarray(image)
	if rgb_image.ndim != 3 or rgb_image.shape[2] != 3:
		raise ValueError("image must have shape (height, width, 3)")
	tiles = extract_tiles(rgb_image, tile_size, overlap)
	LOGGER.info("Running tiled relative-depth inference on %s tiles", len(tiles))
	depth_tiles = [
		Tile(predict_relative_depth(model, tile.data), tile.row, tile.column)
		for tile in tiles
	]
	return merge_tiles(depth_tiles, rgb_image.shape[:2])
