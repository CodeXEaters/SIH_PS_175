"""Deterministic model used for local pipeline smoke tests."""

import numpy as np


class DemoDepthModel:
    """Use the red channel as a predictable relative-depth feature."""

    def predict(self, image: np.ndarray) -> np.ndarray:
        """Return a 2D relative-depth map from an RGB image."""
        return np.asarray(image)[..., 0].astype(np.float32)