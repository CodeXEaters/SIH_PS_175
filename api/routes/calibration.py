from fastapi import APIRouter, BackgroundTasks, status

from api.schemas.requests import CalibrationRequest
from api.schemas.responses import CalibrationResponse
from api.services import jobs, response_job, run_calibration, schedule

router = APIRouter(tags=["calibration"])


@router.post("/calibration", response_model=CalibrationResponse, status_code=status.HTTP_202_ACCEPTED)
async def calibrate(payload: CalibrationRequest, background_tasks: BackgroundTasks) -> CalibrationResponse:
    job = jobs.get(payload.job_id)
    job = jobs.update(job.job_id, status="CALIBRATION")
    schedule(run_calibration(job.job_id, payload.method, payload.parameters), background_tasks)
    return CalibrationResponse(**response_job(job), result=job.results.get("calibration"))
