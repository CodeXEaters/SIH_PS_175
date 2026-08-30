"""Grid terrain mesh generation."""

from dataclasses import dataclass

import numpy as np

from src.mesh.heightfield import Heightfield


@dataclass(frozen=True)
class TerrainMesh:
	"""Indexed terrain mesh geometry."""

	vertices: np.ndarray
	triangles: np.ndarray
	uvs: np.ndarray


def generate_terrain_mesh(heightfield: Heightfield) -> TerrainMesh:
	"""Triangulate valid adjacent cells in a heightfield grid."""
	height, width = heightfield.shape
	if height < 2 or width < 2:
		return TerrainMesh(heightfield.vertices, np.empty((0, 3), dtype=np.int32), heightfield.uvs)

	finite = np.isfinite(heightfield.vertices[:, 2]).reshape(height, width)
	valid = finite[:-1, :-1] & finite[:-1, 1:] & finite[1:, :-1] & finite[1:, 1:]
	rows, columns = np.nonzero(valid)
	top_left = rows * width + columns
	top_right = top_left + 1
	bottom_left = top_left + width
	bottom_right = bottom_left + 1
	triangles = np.empty((rows.size * 2, 3), dtype=np.int32)
	triangles[0::2, 0] = top_left
	triangles[0::2, 1] = bottom_left
	triangles[0::2, 2] = top_right
	triangles[1::2, 0] = top_right
	triangles[1::2, 1] = bottom_left
	triangles[1::2, 2] = bottom_right

	return TerrainMesh(
		vertices=heightfield.vertices,
		triangles=triangles,
		uvs=heightfield.uvs,
	)
