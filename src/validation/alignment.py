"""Raster alignment for trustworthy elevation comparisons."""
from typing import Any

import numpy as np
from rasterio.crs import CRS
from rasterio.enums import Resampling
from rasterio.transform import Affine, array_bounds
from rasterio.warp import reproject, transform_bounds


def align_raster(
	source: np.ndarray,
	source_transform: Affine,
	source_crs: CRS | str,
	target_shape: tuple[int, int],
	target_transform: Affine,
	target_crs: CRS | str,
	*,
	resampling: Resampling = Resampling.bilinear,
) -> np.ndarray:
	"""Reproject a raster onto target geometry, using NaN for uncovered pixels."""
	source_array = np.asarray(source, dtype=np.float32)
	if source_array.ndim != 2:
		raise ValueError("source raster must be a 2D array")
	if len(target_shape) != 2 or any(size < 1 for size in target_shape):
		raise ValueError("target_shape must contain two positive dimensions")
	source_crs = CRS.from_user_input(source_crs)
	target_crs = CRS.from_user_input(target_crs)
	source_bounds = transform_bounds(
		source_crs,
		target_crs,
		*array_bounds(source_array.shape[0], source_array.shape[1], source_transform),
	)
	target_bounds = array_bounds(target_shape[0], target_shape[1], target_transform)
	if (
		source_bounds[2] <= target_bounds[0]
		or source_bounds[0] >= target_bounds[2]
		or source_bounds[3] <= target_bounds[1]
		or source_bounds[1] >= target_bounds[3]
	):
		raise ValueError("source raster does not overlap target extent")

	aligned = np.full(target_shape, np.nan, dtype=np.float32)
	reproject(
		source=source_array,
		destination=aligned,
		src_transform=source_transform,
		src_crs=source_crs,
		dst_transform=target_transform,
		dst_crs=target_crs,
		src_nodata=np.nan,
		dst_nodata=np.nan,
		resampling=resampling,
	)
	return aligned


def align_elevation_reference(
	predicted: np.ndarray,
	reference: np.ndarray,
	pred_metadata: Any = None,
	ref_metadata: Any = None,
	nodata: float | None = None,
) -> tuple[np.ndarray, np.ndarray]:
	"""Align reference elevation to match the predicted elevation raster geometry.

	Handles CRS reprojection (when metadata is provided), spatial shape resizing,
	NaN/Inf filtering, and nodata exclusion.

	Returns:
		A tuple of (aligned_reference, valid_mask).
	"""
	pred_arr = np.asarray(predicted, dtype=np.float32)
	ref_arr = np.asarray(reference, dtype=np.float32)

	if pred_arr.ndim != 2:
		raise ValueError("predicted elevation must be a 2D array")
	if ref_arr.ndim != 2:
		raise ValueError("reference elevation must be a 2D array")

	# Check if CRS and transforms are available on both sides
	has_geo = (
		pred_metadata is not None
		and ref_metadata is not None
		and hasattr(pred_metadata, "crs")
		and hasattr(ref_metadata, "crs")
		and hasattr(pred_metadata, "transform")
		and hasattr(ref_metadata, "transform")
		and pred_metadata.crs is not None
		and ref_metadata.crs is not None
	)

	if has_geo:
		try:
			aligned_ref = align_raster(
				ref_arr,
				ref_metadata.transform,
				ref_metadata.crs,
				pred_arr.shape,
				pred_metadata.transform,
				pred_metadata.crs,
			)
		except Exception:
			# If reprojection fails due to boundary mismatch, fall back to shape alignment
			aligned_ref = None
	else:
		aligned_ref = None

	if aligned_ref is None:
		if pred_arr.shape == ref_arr.shape:
			aligned_ref = ref_arr.copy()
		else:
			# Shape mismatch without CRS: interpolate reference to predicted dimensions
			import torch
			tensor_ref = torch.from_numpy(ref_arr).unsqueeze(0).unsqueeze(0)
			resized = torch.nn.functional.interpolate(
				tensor_ref, size=pred_arr.shape, mode="bilinear", align_corners=False
			)
			aligned_ref = resized.squeeze().cpu().numpy()

	# Build valid mask excluding NaNs, Infs, and nodata
	valid_mask = np.isfinite(pred_arr) & np.isfinite(aligned_ref)
	if nodata is not None:
		valid_mask &= (aligned_ref != nodata) & (pred_arr != nodata)
	# Common standard nodata thresholds
	valid_mask &= (aligned_ref > -9000.0) & (pred_arr > -9000.0)

	return aligned_ref, valid_mask

