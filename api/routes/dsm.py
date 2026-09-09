from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse

from api.schemas.responses import DSMResponse
from api.services import APIError, PROJECT_ROOT, jobs, response_job

router = APIRouter(tags=["dsm"])


def _dsm_path(job_id: str) -> Path:
    job = jobs.get(job_id)
    value = (job.results.get("dsm_path") or job.results.get("pipeline", {}).get("dsm_path")
             or job.results.get("visualization", {}).get("dsm_path")
             or job.results.get("pipeline", {}).get("visualization", {}).get("dsm_path"))
    if not value:
        raise APIError(404, "DSM_NOT_FOUND", f"No DSM result is available for job '{job_id}'.")
    path = Path(value).resolve()
    if not path.is_file() or PROJECT_ROOT not in path.parents:
        raise APIError(404, "DSM_NOT_FOUND", f"No DSM result is available for job '{job_id}'.")
    return path


@router.get("/dsm/{job_id}")
async def download_dsm(job_id: str) -> FileResponse:
    path = _dsm_path(job_id)
    return FileResponse(path, media_type="image/tiff", filename=f"{job_id}.tif")


@router.get("/dsm/{job_id}/metadata", response_model=DSMResponse)
async def dsm_metadata(job_id: str) -> DSMResponse:
    job = jobs.get(job_id)
    metadata = job.results.get("dsm_metadata") or job.results.get("pipeline", {}).get("dsm_metadata")
    if metadata is None:
        raise APIError(404, "DSM_METADATA_NOT_FOUND", f"No DSM metadata is available for job '{job_id}'.")
    return DSMResponse(**response_job(job), metadata=metadata, download_url=f"/dsm/{job_id}")
