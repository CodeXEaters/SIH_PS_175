# Architecture

The core engine is organized as a library-first pipeline:

1. `src/io` loads RGB images and GeoTIFFs, preserving CRS, affine geometry,
   nodata, band count, and source dtype.
2. `src/preprocessing` normalizes, resizes, augments, and tiles imagery.
3. `src/depth` exposes a model protocol, registry, injected predictor adapter, and TorchScript inference.
4. `src/calibration` aligns DEM/GCP references and estimates robust scale and shift.
5. `src/dsm` creates and cleans relative or metric surfaces.
6. `src/validation` aligns rasters and calculates elevation metrics.
7. `src/mesh` creates heightfields, LOD meshes, textures, and GLB assets.
8. `src/pipeline.py` and `src/result_export.py` provide integration entry points.

The API and frontend are separate consumers and are not implemented in this core package.
