# Methodology

RGB imagery produces relative monocular depth. It is never treated as metric elevation without an explicit calibration result.

For calibrated scenes, the baseline mapping is:

```text
metric elevation = scale * relative depth + shift
```

Scale and shift are estimated with iteratively reweighted least squares using Huber weights. DEM rasters are reprojected and resampled onto target image geometry; sparse GCPs use their raster pixel locations. High-resolution depth remains the spatial source of structure while the reference elevation anchors metric scale.

DSM cleanup is conservative: filtering can mark robust outliers as NaN, hole filling uses local finite neighbors, and smoothing preserves invalid holes. Uncertainty output is an absolute calibration residual diagnostic, not a confidence interval.
