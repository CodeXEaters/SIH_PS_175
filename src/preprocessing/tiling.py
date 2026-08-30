"""Overlap-aware tiling for large raster and image arrays."""

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class Tile:
	"""An image tile and its top-left pixel origin."""

	data: np.ndarray
	row: int
	column: int


def _starts(length: int, tile_size: int, stride: int) -> list[int]:
	starts = list(range(0, max(length - tile_size, 0) + 1, stride))
	final_start = max(length - tile_size, 0)
	if not starts or starts[-1] != final_start:
		starts.append(final_start)
	return starts


def extract_tiles(
	image: np.ndarray,
	tile_size: int,
	overlap: float = 0.25,
) -> list[Tile]:
	"""Split an array into overlapping tiles covering its full extent."""
	array = np.asarray(image)
	if array.ndim not in (2, 3):
		raise ValueError("image must be a 2D or 3D array")
	if tile_size < 1:
		raise ValueError("tile_size must be positive")
	if not 0 <= overlap < 1:
		raise ValueError("overlap must be in the range [0, 1)")

	height, width = array.shape[:2]
	stride = max(int(round(tile_size * (1 - overlap))), 1)
	return [
		Tile(array[row : row + tile_size, column : column + tile_size].copy(), row, column)
		for row in _starts(height, tile_size, stride)
		for column in _starts(width, tile_size, stride)
	]


def merge_tiles(tiles: list[Tile], output_shape: tuple[int, ...]) -> np.ndarray:
	"""Average overlapping tiles into an array of ``output_shape``."""
	if not tiles:
		raise ValueError("at least one tile is required")
	if len(output_shape) not in (2, 3):
		raise ValueError("output_shape must describe a 2D or 3D array")

	accumulated = np.zeros(output_shape, dtype=np.float64)
	weights = np.zeros(output_shape[:2], dtype=np.float64)
	for tile in tiles:
		tile_array = np.asarray(tile.data)
		if tile_array.ndim != len(output_shape):
			raise ValueError("tile dimensionality must match output_shape")
		end_row = tile.row + tile_array.shape[0]
		end_column = tile.column + tile_array.shape[1]
		if tile.row < 0 or tile.column < 0 or end_row > output_shape[0] or end_column > output_shape[1]:
			raise ValueError("tile lies outside output_shape")
		accumulated[tile.row:end_row, tile.column:end_column] += tile_array
		weights[tile.row:end_row, tile.column:end_column] += 1

	if np.any(weights == 0):
		raise ValueError("tiles do not cover the complete output")
	if len(output_shape) == 3:
		accumulated /= weights[..., None]
	else:
		accumulated /= weights
	return accumulated.astype(np.result_type(tiles[0].data.dtype, np.float32), copy=False)
