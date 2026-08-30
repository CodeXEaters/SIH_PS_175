"""Run the complete core pipeline and export its result bundle."""

import argparse
import importlib
import sys
from pathlib import Path

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.calibration.scale_shift import calibrate_scale_shift
from src.depth.model_factory import create_depth_model, register_depth_model
from src.pipeline import process_path
from src.result_export import export_processing_result


def _load_builder(specification: str):
    module_name, separator, attribute = specification.partition(":")
    if not separator:
        raise ValueError("model builder must use module:attribute syntax")
    return getattr(importlib.import_module(module_name), attribute)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--model", default="depth_anything")
    parser.add_argument("--checkpoint", type=Path)
    parser.add_argument("--builder", help="optional module:attribute model builder")
    parser.add_argument("--reference", type=Path, help="optional .npy reference elevation array")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--tile-size", type=int)
    parser.add_argument("--overlap", type=float, default=0.25)
    parser.add_argument("--vertical-exaggeration", type=float, default=1.0)
    args = parser.parse_args()

    if args.builder:
        register_depth_model(args.model, _load_builder(args.builder))
        model = create_depth_model(args.model)
    else:
        if args.checkpoint is None:
            parser.error("--checkpoint or --builder is required")
        model = create_depth_model(args.model, checkpoint=args.checkpoint)

    initial = process_path(
        args.input,
        model,
        tile_size=args.tile_size,
        overlap=args.overlap,
        vertical_exaggeration=args.vertical_exaggeration,
    )
    if args.reference is not None:
        reference = np.load(args.reference)
        calibration = calibrate_scale_shift(initial.relative_depth, reference)
        result = process_path(
            args.input,
            model,
            calibration=calibration,
            tile_size=args.tile_size,
            overlap=args.overlap,
            vertical_exaggeration=args.vertical_exaggeration,
            reference_elevation=reference,
        )
    else:
        result = initial
    export_processing_result(result, args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())