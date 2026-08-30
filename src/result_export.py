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
    metadata: dict[str, Any] = {
        "is_metric": result.is_metric,
        "relative_depth_shape": list(result.relative_depth.shape),
        "dsm_shape": list(result.dsm.shape),
        "mesh_vertices": int(len(result.mesh.vertices)),
        "mesh_triangles": int(len(result.mesh.triangles)),
        "has_uncertainty": result.uncertainty is not None,
    }
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