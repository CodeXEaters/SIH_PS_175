import numpy as np
import pytest

from src.preprocessing.rgb_normalization import normalize_rgb
from src.preprocessing.resizing import resize_rgb


def test_normalize_rgb_scales_and_reorders_channels() -> None:
    image = np.array([[[0, 128, 255]]], dtype=np.uint8)

    normalized = normalize_rgb(image)

    assert normalized.shape == (3, 1, 1)
    assert normalized.dtype == np.float32
    assert np.allclose(normalized[:, 0, 0], [0.0, 128 / 255, 1.0])


def test_normalize_rgb_applies_channel_statistics() -> None:
    image = np.full((1, 1, 3), 128, dtype=np.uint8)

    normalized = normalize_rgb(image, (0.5, 0.5, 0.5), (0.25, 0.5, 1.0))

    assert np.allclose(normalized[:, 0, 0], [0.0078, 0.0039, 0.0020], atol=0.001)


@pytest.mark.parametrize(
    "image, mean, standard_deviation",
    [
        (np.zeros((2, 2)), None, None),
        (np.full((1, 1, 3), 256), None, None),
        (np.zeros((1, 1, 3)), (0.5, 0.5, 0.5), None),
    ],
)
def test_normalize_rgb_rejects_invalid_input(
    image: np.ndarray,
    mean: tuple[float, float, float] | None,
    standard_deviation: tuple[float, float, float] | None,
) -> None:
    with pytest.raises(ValueError):
        normalize_rgb(image, mean, standard_deviation)


def test_resize_rgb_returns_requested_shape_and_dtype() -> None:
    image = np.zeros((4, 6, 3), dtype=np.uint8)
    image[:, :, 0] = 255

    resized = resize_rgb(image, (2, 3))

    assert resized.shape == (2, 3, 3)
    assert resized.dtype == np.uint8
    assert np.all(resized[..., 0] == 255)


def test_resize_rgb_rejects_invalid_size() -> None:
    with pytest.raises(ValueError, match="positive"):
        resize_rgb(np.zeros((2, 2, 3), dtype=np.uint8), (0, 2))