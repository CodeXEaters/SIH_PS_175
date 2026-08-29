from api import services


def test_visualization_metadata_response(client):
    job = services.jobs.create("source.png")
    services.jobs.update(job.job_id, results={"visualization": {"metadata": {"vertices": 12}}})

    response = client.get(f"/visualization/{job.job_id}/metadata")

    assert response.status_code == 200
    assert response.json()["metadata"] == {"vertices": 12}


def test_visualization_missing_job_returns_404(client):
    response = client.get("/visualization/DW-999999")

    assert response.status_code == 404
    assert response.json()["code"] == "JOB_NOT_FOUND"
