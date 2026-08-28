from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from api.main import app
from api import services


@pytest.fixture(autouse=True)
def isolated_jobs(tmp_path, monkeypatch):
    services.jobs.clear()
    monkeypatch.setattr(services, "STORAGE_ROOT", tmp_path / "api_jobs")
    yield
    services.jobs.clear()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def png_bytes():
    image = Image.new("RGB", (2, 2), (50, 100, 150))
    payload = BytesIO()
    image.save(payload, "PNG")
    return payload.getvalue()


def create_job(input_file="source.png"):
    return services.jobs.create(input_file)
