# Calibration

The calibration baseline models metric elevation as:

```text
metric_elevation = scale * relative_depth + shift
```

`src/calibration/scale_shift.py` estimates both parameters with iteratively
reweighted least squares using Huber weights. Non-finite samples and samples
excluded by the optional mask are ignored. At least two valid samples with
more than one distinct relative-depth value are required.

The returned `CalibrationResult` records the fitted parameters, residual RMSE,
inlier count, and sample count. Its `apply` method is the only current path
from relative depth to metric elevation. The residual RMSE is a fit diagnostic,
not a validated scientific confidence interval.

DEM alignment is handled separately by `src/validation/alignment.py`, which
reprojects a reference raster onto explicit target geometry and rejects
non-overlapping extents.

Sparse image GCPs are supported through `calibrate_from_gcps` in
`src/calibration/gcp_calibration.py`. GCP coordinates are zero-based raster
row and column positions. Out-of-bounds points are rejected, and the same
robust scale-shift estimator is used for consistency with DEM calibration.

The baseline `calibration_mask` only removes non-finite samples and applies an
optional externally supplied mask. It does not classify buildings, trees,
water, roads, or bare ground. `calibration_uncertainty` reports absolute
calibration residuals as a diagnostic proxy; it is not a confidence interval.
