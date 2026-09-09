from api import services


def test_dsm_metadata_response(client):
    job = services.jobs.create("source.png")
    services.jobs.update(job.job_id, results={"dsm_metadata": {
        "crs": "EPSG:4326", "dimensions": [2, 2], "gsd": 1.0,
        "bounds": [0, 0, 2, 2], "elevation_statistics": {"min": 1, "max": 5},
    }})

    response = client.get(f"/dsm/{job.job_id}/metadata")

    assert response.status_code == 200
    assert response.json()["metadata"]["crs"] == "EPSG:4326"


def test_dsm_missing_result_returns_404(client):
    job = services.jobs.create("source.png")
    response = client.get(f"/dsm/{job.job_id}")

    assert response.status_code == 404
    assert response.json()["code"] == "DSM_NOT_FOUND"
