import numpy as np
import pytest

from src.dsm.filtering import filter_outliers
from src.dsm.hole_filling import fill_holes
from src.dsm.smoothing import smooth_dsm


def test_fill_holes_uses_neighbor_values() -> None:
    dsm = np.array([[1.0, 2.0, 3.0], [4.0, np.nan, 6.0], [7.0, 8.0, 9.0]])

    filled = fill_holes(dsm)

    assert filled[1, 1] == pytest.approx(5.0)
    assert np.isnan(dsm[1, 1])


def test_filter_outliers_marks_extreme_value_invalid() -> None:
    dsm = np.array([[10.0, 11.0, 12.0, 1000.0]])

    filtered = filter_outliers(dsm)

    assert np.isnan(filtered[0, 3])
    assert np.allclose(filtered[0, :3], [10.0, 11.0, 12.0])


def test_smooth_dsm_preserves_nan_holes() -> None:
    dsm = np.array([[1.0, 3.0], [5.0, np.nan]])

    smoothed = smooth_dsm(dsm)

    assert smoothed[0, 0] == pytest.approx(3.0)
    assert np.isnan(smoothed[1, 1])