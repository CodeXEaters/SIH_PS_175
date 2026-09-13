"""Loading helpers for HDF5 (.h5, .hdf5) image and dataset inputs."""

import logging
from pathlib import Path
from typing import Any

import numpy as np

from src.io.image_loader import LoadedImage

LOGGER = logging.getLogger(__name__)

IMAGE_KEY_CANDIDATES = [
    "rgb",
    "image",
    "images",
    "img",
    "color",
    "data",
    "input",
    "raw",
    "scene",
]
ELEVATION_KEY_HINTS = ("elevation", "height", "agl", "dsm", "dem")


def _find_image_dataset(group: Any) -> np.ndarray:
    """Find the most plausible image array in an HDF5 group or file."""
    import h5py

    # 1. Check direct keys matching common names (case-insensitive)
    lower_map = {k.lower(): k for k in group.keys()}
    for candidate in IMAGE_KEY_CANDIDATES:
        if candidate in lower_map:
            item = group[lower_map[candidate]]
            if isinstance(item, h5py.Dataset) and item.ndim in (2, 3, 4):
                return item[()]

    # 2. Search recursively for any dataset
    found_datasets = []

    def visitor(name: str, obj: Any) -> None:
        if isinstance(obj, h5py.Dataset) and obj.ndim in (2, 3, 4):
            found_datasets.append((name, obj))

    group.visititems(visitor)

    if not found_datasets:
        raise ValueError("No 2D, 3D, or 4D dataset found in HDF5 file")

    # Prefer 3D datasets with 3 channels
    for name, ds in found_datasets:
        shape = ds.shape
        if ds.ndim == 3 and (shape[2] in (3, 4) or shape[0] in (3, 4)):
            return ds[()]

    # Otherwise return the first valid dataset
    return found_datasets[0][1][()]


def _find_elevation_dataset(group: Any, filename: str | None = None) -> np.ndarray | None:
    """Find a 2D elevation/height raster, using dataset names or filename hints."""
    import h5py

    found: list[tuple[str, Any]] = []

    def visitor(name: str, obj: Any) -> None:
        if isinstance(obj, h5py.Dataset) and obj.ndim in (2, 3):
            lower_name = name.lower()
            if any(hint in lower_name for hint in ELEVATION_KEY_HINTS):
                found.append((name, obj))

    group.visititems(visitor)

    # Fallback: if no dataset name matched hints, check if filename suggests elevation
    # or the file contains 2D float arrays (e.g. GAMUS AGL stores (1024, 1024) under 'image')
    if not found:
        filename_hints = ("agl", "dsm", "dem", "elevation", "height")
        is_filename_elevation = bool(filename and any(h in filename.lower() for h in filename_hints))

        candidate_datasets: list[tuple[str, Any]] = []

        def candidate_visitor(name: str, obj: Any) -> None:
            if isinstance(obj, h5py.Dataset):
                candidate_datasets.append((name, obj))

        group.visititems(candidate_visitor)

        for name, ds in candidate_datasets:
            shape = ds.shape
            if ds.ndim == 2 or (ds.ndim == 3 and (shape[0] == 1 or shape[-1] == 1)):
                if is_filename_elevation or name.lower() in ("image", "data", "raster", "elevation"):
                    found.append((name, ds))
                    break

        if not found and is_filename_elevation and candidate_datasets:
            for name, ds in candidate_datasets:
                if ds.ndim in (2, 3):
                    found.append((name, ds))
                    break

    if not found:
        return None

    data = np.asarray(found[0][1][()], dtype=np.float32)
    if data.ndim == 3:
        if data.shape[0] == 1:
            data = data[0]
        elif data.shape[-1] == 1:
            data = data[..., 0]
        else:
            return None
    if data.ndim != 2 or not np.any(np.isfinite(data)):
        return None
    return data


def load_hdf5_elevation(path: str | Path) -> np.ndarray | None:
    """Load a named HDF5 elevation raster, if the file contains one."""
    try:
        import h5py
    except ImportError as exc:
        raise RuntimeError("h5py must be installed to load .h5 / .hdf5 files") from exc

    file_path = Path(path)
    with h5py.File(file_path, "r") as h5_file:
        return _find_elevation_dataset(h5_file, filename=file_path.name)


def _format_rgb_array(raw: np.ndarray) -> np.ndarray:
    """Convert an arbitrary numeric array into a standard (H, W, 3) uint8 RGB array."""
    arr = np.asarray(raw)

    # Handle batch dimension e.g. (1, H, W, 3) or (1, 3, H, W)
    if arr.ndim == 4:
        if arr.shape[0] == 1:
            arr = arr[0]
        elif arr.shape[-1] in (1, 3, 4):
            arr = arr[0]
        else:
            arr = arr[0]

    # Handle channel dimension
    if arr.ndim == 3:
        if arr.shape[0] in (1, 3, 4) and arr.shape[2] not in (1, 3, 4):
            # (C, H, W) -> (H, W, C)
            arr = np.transpose(arr, (1, 2, 0))
        if arr.shape[2] == 4:
            # Drop alpha channel
            arr = arr[..., :3]
        elif arr.shape[2] == 1:
            arr = np.repeat(arr, 3, axis=2)
    elif arr.ndim == 2:
        # Grayscale (H, W) -> (H, W, 3)
        arr = np.repeat(arr[:, :, np.newaxis], 3, axis=2)
    else:
        raise ValueError(f"Cannot interpret array with shape {arr.shape} as an image")

    if arr.shape[2] != 3:
        raise ValueError(f"Expected 3 color channels, but got shape {arr.shape}")

    # Scale values to uint8 [0, 255]
    if np.issubdtype(arr.dtype, np.floating):
        finite = arr[np.isfinite(arr)]
        if finite.size > 0:
            max_val = float(np.max(finite))
            min_val = float(np.min(finite))
            if max_val <= 1.0 and min_val >= 0.0:
                arr = arr * 255.0
            elif max_val > min_val:
                denom = max_val - min_val
                arr = (arr - min_val) / denom * 255.0
        arr = np.nan_to_num(arr, nan=0.0)
        arr = np.clip(arr, 0, 255).astype(np.uint8)
    elif arr.dtype == np.uint16:
        arr = (arr / 256.0).clip(0, 255).astype(np.uint8)
    else:
        arr = np.clip(arr, 0, 255).astype(np.uint8)

    return arr


def load_hdf5_image(path: str | Path) -> LoadedImage:
    """Load an image from an HDF5 (.h5, .hdf5) file as a LoadedImage."""
    try:
        import h5py
    except ImportError as exc:
        raise RuntimeError("h5py must be installed to load .h5 / .hdf5 files") from exc

    file_path = Path(path)
    if not file_path.is_file():
        raise FileNotFoundError(f"HDF5 file does not exist: {file_path}")

    try:
        with h5py.File(file_path, "r") as h5_file:
            raw_data = _find_image_dataset(h5_file)
    except Exception as exc:
        raise ValueError(f"Failed to read HDF5 file {file_path}: {exc}") from exc

    rgb = _format_rgb_array(raw_data)
    LOGGER.info("Loaded RGB image from HDF5 %s with shape %s", file_path, rgb.shape)
    return LoadedImage(data=rgb, path=file_path)
