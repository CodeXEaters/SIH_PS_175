from fastapi import APIRouter

from api.schemas.responses import ValidationResponse
from api.services import APIError, jobs, response_job

router = APIRouter(tags=["validation"])


@router.get("/validation/{job_id}", response_model=ValidationResponse)
async def validation_results(job_id: str) -> ValidationResponse:
    job = jobs.get(job_id)
    results = job.results.get("validation") or job.results.get("pipeline", {}).get("validation")
    if results is None:
        raise APIError(404, "VALIDATION_NOT_FOUND", f"No validation results are available for job '{job_id}'.")
    return ValidationResponse(**response_job(job), results=results)
