"""Models accepted by API endpoints.

The inference image itself is submitted as the multipart field named ``file``.
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class APIRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")


class InferenceRequest(APIRequest):
    """Optional processing settings accompanying an uploaded image."""

    options: dict[str, Any] = Field(default_factory=dict)


class CalibrationRequest(APIRequest):
    job_id: str = Field(min_length=1, max_length=128)
    method: Literal["srtm", "gcp", "scale_shift", "auto"] = "auto"
    parameters: dict[str, Any] = Field(default_factory=dict)


class ValidationRequest(APIRequest):
    job_id: str = Field(min_length=1, max_length=128)
    options: dict[str, Any] = Field(default_factory=dict)


class VisualizationRequest(APIRequest):
    job_id: str = Field(min_length=1, max_length=128)
    include_texture: bool = True
