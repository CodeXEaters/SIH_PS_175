import mimetypes
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

from api.schemas.responses import VisualizationResponse
from api.services import APIError, PROJECT_ROOT, jobs, response_job

router = APIRouter(tags=["visualization"])


def _visualization(job_id: str) -> dict:
    job = jobs.get(job_id)
    return job.results.get("visualization") or job.results.get("pipeline", {}).get("visualization") or {}


def _asset(job_id: str, key: str) -> Path:
    value = _visualization(job_id).get(key)
    if not value:
        raise APIError(404, "VISUALIZATION_NOT_FOUND", f"No {key} result is available for job '{job_id}'.")
    path = Path(value).resolve()
    if not path.is_file() or PROJECT_ROOT not in path.parents:
        raise APIError(404, "VISUALIZATION_NOT_FOUND", f"No {key} result is available for job '{job_id}'.")
    return path


@router.get("/visualization/{job_id}", response_model=VisualizationResponse)
async def visualization(job_id: str) -> VisualizationResponse:
    job = jobs.get(job_id)
    item = _visualization(job_id)
    if not item:
        raise APIError(404, "VISUALIZATION_NOT_FOUND", f"No visualization result is available for job '{job_id}'.")
    assets = {
        "mesh": f"/visualization/{job_id}/mesh" if item.get("mesh_path") else None,
        "dsm": f"/dsm/{job_id}" if item.get("dsm_path") else None,
        "rgb_texture": f"/visualization/{job_id}/texture" if item.get("rgb_texture_path") else None,
    }
    return VisualizationResponse(**response_job(job), assets=assets, metadata=item.get("metadata"))


@router.get("/visualization/{job_id}/mesh")
async def visualization_mesh(job_id: str) -> FileResponse:
    path = _asset(job_id, "mesh_path")
    return FileResponse(path, media_type="model/gltf-binary", filename="terrain.glb")


@router.get("/visualization/{job_id}/texture")
async def visualization_texture(job_id: str) -> FileResponse:
    """Download the RGB texture when the mesh pipeline generated one."""
    path = _asset(job_id, "rgb_texture_path")
    return FileResponse(path, media_type=mimetypes.guess_type(path.name)[0] or "application/octet-stream", filename=path.name)


@router.get("/visualization/{job_id}/metadata", response_model=VisualizationResponse)
async def visualization_metadata(job_id: str) -> VisualizationResponse:
    job = jobs.get(job_id)
    item = _visualization(job_id)
    metadata = item.get("metadata")
    if metadata is None:
        raise APIError(404, "VISUALIZATION_METADATA_NOT_FOUND", f"No visualization metadata is available for job '{job_id}'.")
    return VisualizationResponse(**response_job(job), assets={}, metadata=metadata)
