from __future__ import annotations

import re

from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.responses import InferenceResponse
from api.services import APIError, MAX_UPLOAD_BYTES, jobs, queue_job, response_job, run_pipeline, save_upload, schedule, validate_upload

router = APIRouter(tags=["inference"])


async def _uploaded_image(request: Request) -> tuple[str, str | None, bytes]:
    """Extract a single ``file`` field without requiring python-multipart at import time."""
    declared_size = request.headers.get("content-length")
    if declared_size and declared_size.isdigit() and int(declared_size) > MAX_UPLOAD_BYTES + 1_000_000:
        raise APIError(413, "FILE_TOO_LARGE", "Upload exceeds the configured size limit.")
    body = await request.body()
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("image/"):
        name = request.headers.get("x-filename")
        return name or "upload", content_type, body
    boundary_match = re.search(r"boundary=(?:\"([^\"]+)\"|([^;\s]+))", content_type, re.I)
    if not boundary_match:
        raise APIError(400, "MISSING_FILE", "Submit an image as multipart form field 'file'.")
    boundary = (boundary_match.group(1) or boundary_match.group(2)).encode()
    for part in body.split(b"--" + boundary):
        header, separator, payload = part.partition(b"\r\n\r\n")
        if not separator:
            continue
        disposition = re.search(br'content-disposition:\s*form-data;[^\r\n]*\bname="([^"]+)"(?:;\s*filename="([^"]*)")?', header, re.I)
        if not disposition or disposition.group(1) != b"file":
            continue
        filename = (disposition.group(2) or b"").decode("utf-8", "replace")
        item_type = re.search(br"content-type:\s*([^\r\n]+)", header, re.I)
        payload = payload[:-2] if payload.endswith(b"\r\n") else payload
        return filename, item_type.group(1).decode("ascii", "replace") if item_type else None, payload
    raise APIError(400, "MISSING_FILE", "Multipart request does not contain a 'file' field.")


@router.post("/inference", response_model=InferenceResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_inference(request: Request, background_tasks: BackgroundTasks) -> InferenceResponse:
    filename, content_type, data = await _uploaded_image(request)
    safe_name = validate_upload(filename, content_type, data)
    job, _ = save_upload(safe_name, data)
    queued = queue_job(job.job_id)
    schedule(run_pipeline(job.job_id), background_tasks)
    return InferenceResponse(**{
        "job_id": queued.job_id, "status": queued.status, "created_at": queued.created_at,
        "updated_at": queued.updated_at, "input_file": safe_name,
    })


@router.get("/inference/{job_id}", response_model=InferenceResponse)
async def inference_status(job_id: str) -> InferenceResponse:
    """Return the current state of an asynchronously processed job."""
    job = jobs.get(job_id)
    return InferenceResponse(**response_job(job), input_file=job.input_file)
