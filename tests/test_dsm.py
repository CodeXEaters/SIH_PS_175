import numpy as np
import pytest

from src.calibration.scale_shift import CalibrationResult
from src.dsm.generate import generate_metric_dsm, generate_relative_dsm


def test_generate_metric_dsm_applies_calibration_and_preserves_nodata() -> None:
    relative_depth = np.array([[0.0, 2.0], [np.nan, 4.0]], dtype=np.float32)
    calibration = CalibrationResult(3.0, 10.0, 0.0, 3, 3)

    dsm = generate_metric_dsm(relative_depth, calibration)

    assert np.allclose(dsm[[0, 0, 1], [0, 1, 1]], [10.0, 16.0, 22.0])
    assert np.isnan(dsm[1, 0])


def test_generate_relative_dsm_rejects_empty_or_non_2d_depth() -> None:
    with pytest.raises(ValueError, match="2D"):
        generate_relative_dsm(np.zeros((1, 2, 1)))
    with pytest.raises(ValueError, match="no finite"):
        generate_relative_dsm(np.full((2, 2), np.nan))
