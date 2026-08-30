import numpy as np
import pytest

from src.calibration.scale_shift import calibrate_scale_shift
from src.calibration.gcp_calibration import GroundControlPoint, calibrate_from_gcps


def test_calibrate_scale_shift_recovers_mapping_with_outlier() -> None:
	relative_depth = np.arange(8, dtype=float)
	reference = 3.0 * relative_depth + 12.0
	reference[-1] = 100.0

	result = calibrate_scale_shift(relative_depth, reference)

	assert result.scale == pytest.approx(3.0, abs=0.1)
	assert result.shift == pytest.approx(12.0, abs=0.2)
	assert result.sample_count == 8
	assert result.inlier_count < result.sample_count
	assert result.apply(np.array([2.0])) == pytest.approx([18.0], abs=0.3)


def test_calibrate_scale_shift_ignores_invalid_and_masked_samples() -> None:
	depth = np.array([0.0, 1.0, np.nan, 3.0])
	elevation = np.array([5.0, 7.0, 9.0, 11.0])
	mask = np.array([True, True, True, False])

	result = calibrate_scale_shift(depth, elevation, mask)

	assert result.scale == pytest.approx(2.0)
	assert result.shift == pytest.approx(5.0)
	assert result.sample_count == 2


def test_calibrate_scale_shift_rejects_constant_depth() -> None:
	with pytest.raises(ValueError, match="distinct value"):
		calibrate_scale_shift(np.ones(3), np.array([1.0, 2.0, 3.0]))


def test_calibrate_from_gcps_uses_depth_at_pixel_locations() -> None:
	depth = np.arange(9, dtype=float).reshape(3, 3)
	gcps = [
		GroundControlPoint(0, 0, 10.0),
		GroundControlPoint(1, 1, 14.0),
		GroundControlPoint(2, 2, 18.0),
	]

	result = calibrate_from_gcps(depth, gcps)

	assert result.scale == pytest.approx(1.0)
	assert result.shift == pytest.approx(10.0)


def test_calibrate_from_gcps_rejects_out_of_bounds_points() -> None:
	with pytest.raises(ValueError, match="outside"):
		calibrate_from_gcps(np.ones((2, 2)), [GroundControlPoint(0, 0, 1), GroundControlPoint(2, 0, 2)])
