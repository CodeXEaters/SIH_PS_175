"""Export complete processing results for downstream consumers."""

import json
from pathlib import Path
from typing import Any

from src.geospatial.geotiff import write_geotiff
from src.io.exporter import save_array, save_metadata
from src.pipeline import ProcessingResult
from src.mesh.export import export_glb


def export_processing_result(
    result: ProcessingResult,
    output_dir: str | Path,
    *,
    texture=None,
    validation_data: dict[str, Any] | None = None,
) -> dict[str, Path]:
    """Write pipeline products and return their paths by product name."""
    directory = Path(output_dir)
    directory.mkdir(parents=True, exist_ok=True)
    paths: dict[str, Path] = {}

    if result.raster_metadata is not None:
        paths["relative_depth"] = write_geotiff(
            directory / "relative_depth.tif", result.relative_depth, result.raster_metadata, dtype="float32"
        )
        dsm_name = "absolute_dsm.tif" if result.is_metric else "relative_dsm.tif"
        paths["dsm"] = write_geotiff(directory / dsm_name, result.dsm, result.raster_metadata, dtype="float32")
    else:
        paths["relative_depth"] = save_array(directory / "relative_depth.npy", result.relative_depth)
        paths["dsm"] = save_array(directory / "relative_dsm.npy", result.dsm)

    if result.uncertainty is not None:
        if result.raster_metadata is not None:
            paths["uncertainty"] = write_geotiff(
                directory / "uncertainty.tif", result.uncertainty, result.raster_metadata, dtype="float32"
            )
        else:
            paths["uncertainty"] = save_array(directory / "uncertainty.npy", result.uncertainty)

    paths["mesh"] = export_glb(result.mesh, directory / "terrain.glb", texture)
    if texture is not None:
        from PIL import Image
        from src.mesh.texture_mapper import prepare_texture

        texture_path = directory / "texture.png"
        Image.fromarray(prepare_texture(texture)).save(texture_path)
        paths["rgb_texture"] = texture_path

    if validation_data is not None:
        report_path = directory / "validation_report.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(validation_data, f, indent=2)
        paths["validation_report"] = report_path

        # Generate CSV if metrics are available
        metrics = validation_data.get("metrics")
        if metrics and isinstance(metrics, dict):
            csv_path = directory / "validation_metrics.csv"
            rows = [
                ("Metric", "Value", "Unit", "Description"),
                ("MAE", str(metrics.get("mae", "")), "m", "Mean Absolute Error"),
                ("RMSE", str(metrics.get("rmse", "")), "m", "Root Mean Square Error"),
                ("R2", str(metrics.get("r2", "")), "-", "Coefficient of Determination"),
                ("Pearson Correlation", str(metrics.get("pearson_correlation", metrics.get("correlation", ""))), "-", "Pearson Correlation Coefficient"),
                ("Mean Bias", str(metrics.get("mean_bias", metrics.get("bias", ""))), "m", "Mean Error (Predicted - Reference)"),
                ("Median Absolute Error", str(metrics.get("median_ae", "")), "m", "Median Absolute Error"),
                ("P95 Absolute Error", str(metrics.get("p95_ae", metrics.get("percentile95", ""))), "m", "95th Percentile Absolute Error"),
                ("Valid Samples", str(metrics.get("valid_pixels", "")), "count", "Number of Valid Comparison Pixels"),
            ]
            csv_content = "\n".join([f'"{r[0]}",{r[1]},"{r[2]}","{r[3]}"' for r in rows])
            csv_path.write_text(csv_content, encoding="utf-8")
            paths["validation_metrics"] = csv_path

    metadata: dict[str, Any] = {
        "is_metric": result.is_metric,
        "relative_depth_shape": list(result.relative_depth.shape),
        "dsm_shape": list(result.dsm.shape),
        "mesh_vertices": int(len(result.mesh.vertices)),
        "mesh_triangles": int(len(result.mesh.triangles)),
        "has_uncertainty": result.uncertainty is not None,
    }
    if validation_data is not None:
        metadata["validation"] = validation_data
    if result.raster_metadata is not None:
        metadata.update(
            {
                "crs": result.raster_metadata.crs.to_string(),
                "transform": list(result.raster_metadata.transform),
                "resolution": list(result.raster_metadata.resolution),
            }
        )
    paths["metadata"] = save_metadata(directory / "metadata.json", metadata)
    return paths