"""Registry and factory for pluggable depth models."""

from collections.abc import Callable
from typing import Any

from src.depth.inference import DepthModel

ModelBuilder = Callable[..., DepthModel]
_MODEL_BUILDERS: dict[str, ModelBuilder] = {}


def _build_depth_anything(**kwargs: Any) -> DepthModel:
	"""Build the local TorchScript Depth Anything adapter."""
	from src.depth.depth_anything import TorchScriptDepthModel

	checkpoint = kwargs.pop("checkpoint", None)
	if checkpoint is None:
		raise ValueError("depth_anything requires a local checkpoint path")
	kwargs.setdefault("input_size", 518)
	return TorchScriptDepthModel.from_checkpoint(checkpoint, **kwargs)


def register_depth_model(name: str, builder: ModelBuilder) -> None:
	"""Register a model builder under a stable configuration name."""
	normalized_name = name.strip().lower()
	if not normalized_name:
		raise ValueError("model name must not be empty")
	_MODEL_BUILDERS[normalized_name] = builder


def available_depth_models() -> tuple[str, ...]:
	"""Return registered model names in deterministic order."""
	return tuple(sorted(_MODEL_BUILDERS))


def create_depth_model(name: str, **kwargs: Any) -> DepthModel:
	"""Construct a registered depth model from configuration parameters."""
	normalized_name = name.strip().lower()
	try:
		builder = _MODEL_BUILDERS[normalized_name]
	except KeyError as error:
		available = ", ".join(available_depth_models()) or "none"
		raise ValueError(f"unknown depth model '{name}'; available models: {available}") from error
	return builder(**kwargs)


register_depth_model("depth_anything", _build_depth_anything)
