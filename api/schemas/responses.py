"""Stable response models shared by all API routes."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class JobResponse(BaseModel):
    job_id: str
    status: str
    created_at: datetime
    updated_at: datetime


class InferenceResponse(JobResponse):
    input_file: str
    message: str = "Image accepted for processing."


class CalibrationResponse(JobResponse):
    result: dict[str, Any] | None = None


class DSMResponse(JobResponse):
    metadata: dict[str, Any] | None = None
    download_url: str | None = None


class ValidationResponse(JobResponse):
    results: dict[str, Any]


class VisualizationResponse(JobResponse):
    assets: dict[str, str | None] = Field(default_factory=dict)
    metadata: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    error: Literal[True] = True
    code: str
    message: str
    detail: Any | None = None
