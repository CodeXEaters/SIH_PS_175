"""Metrics for comparing aligned elevation rasters."""

from dataclasses import asdict, dataclass

import numpy as np


@dataclass(frozen=True)
class ElevationMetrics:
	"""Summary statistics for estimated versus reference elevation."""

	mae: float
	rmse: float
	r2: float
	correlation: float
	mean_bias: float
	median_absolute_error: float
	p95_absolute_error: float
	valid_count: int

	def to_dict(self) -> dict[str, float | int]:
		"""Return metrics in a JSON-compatible mapping."""
		return asdict(self)


def calculate_metrics(
	estimated: np.ndarray,
	reference: np.ndarray,
	valid_mask: np.ndarray | None = None,
) -> ElevationMetrics:
	"""Calculate elevation error metrics for two aligned arrays.

	NaN and infinite values are excluded automatically. ``valid_mask`` can
	exclude additional pixels, such as raster nodata values.

	Raises:
		ValueError: If shapes differ, the mask shape differs, or no valid
			pixels remain.
	"""
	estimated_array = np.asarray(estimated, dtype=np.float64)
	reference_array = np.asarray(reference, dtype=np.float64)

	if estimated_array.shape != reference_array.shape:
		raise ValueError("estimated and reference arrays must have the same shape")

	mask = np.isfinite(estimated_array) & np.isfinite(reference_array)
	if valid_mask is not None:
		supplied_mask = np.asarray(valid_mask, dtype=bool)
		if supplied_mask.shape != estimated_array.shape:
			raise ValueError("valid_mask must have the same shape as the input arrays")
		mask &= supplied_mask

	estimated_values = estimated_array[mask]
	reference_values = reference_array[mask]
	if estimated_values.size == 0:
		raise ValueError("no valid pixels remain for metric calculation")

	errors = estimated_values - reference_values
	absolute_errors = np.abs(errors)
	reference_centered = reference_values - np.mean(reference_values)
	total_sum_squares = np.sum(reference_centered**2)
	residual_sum_squares = np.sum(errors**2)
	if total_sum_squares == 0:
		r2 = 1.0 if residual_sum_squares == 0 else float("nan")
		correlation = 1.0 if np.all(errors == 0) else float("nan")
	else:
		r2 = float(1.0 - residual_sum_squares / total_sum_squares)
		estimated_centered = estimated_values - np.mean(estimated_values)
		estimated_sum_squares = np.sum(estimated_centered**2)
		correlation = (
			float(np.sum(estimated_centered * reference_centered))
			/ float(np.sqrt(estimated_sum_squares * total_sum_squares))
			if estimated_sum_squares > 0
			else float("nan")
		)

	return ElevationMetrics(
		mae=float(np.mean(absolute_errors)),
		rmse=float(np.sqrt(np.mean(errors**2))),
		r2=r2,
		correlation=correlation,
		mean_bias=float(np.mean(errors)),
		median_absolute_error=float(np.median(absolute_errors)),
		p95_absolute_error=float(np.percentile(absolute_errors, 95)),
		valid_count=int(estimated_values.size),
	)
