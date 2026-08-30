import numpy as np
import pytest

from src.validation.metrics import calculate_metrics
from src.validation.reports import write_metrics_report


def test_calculate_metrics_returns_required_statistics() -> None:
	estimated = np.array([11.0, 19.0, 34.0, 42.0])
	reference = np.array([10.0, 20.0, 30.0, 40.0])

	metrics = calculate_metrics(estimated, reference)

	assert metrics.mae == pytest.approx(2.0)
	assert metrics.rmse == pytest.approx(np.sqrt(5.5))
	assert metrics.mean_bias == pytest.approx(1.5)
	assert metrics.median_absolute_error == pytest.approx(1.5)
	assert metrics.p95_absolute_error == pytest.approx(3.7)
	assert metrics.r2 == pytest.approx(0.956)
	assert metrics.correlation == pytest.approx(0.9917025)
	assert metrics.valid_count == 4


def test_calculate_metrics_excludes_invalid_and_masked_pixels() -> None:
	estimated = np.array([[1.0, np.nan], [3.0, 99.0]])
	reference = np.array([[1.5, 2.0], [2.0, 4.0]])
	valid_mask = np.array([[True, True], [True, False]])

	metrics = calculate_metrics(estimated, reference, valid_mask)

	assert metrics.valid_count == 2
	assert metrics.mae == pytest.approx(0.75)
	assert metrics.mean_bias == pytest.approx(0.25)


@pytest.mark.parametrize(
	"estimated, reference, mask, message",
	[
		(np.zeros((2, 2)), np.zeros((3, 1)), None, "same shape"),
		(np.zeros((2, 2)), np.zeros((2, 2)), np.ones((1, 1)), "same shape"),
		(np.full((2, 2), np.nan), np.ones((2, 2)), None, "no valid pixels"),
	],
)
def test_calculate_metrics_rejects_invalid_inputs(
	estimated: np.ndarray,
	reference: np.ndarray,
	mask: np.ndarray | None,
	message: str,
) -> None:
	with pytest.raises(ValueError, match=message):
		calculate_metrics(estimated, reference, mask)


def test_write_metrics_report_serializes_metrics_and_metadata(tmp_path) -> None:
	metrics = calculate_metrics(np.array([1.0, 2.0]), np.array([1.0, 3.0]))

	report_path = write_metrics_report(tmp_path / "nested" / "metrics.json", metrics, metadata={"scene": "demo"})
	report = report_path.read_text(encoding="utf-8")

	assert '"scene": "demo"' in report
	assert '"valid_count": 2' in report
