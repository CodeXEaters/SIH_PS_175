"""Machine-readable validation reports."""

import json
from pathlib import Path
from typing import Any

from src.validation.metrics import ElevationMetrics


def write_metrics_report(
	path: str | Path,
	metrics: ElevationMetrics,
	*,
	metadata: dict[str, Any] | None = None,
) -> Path:
	"""Write metrics and optional run metadata as formatted JSON."""
	report_path = Path(path)
	report_path.parent.mkdir(parents=True, exist_ok=True)
	report = {"metrics": metrics.to_dict(), "metadata": metadata or {}}
	report_path.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
	return report_path
