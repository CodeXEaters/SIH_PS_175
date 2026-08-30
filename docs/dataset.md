# Dataset

The repository does not include large imagery, DEMs, LiDAR, or model weights. Keep those assets under the existing `data/` and `models/` directories and out of Git.

The designated development reference is the public
[SIH-DepthWizard-2026 dataset repository](https://github.com/IMG-PROCESS-SAC/SIH-DepthWizard-2026/).
At the time of writing, its published content is a dataset description; check
the repository for future samples or release assets before downloading data.

Supported image inputs are PNG, JPG, JPEG, TIFF, and CRS-aware GeoTIFF. GeoTIFF processing requires a CRS and at least three bands. Reference DSM/DEM rasters must be aligned by CRS, extent, resolution, and pixel geometry before metrics are calculated.

Use `scripts/prepare_dataset.py` to flatten a local image tree deterministically. Record scene identifiers, CRS, ground sampling distance, reference source, and train/validation/test split alongside experiments.

For development calibration, a lower-resolution DEM such as 30 m SRTM may be
used as an elevation anchor after CRS-aware alignment. Final evaluation should
use the target ISRO RGB-band optical imagery and an independent reference
elevation product. Development metrics must not be presented as final ISRO
accuracy results.
