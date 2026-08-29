from api import services


def test_validation_returns_pipeline_metrics(client):
    job = services.jobs.create("source.png")
    metrics = {"mae": 0.4, "rmse": 0.6, "r2": 0.91, "bias": -0.1, "p95_error": 1.2}
    services.jobs.update(job.job_id, results={"validation": metrics})

    response = client.get(f"/validation/{job.job_id}")

    assert response.status_code == 200
    assert response.json()["results"] == metrics


def test_validation_missing_job_returns_404(client):
    response = client.get("/validation/DW-999999")

    assert response.status_code == 404
    assert response.json()["code"] == "JOB_NOT_FOUND"
