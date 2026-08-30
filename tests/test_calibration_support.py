import numpy as np
import pytest

from src.calibration.ground_detection import calibration_mask
from src.calibration.scale_shift import CalibrationResult
from src.calibration.uncertainty import calibration_uncertainty


def test_calibration_mask_only_accepts_finite_optional_masked_pixels() -> None:
    depth = np.array([[1.0, np.nan], [3.0, 4.0]])
    elevation = np.array([[10.0, 20.0], [np.inf, 40.0]])
    supplied = np.array([[True, True], [True, False]])

    mask = calibration_mask(depth, elevation, supplied)

    assert np.array_equal(mask, [[True, False], [False, False]])


def test_calibration_uncertainty_returns_absolute_residuals() -> None:
    depth = np.array([[1.0, 2.0], [np.nan, 4.0]], dtype=np.float32)
    reference = np.array([[12.0, 15.0], [20.0, 18.0]], dtype=np.float32)
    calibration = CalibrationResult(2.0, 10.0, 0.0, 3, 3)

    uncertainty = calibration_uncertainty(depth, reference, calibration)

    assert np.allclose(uncertainty[[0, 0, 1], [0, 1, 1]], [0.0, 1.0, 0.0])
    assert np.isnan(uncertainty[1, 0])


def test_calibration_mask_rejects_shape_mismatch() -> None:
    with pytest.raises(ValueError, match="same shape"):
        calibration_mask(np.ones((2, 2)), np.ones((2, 3)))