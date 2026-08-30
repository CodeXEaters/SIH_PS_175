"""Checkpoint-agnostic adapter for Depth Anything style predictors."""

from collections.abc import Callable
from pathlib import Path

import numpy as np

from src.depth.inference import DepthModel


class DepthAnythingModel:
	"""Adapt an already-loaded predictor to the core ``DepthModel`` contract.

	``predictor`` may wrap torch, ONNX, or another runtime. Weight loading is
	deliberately outside this class so deployments control checkpoints.
	"""

	def __init__(self, predictor: Callable[[np.ndarray], np.ndarray]) -> None:
		self._predictor = predictor

	def predict(self, image: np.ndarray) -> np.ndarray:
		"""Run the injected predictor and return a floating-point 2D map."""
		array = np.asarray(image)
		if array.ndim != 3 or array.shape[2] != 3:
			raise ValueError("image must have shape (height, width, 3)")
		result = np.asarray(self._predictor(array), dtype=np.float32)
		if result.shape != array.shape[:2]:
			raise ValueError("predictor output must match image height and width")
		return result


class TorchScriptDepthModel:
	"""Run a serialized TorchScript depth predictor on RGB arrays."""

	def __init__(
		self,
		model,
		device: str | None = None,
		mean: tuple[float, float, float] = (0.485, 0.456, 0.406),
		standard_deviation: tuple[float, float, float] = (0.229, 0.224, 0.225),
		input_size: int | tuple[int, int] | None = None,
	) -> None:
		try:
			import torch
		except ImportError as error:
			raise RuntimeError("TorchScript inference requires the torch package") from error
		self._torch = torch
		self._device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
		self._model = model.to(self._device).eval()
		self._mean = torch.tensor(mean, dtype=torch.float32, device=self._device).view(1, 3, 1, 1)
		self._standard_deviation = torch.tensor(standard_deviation, dtype=torch.float32, device=self._device).view(1, 3, 1, 1)
		if input_size is None:
			self._input_size = None
		elif isinstance(input_size, int):
			self._input_size = (input_size, input_size)
		else:
			self._input_size = (int(input_size[0]), int(input_size[1]))

	@classmethod
	def from_checkpoint(
		cls,
		path: str | Path,
		device: str | None = None,
		input_size: int | tuple[int, int] | None = None,
	) -> "TorchScriptDepthModel":
		"""Load a TorchScript checkpoint from a local file."""
		checkpoint = Path(path)
		if not checkpoint.is_file():
			raise FileNotFoundError(f"depth checkpoint does not exist: {checkpoint}")
		try:
			import torch
		except ImportError as error:
			raise RuntimeError("TorchScript inference requires the torch package") from error
		selected_device = device or ("cuda" if torch.cuda.is_available() else "cpu")
		model = torch.jit.load(str(checkpoint), map_location=selected_device)
		return cls(model, selected_device, input_size=input_size)

	def predict(self, image: np.ndarray) -> np.ndarray:
		"""Run TorchScript inference and resize the depth map to image size."""
		array = np.asarray(image)
		if array.ndim != 3 or array.shape[2] != 3:
			raise ValueError("image must have shape (height, width, 3)")
		if not np.issubdtype(array.dtype, np.number) or np.any(array < 0) or np.any(array > 255):
			raise ValueError("image values must be in the range [0, 255]")
		normalized = np.ascontiguousarray(array, dtype=np.float32) * np.float32(1.0 / 255.0)
		tensor = self._torch.from_numpy(normalized).to(self._device)
		tensor = tensor.permute(2, 0, 1).unsqueeze(0)
		if self._input_size is not None and tensor.shape[-2:] != self._input_size:
			tensor = self._torch.nn.functional.interpolate(
				tensor, size=self._input_size, mode="bilinear", align_corners=False
			)
		tensor = (tensor - self._mean) / self._standard_deviation
		with self._torch.inference_mode():
			output = self._model(tensor)
		if isinstance(output, dict):
			output = output.get("depth", output.get("predicted_depth"))
		if isinstance(output, (tuple, list)):
			output = output[0]
		if output is None or not hasattr(output, "ndim"):
			raise ValueError("depth model must return a tensor or supported mapping")
		if output.ndim == 4:
			if output.shape[1] != 1:
				raise ValueError("depth model output must have one depth channel")
			output = output[:, 0]
		if output.ndim != 3:
			raise ValueError("depth model output must have shape (batch, height, width)")
		output = self._torch.nn.functional.interpolate(
			output.unsqueeze(1), size=array.shape[:2], mode="bilinear", align_corners=False
		).squeeze()
		return np.asarray(output.detach().cpu().contiguous().numpy(), dtype=np.float32)
