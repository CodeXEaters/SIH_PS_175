from api import services


def test_valid_upload_creates_queued_job(client, png_bytes, monkeypatch):
    async def leave_queued(_: str):
        return None

    monkeypatch.setattr("api.routes.inference.run_pipeline", leave_queued)
    response = client.post("/inference", files={"file": ("site.png", png_bytes, "image/png")})

    assert response.status_code == 202
    body = response.json()
    assert body["job_id"] == "DW-000001"
    assert body["status"] == "QUEUED"
    assert services.jobs.get(body["job_id"]).input_file == "site.png"


def test_rejects_unsupported_upload(client):
    response = client.post("/inference", files={"file": ("notes.pdf", b"not an image", "application/pdf")})

    assert response.status_code == 400
    assert response.json()["code"] == "UNSUPPORTED_FILE_TYPE"


def test_rejects_missing_file(client):
    response = client.post("/inference", data={"unused": "value"})

    assert response.status_code == 400
    assert response.json()["code"] == "MISSING_FILE"


def test_rejects_corrupted_image(client):
    response = client.post("/inference", files={"file": ("broken.png", b"not-a-png", "image/png")})

    assert response.status_code == 400
    assert response.json()["code"] == "CORRUPTED_IMAGE"


def test_job_status_is_available(client):
    job = services.jobs.create("source.png")
    services.jobs.update(job.job_id, status="PROCESSING")

    response = client.get(f"/inference/{job.job_id}")

    assert response.status_code == 200
    assert response.json()["status"] == "PROCESSING"
