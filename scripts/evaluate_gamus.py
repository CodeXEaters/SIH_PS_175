"""Standalone evaluation benchmark comparing Baseline vs. Adapted model on GAMUS dataset.

Calculates and displays all 8 core metrics:
  1. MAE - Mean Absolute Error (m)
  2. RMSE - Root Mean Square Error (m)
  3. R² - Coefficient of Determination (-)
  4. Pearson Correlation (-)
  5. Mean Bias - Mean Error (m)
  6. Median Absolute Error (m)
  7. P95 Absolute Error - 95th Percentile Error (m)
  8. Valid Sample Count (pixels)
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn

REPO_ROOT = Path(__file__).resolve().parents[1]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from src.calibration.scale_shift import calibrate_scale_shift
from src.depth.model_factory import create_depth_model
from src.depth.postprocess import normalize_relative_depth
from src.io.hdf5_loader import load_hdf5_elevation, load_hdf5_image
from src.validation.alignment import align_elevation_reference
from src.validation.metrics import calculate_metrics

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
LOGGER = logging.getLogger("evaluate_gamus")


def find_paired_gamus_scenes(
    rgb_dir: Path,
    agl_dir: Path,
    max_samples: int | None = None,
) -> list[tuple[str, Path, Path]]:
    """Discover paired RGB and AGL files matching by scene ID."""
    if not rgb_dir.is_dir():
        raise FileNotFoundError(f"RGB directory not found: {rgb_dir}")
    if not agl_dir.is_dir():
        raise FileNotFoundError(f"AGL directory not found: {agl_dir}")

    rgb_files = sorted(list(rgb_dir.glob("*_RGB.h5")) + list(rgb_dir.glob("*_RGB.hdf5")))
    pairs: list[tuple[str, Path, Path]] = []

    for rgb_file in rgb_files:
        match = re.search(r"^(.*?)(?:_RGB)?\.(?:h5|hdf5)$", rgb_file.name, re.I)
        scene_id = match.group(1).replace("_RGB", "") if match else rgb_file.stem
        # Try finding corresponding AGL file
        agl_candidates = [
            agl_dir / f"{scene_id}_AGL.h5",
            agl_dir / f"{scene_id}_AGL.hdf5",
            agl_dir / f"{scene_id}.h5",
            agl_dir / f"{scene_id}.hdf5",
        ]
        agl_file = next((c for c in agl_candidates if c.is_file()), None)
        if agl_file is not None:
            pairs.append((scene_id, rgb_file, agl_file))

    if max_samples is not None and max_samples > 0:
        pairs = pairs[:max_samples]

    return pairs


def load_adapted_refinement_head(checkpoint_path: Path) -> tuple[float, float, nn.Module | None]:
    """Load scale, shift, and residual refinement head from adapted checkpoint."""
    if not checkpoint_path.is_file():
        LOGGER.warning("Adapted checkpoint not found: %s", checkpoint_path)
        return 1.0, 0.0, None

    data = torch.load(checkpoint_path, map_location="cpu")
    scale = float(data.get("scale", 1.0))
    shift = float(data.get("shift", 0.0))
    head_sd = data.get("head_state_dict", {})

    refine_sd = {k[len("refine."):]: v for k, v in head_sd.items() if k.startswith("refine.")}
    if refine_sd:
        refine = nn.Sequential(
            nn.Conv2d(1, 16, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 16, 3, padding=1),
            nn.ReLU(),
            nn.Conv2d(16, 1, 3, padding=1),
        )
        refine.load_state_dict(refine_sd)
        refine.eval()
        return scale, shift, refine

    return scale, shift, None


def evaluate(
    rgb_dir: Path,
    agl_dir: Path,
    baseline_checkpoint: Path,
    adapted_checkpoint: Path,
    output_json: Path | None = None,
    output_csv: Path | None = None,
    max_samples: int | None = None,
    device: str = "auto",
) -> dict[str, Any]:
    """Execute comparative benchmark evaluation between baseline and adapted models."""
    scenes = find_paired_gamus_scenes(rgb_dir, agl_dir, max_samples=max_samples)
    if not scenes:
        raise RuntimeError(f"No paired RGB and AGL scenes found in {rgb_dir} and {agl_dir}")

    LOGGER.info("Found %d paired GAMUS scenes for evaluation", len(scenes))

    # Initialize baseline model
    LOGGER.info("Loading baseline DepthAnythingV2 model from %s...", baseline_checkpoint)
    model = create_depth_model("depth_anything", checkpoint=str(baseline_checkpoint), input_size=518)

    # Load adapted components
    has_adapted = adapted_checkpoint.is_file()
    scale, shift, refine_head = (1.0, 0.0, None)
    if has_adapted:
        scale, shift, refine_head = load_adapted_refinement_head(adapted_checkpoint)
        LOGGER.info("Loaded adapted parameters (scale=%.4f, shift=%.4f, refine_head=%s)", scale, shift, refine_head is not None)

    scene_results: list[dict[str, Any]] = []

    base_metric_lists: dict[str, list[float]] = {
        "mae": [], "rmse": [], "r2": [], "pearson_correlation": [],
        "mean_bias": [], "median_ae": [], "p95_ae": [], "valid_pixels": [],
    }
    adapt_metric_lists: dict[str, list[float]] = {
        "mae": [], "rmse": [], "r2": [], "pearson_correlation": [],
        "mean_bias": [], "median_ae": [], "p95_ae": [], "valid_pixels": [],
    }

    for idx, (scene_id, rgb_file, agl_file) in enumerate(scenes, 1):
        LOGGER.info("[%d/%d] Evaluating scene %s...", idx, len(scenes), scene_id)

        # 1. Load inputs
        loaded_img = load_hdf5_image(rgb_file)
        rgb_data = loaded_img.data
        agl_data = load_hdf5_elevation(agl_file)
        if agl_data is None:
            LOGGER.warning("Skipping scene %s: failed to load AGL elevation", scene_id)
            continue

        # 2. Run baseline prediction
        raw_depth = model.predict(rgb_data)
        norm_depth = normalize_relative_depth(raw_depth)

        # Calibrate baseline via standard scale/shift fitting to ground truth
        calib = calibrate_scale_shift(norm_depth, agl_data)
        baseline_pred = calib.apply(norm_depth)

        aligned_ref, mask = align_elevation_reference(baseline_pred, agl_data)
        m_base = calculate_metrics(baseline_pred, aligned_ref, mask)
        base_dict = m_base.to_dict()

        for k in base_metric_lists:
            val = base_dict.get(k)
            if val is not None and not np.isnan(val):
                base_metric_lists[k].append(float(val))

        scene_entry: dict[str, Any] = {
            "scene_id": scene_id,
            "baseline": base_dict,
        }

        # 3. Run adapted prediction
        if has_adapted:
            t_in = torch.from_numpy(norm_depth).float().unsqueeze(0).unsqueeze(0)
            with torch.no_grad():
                scaled = t_in * scale + shift
                if refine_head is not None:
                    res = refine_head(scaled)
                    pred_adapt = (scaled + res).squeeze().numpy()
                else:
                    pred_adapt = scaled.squeeze().numpy()

            aligned_ref_a, mask_a = align_elevation_reference(pred_adapt, agl_data)
            m_adapt = calculate_metrics(pred_adapt, aligned_ref_a, mask_a)
            adapt_dict = m_adapt.to_dict()

            for k in adapt_metric_lists:
                val = adapt_dict.get(k)
                if val is not None and not np.isnan(val):
                    adapt_metric_lists[k].append(float(val))

            scene_entry["adapted"] = adapt_dict

        scene_results.append(scene_entry)

    # Compute averages
    def avg(lst: list[float]) -> float:
        return float(np.mean(lst)) if lst else 0.0

    avg_base = {k: avg(v) for k, v in base_metric_lists.items()}
    avg_adapt = {k: avg(v) for k, v in adapt_metric_lists.items()} if has_adapted else None

    # Print summary table
    n_evaluated = len(scene_results)
    header_title = f"GAMUS BENCHMARK EVALUATION ({n_evaluated} scene{'s' if n_evaluated != 1 else ''})"
    print("\n" + "=" * 88)
    print(f"{header_title:^88}")
    print("=" * 88)
    if has_adapted:
        print(f"{'Metric':<26} {'Baseline (Calibrated)':<24} {'Adapted (Fine-tuned)':<22} {'Improvement':<14}")
        print("-" * 88)

        def fmt_row(name: str, key: str, unit: str, higher_is_better: bool = False) -> None:
            b_val = avg_base.get(key, 0.0)
            a_val = avg_adapt.get(key, 0.0)
            if higher_is_better:
                diff = a_val - b_val
                imp_str = f"{diff:+.3f}"
            else:
                pct = ((b_val - a_val) / (b_val + 1e-8)) * 100
                imp_str = f"{pct:+.1f}%"

            b_str = f"{b_val:.2f} {unit}".strip()
            a_str = f"{a_val:.2f} {unit}".strip()
            print(f"{name:<26} {b_str:<24} {a_str:<22} {imp_str:<14}")

        fmt_row("MAE", "mae", "m", False)
        fmt_row("RMSE", "rmse", "m", False)
        fmt_row("R2 (Coeff of Det)", "r2", "-", True)
        fmt_row("Pearson Correlation", "pearson_correlation", "-", True)
        fmt_row("Mean Bias", "mean_bias", "m", False)
        fmt_row("Median Absolute Error", "median_ae", "m", False)
        fmt_row("P95 Absolute Error", "p95_ae", "m", False)
        print(f"{'Valid Pixels (avg)':<26} {int(avg_base.get('valid_pixels', 0)):<24,d} {int(avg_adapt.get('valid_pixels', 0)):<22,d} {'-':<14}")
    else:
        print(f"{'Metric':<30} {'Baseline (Calibrated)':<25} {'Unit':<10}")
        print("-" * 88)
        for k in ["mae", "rmse", "r2", "pearson_correlation", "mean_bias", "median_ae", "p95_ae"]:
            unit = "m" if "ae" in k or "rmse" in k or "bias" in k else "-"
            print(f"{k.upper():<30} {avg_base.get(k, 0.0):<25.3f} {unit:<10}")
        print(f"{'VALID PIXELS':<30} {int(avg_base.get('valid_pixels', 0)):<25,d} {'count':<10}")

    print("=" * 88 + "\n")

    report: dict[str, Any] = {
        "dataset": "GAMUS AGL Validation Set",
        "samples_evaluated": n_evaluated,
        "summary": {
            "baseline": avg_base,
            "adapted": avg_adapt,
        },
        "scenes": scene_results,
    }

    if output_json:
        output_json.parent.mkdir(parents=True, exist_ok=True)
        with open(output_json, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        LOGGER.info("Saved benchmark report to %s", output_json)

    if output_csv:
        output_csv.parent.mkdir(parents=True, exist_ok=True)
        csv_rows = [
            ("Metric", "Baseline", "Adapted", "Unit", "Description"),
            ("MAE", str(avg_base.get("mae", "")), str(avg_adapt.get("mae", "")) if avg_adapt else "", "m", "Mean Absolute Error"),
            ("RMSE", str(avg_base.get("rmse", "")), str(avg_adapt.get("rmse", "")) if avg_adapt else "", "m", "Root Mean Square Error"),
            ("R2", str(avg_base.get("r2", "")), str(avg_adapt.get("r2", "")) if avg_adapt else "", "-", "Coefficient of Determination"),
            ("Pearson Correlation", str(avg_base.get("pearson_correlation", "")), str(avg_adapt.get("pearson_correlation", "")) if avg_adapt else "", "-", "Pearson Correlation Coefficient"),
            ("Mean Bias", str(avg_base.get("mean_bias", "")), str(avg_adapt.get("mean_bias", "")) if avg_adapt else "", "m", "Mean Error (Pred - Ref)"),
            ("Median Absolute Error", str(avg_base.get("median_ae", "")), str(avg_adapt.get("median_ae", "")) if avg_adapt else "", "m", "Median Absolute Error"),
            ("P95 Absolute Error", str(avg_base.get("p95_ae", "")), str(avg_adapt.get("p95_ae", "")) if avg_adapt else "", "m", "95th Percentile Error"),
            ("Valid Samples", str(int(avg_base.get("valid_pixels", 0))), str(int(avg_adapt.get("valid_pixels", 0))) if avg_adapt else "", "count", "Valid Evaluation Pixels"),
        ]
        csv_text = "\n".join([f'"{r[0]}",{r[1]},{r[2]},"{r[3]}","{r[4]}"' for r in csv_rows])
        output_csv.write_text(csv_text, encoding="utf-8")
        LOGGER.info("Saved benchmark CSV to %s", output_csv)

    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate Baseline vs. Adapted model on GAMUS dataset.")
    parser.add_argument("--rgb-dir", type=Path, default=REPO_ROOT / "data" / "raw" / "gamus" / "images" / "validation")
    parser.add_argument("--agl-dir", type=Path, default=REPO_ROOT / "data" / "raw" / "gamus" / "heights" / "validation")
    parser.add_argument("--checkpoint", type=Path, default=REPO_ROOT / "models" / "checkpoints" / "depth_anything_v2_vits.pt")
    parser.add_argument("--adapted-checkpoint", type=Path, default=REPO_ROOT / "models" / "checkpoints" / "adapted_gamus_vits.pt")
    parser.add_argument("--output", type=Path, default=REPO_ROOT / "reports" / "gamus_benchmark.json")
    parser.add_argument("--csv", type=Path, default=REPO_ROOT / "reports" / "gamus_benchmark.csv")
    parser.add_argument("--max-samples", type=int, default=None, help="Maximum number of scenes to evaluate")
    parser.add_argument("--device", type=str, default="auto")

    args = parser.parse_args()
    evaluate(
        rgb_dir=args.rgb_dir,
        agl_dir=args.agl_dir,
        baseline_checkpoint=args.checkpoint,
        adapted_checkpoint=args.adapted_checkpoint,
        output_json=args.output,
        output_csv=args.csv,
        max_samples=args.max_samples,
        device=args.device,
    )


if __name__ == "__main__":
    main()
