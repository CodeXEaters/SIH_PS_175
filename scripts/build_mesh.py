"""Build a GLB terrain mesh from a NumPy DSM."""

import argparse
import sys
from pathlib import Path

import numpy as np
from rasterio.transform import from_origin

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
	sys.path.insert(0, str(PROJECT_ROOT))

from src.mesh.export import export_glb
from src.mesh.heightfield import create_heightfield
from src.mesh.lod import downsample_dsm
from src.mesh.mesh_generator import generate_terrain_mesh
from src.io.image_loader import load_image


def main() -> int:
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("dsm", type=Path)
	parser.add_argument("--output", type=Path, required=True)
	parser.add_argument("--pixel-size", type=float, default=1.0)
	parser.add_argument("--lod-factor", type=int, default=1)
	parser.add_argument("--vertical-exaggeration", type=float, default=1.0)
	parser.add_argument("--texture", type=Path, help="optional RGB image to embed in the GLB")
	args = parser.parse_args()
	if args.pixel_size <= 0:
		parser.error("--pixel-size must be positive")
	dsm = np.load(args.dsm)
	if args.lod_factor > 1:
		dsm = downsample_dsm(dsm, args.lod_factor)
	effective_pixel_size = args.pixel_size * args.lod_factor
	transform = from_origin(0, dsm.shape[0] * effective_pixel_size, effective_pixel_size, effective_pixel_size)
	mesh = generate_terrain_mesh(create_heightfield(dsm, transform, args.vertical_exaggeration))
	texture = load_image(args.texture).data if args.texture is not None else None
	export_glb(mesh, args.output, texture)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
