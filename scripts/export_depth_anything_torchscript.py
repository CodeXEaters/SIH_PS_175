"""Export official Depth Anything V2 weights to a TorchScript checkpoint."""

import argparse
import sys
from pathlib import Path

import torch


MODEL_CONFIGS = {
    "vits": {"encoder": "vits", "features": 64, "out_channels": [48, 96, 192, 384]},
    "vitb": {"encoder": "vitb", "features": 128, "out_channels": [96, 192, 384, 768]},
    "vitl": {"encoder": "vitl", "features": 256, "out_channels": [256, 512, 1024, 1024]},
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkpoint", type=Path, help="official Depth Anything V2 .pth weights")
    parser.add_argument("output", type=Path, help="output TorchScript .pt path")
    parser.add_argument("--encoder", choices=MODEL_CONFIGS, default="vits")
    parser.add_argument("--input-size", type=int, default=518)
    args = parser.parse_args()

    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "Depth-Anything-V2"))
    from depth_anything_v2.dpt import DepthAnythingV2

    model = DepthAnythingV2(**MODEL_CONFIGS[args.encoder])
    state_dict = torch.load(args.checkpoint, map_location="cpu")
    model.load_state_dict(state_dict)
    model.eval()
    example = torch.randn(1, 3, args.input_size, args.input_size)
    scripted = torch.jit.trace(model, example, strict=False)
    scripted.save(str(args.output))
    print(f"Exported {args.output} ({args.output.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())