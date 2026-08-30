import numpy as np
from rasterio.transform import from_origin

from src.mesh.export import export_glb
from src.mesh.heightfield import create_heightfield
from src.mesh.lod import downsample_dsm
from src.mesh.mesh_generator import generate_terrain_mesh


def test_heightfield_uses_pixel_centers_and_preserves_uvs() -> None:
    dsm = np.array([[10.0, 20.0], [30.0, 40.0]], dtype=np.float32)

    heightfield = create_heightfield(dsm, from_origin(100, 200, 2, 4))

    assert np.allclose(
        heightfield.vertices,
        [[101, 198, 10], [103, 198, 20], [101, 194, 30], [103, 194, 40]],
    )
    assert np.allclose(heightfield.uvs, [[0, 1], [1, 1], [0, 0], [1, 0]])


def test_mesh_omits_cells_with_invalid_elevation() -> None:
    dsm = np.array([[1.0, 2.0, 3.0], [4.0, np.nan, 6.0], [7.0, 8.0, 9.0]])

    mesh = generate_terrain_mesh(create_heightfield(dsm, from_origin(0, 3, 1, 1)))

    assert mesh.vertices.shape == (9, 3)
    assert mesh.triangles.shape == (0, 3)


def test_export_glb_creates_loadable_asset(tmp_path) -> None:
    dsm = np.arange(9, dtype=np.float32).reshape(3, 3)
    mesh = generate_terrain_mesh(create_heightfield(dsm, from_origin(0, 3, 1, 1)))

    output = export_glb(mesh, tmp_path / "terrain.glb")

    loaded = __import__("trimesh").load(output, force="mesh")
    assert output.is_file()
    assert len(loaded.faces) == 8


def test_export_glb_embeds_optional_rgb_texture(tmp_path) -> None:
    dsm = np.arange(9, dtype=np.float32).reshape(3, 3)
    mesh = generate_terrain_mesh(create_heightfield(dsm, from_origin(0, 3, 1, 1)))
    texture = np.full((3, 3, 3), 128, dtype=np.uint8)

    output = export_glb(mesh, tmp_path / "textured.glb", texture)

    loaded = __import__("trimesh").load(output, force="mesh")
    assert loaded.visual.material.baseColorTexture is not None


def test_export_glb_excludes_unreferenced_nan_vertices(tmp_path) -> None:
    dsm = np.array([[1.0, 2.0, np.nan], [3.0, 4.0, np.nan]], dtype=np.float32)
    mesh = generate_terrain_mesh(create_heightfield(dsm, from_origin(0, 2, 1, 1)))

    output = export_glb(mesh, tmp_path / "terrain.glb")
    loaded = __import__("trimesh").load(output, force="mesh")

    assert np.isfinite(loaded.vertices).all()
    assert len(loaded.faces) == 2


def test_downsample_dsm_averages_finite_blocks() -> None:
    dsm = np.arange(16, dtype=np.float32).reshape(4, 4)

    reduced = downsample_dsm(dsm, 2)

    assert np.array_equal(reduced, [[2.5, 4.5], [10.5, 12.5]])
