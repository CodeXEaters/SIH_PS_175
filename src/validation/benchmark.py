"""Scene-wise validation benchmarking."""

from typing import Iterable

import numpy as np

from src.validation.metrics import ElevationMetrics, calculate_metrics


def benchmark_scenes(
	scenes: Iterable[tuple[str, np.ndarray, np.ndarray]],
) -> dict[str, ElevationMetrics]:
	"""Calculate metrics per scene and an ``overall`` pooled result."""
	collected: list[tuple[np.ndarray, np.ndarray]] = []
	results: dict[str, ElevationMetrics] = {}
	for name, estimated, reference in scenes:
		metrics = calculate_metrics(estimated, reference)
		results[name] = metrics
		collected.append((np.asarray(estimated), np.asarray(reference)))
	if not collected:
		raise ValueError("at least one scene is required")
	results["overall"] = calculate_metrics(
		np.concatenate([estimated.ravel() for estimated, _ in collected]),
		np.concatenate([reference.ravel() for _, reference in collected]),
	)
	return results
