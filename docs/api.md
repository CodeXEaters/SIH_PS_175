# Core Processing Contract

The core engine exposes the in-memory entry point:

```python
from src.pipeline import process_image

result = process_image(
    image_rgb,
    model,
    calibration=calibration_result,  # omit for relative output
    transform=image_transform,       # omit for pixel coordinates
)
```

`image_rgb` is an HWC NumPy array with three channels. `model` implements
`predict(image)` and returns a 2D relative-depth array at image resolution.
The returned `ProcessingResult` contains `relative_depth`, `dsm`, `is_metric`,
`heightfield`, and `mesh`.

When `calibration` is omitted, `dsm` is a relative DSM and `is_metric` is
`False`. Supplying a `CalibrationResult` produces metric elevation and sets
`is_metric` to `True`. The core function does not perform file uploads, job
management, HTTP handling, or model-weight downloads; those remain API and
deployment responsibilities.

For file-based processing, use `process_path(path, model, ...)`. PNG, JPG, and
JPEG inputs are loaded as RGB with pixel-coordinate geometry. TIFF and GeoTIFF
inputs must have a CRS and at least three bands; their affine transform and
metadata are preserved in `ProcessingResult.raster_metadata`.

Call `export_processing_result(result, output_dir, texture=image_rgb)` to
write the downstream bundle. Georeferenced results produce
`relative_depth.tif` and either `absolute_dsm.tif` when calibrated or
`relative_dsm.tif` when uncalibrated; non-georeferenced results produce NumPy
equivalents. Both workflows also write `terrain.glb` and `metadata.json`.
When a calibrated reference elevation is supplied, the bundle also contains
`uncertainty.tif` or `uncertainty.npy`. This is an absolute calibration
residual diagnostic, not a validated confidence interval.

The complete workflow is available through `scripts/process.py`. It accepts an
image or GeoTIFF, a registered model/checkpoint, an optional `.npy` reference
elevation array, and an output directory. With a reference array it performs
robust scale/shift calibration and exports metric DSM and uncertainty products.
