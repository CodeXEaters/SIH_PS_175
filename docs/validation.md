# Validation

`src/validation/metrics.py` calculates MAE, RMSE, R-squared, correlation, mean bias, median absolute error, and P95 absolute error. NaN and infinite pixels are excluded, and an optional mask can remove additional nodata or invalid regions.

Use `src/validation/alignment.py` before comparing rasters with different grids or CRSs. `benchmark_scenes` reports per-scene and pooled overall metrics.

The current test suite uses synthetic fixtures. No scientific accuracy number is claimed until real satellite imagery and an independent reference DSM/LiDAR dataset are supplied.
