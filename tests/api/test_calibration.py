from api import services


def test_calibration_queues_existing_job(client, monkeypatch):
    job = services.jobs.create("source.png")

    async def no_op(*_):
        return None

    monkeypatch.setattr("api.routes.calibration.run_calibration", no_op)
    response = client.post("/calibration", json={"job_id": job.job_id, "method": "auto"})

    assert response.status_code == 202
    assert response.json()["job_id"] == job.job_id


def test_calibration_missing_job_returns_404(client):
    response = client.post("/calibration", json={"job_id": "DW-999999", "method": "auto"})

    assert response.status_code == 404
    assert response.json()["code"] == "JOB_NOT_FOUND"


def test_calibration_invalid_request_returns_422(client):
    response = client.post("/calibration", json={"job_id": "DW-000001", "method": "unknown"})

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_REQUEST"
