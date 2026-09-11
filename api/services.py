"""Job storage, upload validation, and adapters to the core ``src`` pipeline.

This module deliberately contains no imagery, geospatial, calibration, or mesh
algorithms.  It only owns API state and calls implementations supplied by src.
"""

from __future__ import annotations

import asyncio
import importlib
import inspect
import os
import re
import threading
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Callable

import numpy as np
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

JOB_STATUSES = frozenset(
    {
        "UPLOADED", "QUEUED", "PROCESSING", "DEPTH_ESTIMATION", "CALIBRATION",
        "DSM_GENERATION", "VALIDATION", "MESH_GENERATION", "COMPLETED", "FAILED",
    }
)
TERMINAL_STATUSES = frozenset({"COMPLETED", "FAILED"})
ALLOWED_EXTENSIONS = frozenset({".png", ".jpg", ".jpeg", ".tif", ".tiff", ".geotiff", ".h5", ".hdf5"})
ALLOWED_CONTENT_TYPES = frozenset(
    {
        "image/png", "image/jpeg", "image/tiff", "image/x-tiff",
        "image/geotiff", "image/tiff; application=geotiff",
        "application/x-hdf5", "application/x-hdf", "application/x-h5",
        "application/octet-stream",
    }
)
MAX_UPLOAD_BYTES = int(os.getenv("API_MAX_UPLOAD_BYTES", str(50 * 1024 * 1024)))
PROJECT_ROOT = Path(__file__).resolve().parents[1]
STORAGE_ROOT = Path(os.getenv("API_STORAGE_DIR", str(PROJECT_ROOT / "output" / "api_jobs"))).resolve()


class APIError(Exception):
    def __init__(self, status_code: int, code: str, message: str, detail: Any = None):
        self.status_code, self.code, self.message, self.detail = status_code, code, message, detail
        super().__init__(message)


@dataclass
class Job:
    job_id: str
    status: str
    input_file: str
    created_at: datetime
    updated_at: datetime
    results: dict[str, Any] = field(default_factory=dict)
    error: dict[str, Any] | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "job_id": self.job_id, "status": self.status, "input_file": self.input_file,
            "created_at": self.created_at, "updated_at": self.updated_at,
            "results": self.results, "error": self.error,
        }


class JobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._lock = threading.RLock()
        self._sequence = 0

    def create(self, input_file: str) -> Job:
        with self._lock:
            self._sequence += 1
            job_id = f"DW-{self._sequence:06d}"
            now = datetime.now(UTC)
            job = Job(job_id, "UPLOADED", input_file, now, now)
            self._jobs[job_id] = job
            return job

    def _load_from_storage(self, job_id: str) -> Job | None:
        job_dir = STORAGE_ROOT / job_id
        if not job_dir.is_dir():
            return None
        input_dir = job_dir / "input"
        results_dir = job_dir / "results"
        input_file = ""
        input_path = ""
        if input_dir.is_dir():
            files = [f for f in input_dir.iterdir() if f.is_file()]
            if files:
                target_file = files[0]
                input_path = str(target_file)
                parts = target_file.name.split("_", 1)
                input_file = parts[1] if len(parts) > 1 else target_file.name

        now = datetime.now(UTC)
        is_completed = (results_dir / "terrain.glb").is_file()
        job = Job(job_id, "COMPLETED" if is_completed else "UPLOADED", input_file, now, now)
        if input_path:
            job.results["input_path"] = input_path

        if is_completed:
            meta_file = results_dir / "metadata.json"
            meta: dict[str, Any] = {}
            if meta_file.is_file():
                import json
                try:
                    meta = json.loads(meta_file.read_text())
                except Exception:
                    pass
            dsm_file = results_dir / "absolute_dsm.tif" if (results_dir / "absolute_dsm.tif").is_file() else results_dir / "relative_dsm.npy"
            texture_file = results_dir / "texture.png"
            job.results.update({
                "pipeline": {"is_metric": meta.get("is_metric", False)},
                "dsm_path": str(dsm_file) if dsm_file.is_file() else None,
                "dsm_metadata": meta,
                "visualization": {
                    "mesh_path": str(results_dir / "terrain.glb"),
                    "dsm_path": str(dsm_file) if dsm_file.is_file() else None,
                    "rgb_texture_path": str(texture_file) if texture_file.is_file() else None,
                    "metadata": meta,
                    "assets": {
                        "mesh": f"/visualization/{job_id}/mesh",
                        "dsm": f"/dsm/{job_id}",
                        "rgb_texture": f"/visualization/{job_id}/texture" if texture_file.is_file() else None,
                    },
                },
            })
        self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> Job:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                job = self._load_from_storage(job_id)
            if job is None:
                raise APIError(404, "JOB_NOT_FOUND", f"Job '{job_id}' was not found.")
            return job

    def update(self, job_id: str, *, status: str | None = None, results: dict[str, Any] | None = None,
               error: dict[str, Any] | None = None) -> Job:
        with self._lock:
            job = self.get(job_id)
            if status is not None:
                if status not in JOB_STATUSES:
                    raise ValueError(f"Unknown job status: {status}")
                job.status = status
            if results:
                job.results.update(results)
            if error is not None:
                job.error = error
            job.updated_at = datetime.now(UTC)
            return job

    def clear(self) -> None:
        """Test helper; application routes do not call this."""
        with self._lock:
            self._jobs.clear()
            self._sequence = 0


jobs = JobStore()


def safe_filename(filename: str | None) -> str:
    if not filename:
        raise APIError(400, "MISSING_FILENAME", "An uploaded file must have a filename.")
    # Browsers may use either separator; reject rather than silently changing it.
    if "/" in filename or "\\" in filename or filename in {".", ".."}:
        raise APIError(400, "UNSAFE_FILENAME", "File paths are not allowed as filenames.")
    name = Path(filename).name
    if name != filename or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._ -]{0,240}", name):
        raise APIError(400, "UNSAFE_FILENAME", "Filename contains unsupported characters.")
    if Path(name).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise APIError(400, "UNSUPPORTED_FILE_TYPE", "Supported files are PNG, JPG, JPEG, TIFF, GeoTIFF, H5, and HDF5.")
    if Path(name).stem.upper() in {"CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"}:
        raise APIError(400, "UNSAFE_FILENAME", "Filename is a reserved system name.")
    return name


def validate_upload(filename: str | None, content_type: str | None, data: bytes) -> str:
    name = safe_filename(filename)
    if not data:
        raise APIError(400, "EMPTY_FILE", "The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise APIError(413, "FILE_TOO_LARGE", f"Upload exceeds the {MAX_UPLOAD_BYTES} byte limit.")
    normalized_type = (content_type or "").split(";", 1)[0].strip().lower()
    if normalized_type and normalized_type not in ALLOWED_CONTENT_TYPES:
        raise APIError(400, "INVALID_CONTENT_TYPE", "The uploaded file does not have an accepted image content type.")
    
    suffix = Path(name).suffix.lower()
    if suffix in {".h5", ".hdf5"}:
        try:
            import io
            import h5py
            from src.io.hdf5_loader import _find_image_dataset
            with h5py.File(io.BytesIO(data), "r") as h5_file:
                _find_image_dataset(h5_file)
        except Exception as exc:
            raise APIError(400, "CORRUPTED_HDF5", f"The uploaded HDF5 file could not be read or contains no valid image data: {exc}") from exc
    else:
        try:
            with Image.open(__import__("io").BytesIO(data)) as image:
                image.verify()
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise APIError(400, "CORRUPTED_IMAGE", "The uploaded image is corrupted or not a supported image.") from exc
    return name


def save_upload(filename: str, data: bytes) -> tuple[Job, Path]:
    # A UUID prevents collisions without exposing the client filename as a path.
    preliminary = jobs.create("")
    directory = STORAGE_ROOT / preliminary.job_id / "input"
    directory.mkdir(parents=True, exist_ok=True)
    destination = directory / f"{uuid4().hex}_{filename}"
    destination.write_bytes(data)
    jobs.update(preliminary.job_id, results={"input_path": str(destination)})
    preliminary.input_file = filename
    return preliminary, destination


def queue_job(job_id: str) -> Job:
    return jobs.update(job_id, status="QUEUED")


def _callable_from_src(candidates: list[tuple[str, str]]) -> Callable[..., Any] | None:
    for module_name, attribute in candidates:
        try:
            callable_object = getattr(importlib.import_module(module_name), attribute, None)
        except ImportError:
            continue
        if callable(callable_object):
            return callable_object
    return None


async def _invoke(function: Callable[..., Any], **kwargs: Any) -> Any:
    """Call a sync or async core function, passing only accepted named inputs."""
    signature = inspect.signature(function)
    supports_kwargs = any(p.kind == p.VAR_KEYWORD for p in signature.parameters.values())
    arguments = kwargs if supports_kwargs else {k: v for k, v in kwargs.items() if k in signature.parameters}
    value = function(**arguments)
    if inspect.isawaitable(value):
        return await value
    return value


async def run_pipeline(job_id: str) -> None:
    """Run the configured core pipeline and retain downloadable products."""
    job = jobs.get(job_id)
    jobs.update(job_id, status="PROCESSING")
    try:
        from src.config import load_config
        from src.depth.model_factory import create_depth_model
        from src.pipeline import process_path
        from src.result_export import export_processing_result

        config = load_config(PROJECT_ROOT / "configs" / "default.yaml")
        model_config = config["model"]
        checkpoint = os.getenv("DEPTH_CHECKPOINT", str(PROJECT_ROOT / "models" / "checkpoints" / "depth_anything_v2_vits.pt"))
        model = create_depth_model(model_config["name"], checkpoint=checkpoint, input_size=model_config.get("input_size"))
        jobs.update(job_id, status="DEPTH_ESTIMATION")
        result = await asyncio.to_thread(
            process_path,
            job.results["input_path"],
            model,
            vertical_exaggeration=float(config["mesh"].get("vertical_exaggeration", 1.0)),
            tile_size=model_config.get("tile_size"),
            overlap=float(model_config.get("overlap", 0.25)),
        )
        jobs.update(job_id, status="MESH_GENERATION")
        # Load input image to embed as photo-texture on the 3D GLB mesh
        from src.io.image_loader import load_image
        from src.io.hdf5_loader import load_hdf5_image
        input_texture = None
        try:
            loader = load_hdf5_image if Path(job.results["input_path"]).suffix.lower() in {".h5", ".hdf5"} else load_image
            loaded_img = await asyncio.to_thread(loader, job.results["input_path"])
            input_texture = loaded_img.data
        except Exception:
            pass
        exported = await asyncio.to_thread(export_processing_result, result, STORAGE_ROOT / job_id / "results", texture=input_texture)
        finite = result.dsm[np.isfinite(result.dsm)]
        metadata = {
            "is_metric": result.is_metric,
            "source_kind": "elevation" if Path(job.results["input_path"]).suffix.lower() in {".h5", ".hdf5"} else "image",
            "dimensions": list(result.dsm.shape),
            "elevation_statistics": {
                "min": float(np.min(finite)), "max": float(np.max(finite)),
                "mean": float(np.mean(finite)), "p05": float(np.percentile(finite, 5)),
                "p95": float(np.percentile(finite, 95)),
            },
            "valid_pixels": int(finite.size),
        }
        if result.raster_metadata is not None:
            metadata.update({
                "crs": result.raster_metadata.crs.to_string(),
                "bounds": list(result.raster_metadata.bounds),
                "resolution": list(result.raster_metadata.resolution),
            })
        jobs.update(job_id, status="COMPLETED", results={
            "pipeline": {"is_metric": result.is_metric},
            "dsm_path": str(exported["dsm"]),
            "dsm_metadata": metadata,
            "visualization": {
                "mesh_path": str(exported["mesh"]),
                "dsm_path": str(exported["dsm"]),
                "rgb_texture_path": str(exported["rgb_texture"]) if exported.get("rgb_texture") else None,
                "metadata": metadata,
                "assets": {
                    "mesh": f"/visualization/{job_id}/mesh",
                    "dsm": f"/dsm/{job_id}",
                    "rgb_texture": f"/visualization/{job_id}/texture" if exported.get("rgb_texture") else None,
                },
            },
        })
    except Exception as exc:  # Core failures are surfaced as job state, never an unstructured task crash.
        jobs.update(job_id, status="FAILED", error={"code": "PIPELINE_FAILED", "message": str(exc)})


async def run_calibration(job_id: str, method: str, parameters: dict[str, Any]) -> None:
    job = jobs.get(job_id)
    jobs.update(job_id, status="CALIBRATION")
    function = _callable_from_src([("src.calibration", "run_calibration"), ("src.calibration.pipeline", "run_calibration")])
    if function is None:
        jobs.update(job_id, status="FAILED", error={"code": "CALIBRATION_UNAVAILABLE", "message": "No calibration entry point was found in src.calibration."})
        return
    try:
        result = await _invoke(function, job_id=job_id, method=method, parameters=parameters, input_path=job.results.get("input_path"))
        jobs.update(job_id, status="COMPLETED", results={"calibration": result or {}})
    except Exception as exc:
        jobs.update(job_id, status="FAILED", error={"code": "CALIBRATION_FAILED", "message": str(exc)})


def schedule(coro: Any, background_tasks: Any | None = None) -> None:
    """Use FastAPI's background runner when provided, otherwise create a task."""
    if background_tasks is not None:
        background_tasks.add_task(asyncio.run, coro)
    else:
        asyncio.create_task(coro)


def response_job(job: Job) -> dict[str, Any]:
    return {
        "job_id": job.job_id, "status": job.status, "created_at": job.created_at,
        "updated_at": job.updated_at, "results": job.results, "error": job.error,
    }
