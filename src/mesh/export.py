"""Interoperable terrain mesh export."""

from pathlib import Path

import numpy as np
from PIL import Image
import trimesh

from src.mesh.mesh_generator import TerrainMesh
from src.mesh.texture_mapper import prepare_texture


def export_glb(
	mesh: TerrainMesh,
	path: str | Path,
	texture: np.ndarray | None = None,
) -> Path:
	"""Export terrain geometry as a binary glTF asset."""
	output_path = Path(path)
	if output_path.suffix.lower() != ".glb":
		raise ValueError("GLB output path must use the .glb extension")
	if mesh.triangles.size == 0:
		raise ValueError("cannot export a mesh without triangles")
	# glTF accessors calculate bounds across every exported vertex.  Keeping
	# unreferenced NaN vertices from DSM no-data regions therefore writes NaN
	# bounds and causes compliant viewers to render an empty scene.
	finite_vertices = np.isfinite(mesh.vertices).all(axis=1)
	if not np.all(finite_vertices):
		if not np.all(finite_vertices[mesh.triangles]):
			raise ValueError("cannot export triangles with non-finite vertices")
		remap = np.full(mesh.vertices.shape[0], -1, dtype=np.int64)
		remap[finite_vertices] = np.arange(np.count_nonzero(finite_vertices))
		vertices = mesh.vertices[finite_vertices]
		uvs = mesh.uvs[finite_vertices]
		triangles = remap[mesh.triangles]
	else:
		vertices = mesh.vertices
		uvs = mesh.uvs
		triangles = mesh.triangles
	output_path.parent.mkdir(parents=True, exist_ok=True)
	visual = trimesh.visual.texture.TextureVisuals(
		uv=uvs,
		image=Image.fromarray(prepare_texture(texture)) if texture is not None else None,
	)
	terrain = trimesh.Trimesh(
		vertices=vertices,
		faces=triangles,
		visual=visual,
		process=False,
	)
	terrain.export(output_path, file_type="glb")
	return output_path
