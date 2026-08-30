# DepthWizard Core

DepthWizard Core provides the tested building blocks for RGB-to-terrain
processing. The current implementation includes:

- RGB image loading and validation
- GeoTIFF reading and metadata-preserving writing
- Overlap-aware image tiling and RGB normalization
- A model-independent relative-depth interface and registry
- Local TorchScript checkpoint inference with CPU/CUDA selection
- Robust scale-and-shift calibration
- Sparse GCP calibration and DEM-to-image alignment
- Relative and metric DSM generation
- Conservative DSM hole filling, outlier filtering, and smoothing
- CRS-aware raster alignment and elevation metrics
- Geospatial heightfields, terrain meshes, LOD downsampling, and GLB export

Relative depth is never treated as metric elevation automatically. Metric DSM
values require an explicit `CalibrationResult`.

## Development

Install dependencies with:

```text
python -m pip install -r requirements.txt
```

Run the tests from the repository root:

```text
python -m pytest -q tests
```

The model adapter accepts an injected predictor, and `depth_anything` can load
a local TorchScript checkpoint. DEM staging is local-only and does not download
unverified data. The API and frontend are owned by separate modules.
