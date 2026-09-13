from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import FileResponse

from api.schemas.responses import ValidationResponse
from api.services import APIError, PROJECT_ROOT, STORAGE_ROOT, jobs, response_job

router = APIRouter(tags=["validation"])


@router.get("/validation/{job_id}", response_model=ValidationResponse)
async def validation_results(job_id: str) -> ValidationResponse:
    job = jobs.get(job_id)
    results = job.results.get("validation") or job.results.get("pipeline", {}).get("validation")
    if results is None:
        if job.status == "COMPLETED":
            results = {"available": False, "reason": "No reference elevation data supplied"}
        else:
            raise APIError(404, "VALIDATION_NOT_FOUND", f"No validation results are available for job '{job_id}'.")
    data = response_job(job)
    data["results"] = results
    return ValidationResponse(**data)


@router.get("/validation/{job_id}/report.json")
async def validation_report_json(job_id: str) -> FileResponse:
    job = jobs.get(job_id)
    report_file = (STORAGE_ROOT / job_id / "results" / "validation_report.json").resolve()
    if not report_file.is_file() or (PROJECT_ROOT not in report_file.parents and STORAGE_ROOT not in report_file.parents):
        raise APIError(404, "REPORT_NOT_FOUND", f"No validation report JSON found for job '{job_id}'.")
    return FileResponse(report_file, media_type="application/json", filename="validation_report.json")


@router.get("/validation/{job_id}/metrics.csv")
async def validation_metrics_csv(job_id: str) -> FileResponse:
    job = jobs.get(job_id)
    csv_file = (STORAGE_ROOT / job_id / "results" / "validation_metrics.csv").resolve()
    if not csv_file.is_file() or (PROJECT_ROOT not in csv_file.parents and STORAGE_ROOT not in csv_file.parents):
        raise APIError(404, "METRICS_NOT_FOUND", f"No validation metrics CSV found for job '{job_id}'.")
    return FileResponse(csv_file, media_type="text/csv", filename="validation_metrics.csv")
