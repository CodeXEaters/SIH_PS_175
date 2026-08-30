"""Core in-memory processing pipeline for API and script consumers."""

from dataclasses import dataclass

import numpy as np
from rasterio.transform import Affine

from src.calibration.scale_shift import CalibrationResult
from src.calibration.uncertainty import calibration_uncertainty
from src.depth.inference import DepthModel, predict_relative_depth, predict_tiled_relative_depth
from src.dsm.generate import generate_metric_dsm, generate_relative_dsm
from src.io.geotiff_reader import read_geotiff
from src.io.image_loader import load_image
from src.io.metadata import RasterMetadata
from src.mesh.heightfield import Heightfield, create_heightfield
from src.mesh.mesh_generator import TerrainMesh, generate_terrain_mesh

DEFAULT_TILE_SIZE = 512


@dataclass(frozen=True)
class ProcessingResult:
    """Products generated for one RGB scene."""

    relative_depth: np.ndarray
    dsm: np.ndarray
    is_metric: bool
    heightfield: Heightfield
    mesh: TerrainMesh
    raster_metadata: RasterMetadata | None = None
    uncertainty: np.ndarray | None = None


def process_image(
    image: np.ndarray,
    model: DepthModel,
    calibration: CalibrationResult | None = None,
    transform: Affine | None = None,
    vertical_exaggeration: float = 1.0,
    tile_size: int | None = None,
    overlap: float = 0.25,
    reference_elevation: np.ndarray | None = None,
) -> ProcessingResult:
    """Run depth inference and generate a relative or metric terrain product."""
    rgb_image = np.asarray(image)
    effective_tile_size = tile_size
    if effective_tile_size is None and rgb_image.ndim == 3:
        height, width = rgb_image.shape[:2]
        if height > DEFAULT_TILE_SIZE or width > DEFAULT_TILE_SIZE:
            effective_tile_size = DEFAULT_TILE_SIZE
    relative_depth = (
        predict_tiled_relative_depth(model, rgb_image, effective_tile_size, overlap)
        if effective_tile_size is not None
        else predict_relative_depth(model, rgb_image)
    )
    dsm = (
        generate_metric_dsm(relative_depth, calibration)
        if calibration is not None
        else generate_relative_dsm(relative_depth)
    )
    uncertainty = None
    if reference_elevation is not None:
        if calibration is None:
            raise ValueError("reference_elevation requires calibration")
        uncertainty = calibration_uncertainty(relative_depth, reference_elevation, calibration)
    heightfield = create_heightfield(
        dsm,
        transform or Affine.identity(),
        vertical_exaggeration,
    )
    return ProcessingResult(
        relative_depth=relative_depth,
        dsm=dsm,
        is_metric=calibration is not None,
        heightfield=heightfield,
        mesh=generate_terrain_mesh(heightfield),
        uncertainty=uncertainty,
    )


def process_path(
    path: str,
    model: DepthModel,
    calibration: CalibrationResult | None = None,
    vertical_exaggeration: float = 1.0,
    tile_size: int | None = None,
    overlap: float = 0.25,
    reference_elevation: np.ndarray | None = None,
) -> ProcessingResult:
    """Load an RGB image or CRS-aware GeoTIFF and process it."""
    from pathlib import Path

    input_path = Path(path)
    if input_path.suffix.lower() in {".tif", ".tiff"}:
        loaded = read_geotiff(input_path)
        if loaded.data.shape[2] < 3:
            raise ValueError("GeoTIFF must contain at least three bands for RGB processing")
        result = process_image(
            loaded.data[..., :3],
            model,
            calibration,
            loaded.metadata.transform,
            vertical_exaggeration,
            tile_size,
            overlap,
            reference_elevation,
        )
        return ProcessingResult(
            relative_depth=result.relative_depth,
            dsm=result.dsm,
            is_metric=result.is_metric,
            heightfield=result.heightfield,
            mesh=result.mesh,
            raster_metadata=loaded.metadata,
            uncertainty=result.uncertainty,
        )

    loaded_image = load_image(input_path)
    return process_image(
        loaded_image.data,
        model,
        calibration,
        vertical_exaggeration=vertical_exaggeration,
        tile_size=tile_size,
        overlap=overlap,
        reference_elevation=reference_elevation,
    )