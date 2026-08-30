"""Run a registered depth model on an RGB NumPy array."""

import argparse
import importlib
import sys
from pathlib import Path

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
	sys.path.insert(0, str(PROJECT_ROOT))

from src.depth.inference import predict_relative_depth
from src.depth.model_factory import create_depth_model
from src.io.image_loader import load_image


def _load_builder(specification: str):
	module_name, separator, attribute = specification.partition(":")
	if not separator:
		raise ValueError("model builder must use module:attribute syntax")
	return getattr(importlib.import_module(module_name), attribute)


def _load_input(path: Path) -> np.ndarray:
	"""Load either a NumPy RGB array or a standard RGB image."""
	if path.suffix.lower() == ".npy":
		return np.load(path)
	return load_image(path).data


def main() -> int:
	parser = argparse.ArgumentParser(description=__doc__)
	parser.add_argument("image", type=Path, help=".npy HWC RGB image")
	parser.add_argument("--model", required=True, help="registered model name")
	parser.add_argument("--builder", help="optional module:attribute returning a model")
	parser.add_argument("--output", type=Path, required=True)
	args = parser.parse_args()
	if args.builder:
		from src.depth.model_factory import register_depth_model

		register_depth_model(args.model, _load_builder(args.builder))
	model = create_depth_model(args.model)
	args.output.parent.mkdir(parents=True, exist_ok=True)
	np.save(args.output, predict_relative_depth(model, _load_input(args.image)))
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
