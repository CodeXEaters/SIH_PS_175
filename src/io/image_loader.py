"""Loading helpers for ordinary RGB image inputs."""

import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError

LOGGER = logging.getLogger(__name__)
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


@dataclass(frozen=True)
class LoadedImage:
	"""An RGB image and its source path."""

	data: np.ndarray
	path: Path


def load_image(path: str | Path) -> LoadedImage:
	"""Load an image as an RGB ``(height, width, 3)`` uint8 array."""
	image_path = Path(path)
	if not image_path.is_file():
		raise FileNotFoundError(f"image does not exist: {image_path}")
	if image_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
		raise ValueError(f"unsupported image extension: {image_path.suffix or '<none>'}")

	try:
		with Image.open(image_path) as image:
			rgb_image = image.convert("RGB")
			data = np.asarray(rgb_image, dtype=np.uint8).copy()
	except UnidentifiedImageError as error:
		raise ValueError(f"could not decode image: {image_path}") from error

	if data.ndim != 3 or data.shape[2] != 3:
		raise ValueError(f"image did not produce three RGB bands: {image_path}")
	LOGGER.info("Loaded RGB image %s with shape %s", image_path, data.shape)
	return LoadedImage(data=data, path=image_path)
