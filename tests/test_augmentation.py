import numpy as np

from src.preprocessing.augmentation import flip_pair


def test_flip_pair_keeps_image_and_target_aligned() -> None:
    image = np.arange(12).reshape(2, 2, 3)
    target = np.array([[1, 2], [3, 4]])

    flipped_image, flipped_target = flip_pair(image, target, horizontal=True, vertical=True)

    assert np.array_equal(flipped_target, [[4, 3], [2, 1]])
    assert np.array_equal(flipped_image, image[::-1, ::-1])