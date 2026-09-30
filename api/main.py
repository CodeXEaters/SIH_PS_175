from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes import calibration, dsm, inference, validation, visualization
from api.services import APIError


def _error_response(status_code: int, code: str, message: str, detail=None) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"error": True, "code": code, "message": message, "detail": detail})


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(title="Depth Workflow API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in __import__("os").getenv("API_CORS_ORIGINS", "*").split(",")],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(APIError)
async def api_error_handler(_: Request, exc: APIError) -> JSONResponse:
    return _error_response(exc.status_code, exc.code, exc.message, exc.detail)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return _error_response(422, "INVALID_REQUEST", "Request validation failed.", exc.errors())


@app.exception_handler(Exception)
async def unexpected_error_handler(_: Request, __: Exception) -> JSONResponse:
    return _error_response(500, "INTERNAL_ERROR", "An unexpected internal error occurred.")


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "depth-workflow-api"}


import os
from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app.include_router(inference.router)
app.include_router(calibration.router)
app.include_router(dsm.router)
app.include_router(validation.router)
app.include_router(visualization.router)

_dist_env = os.getenv("FRONTEND_DIST_DIR")
_default_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
FRONTEND_DIST = Path(_dist_env).resolve() if _dist_env else _default_dist

if FRONTEND_DIST.is_dir() and (FRONTEND_DIST / "index.html").is_file():
    if (FRONTEND_DIST / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="static-assets")

    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        api_prefixes = ("api", "inference", "calibration", "dsm", "validation", "visualization", "docs", "redoc", "openapi.json", "health")
        if any(full_path == p or full_path.startswith(f"{p}/") for p in api_prefixes):
            return JSONResponse(status_code=404, content={"error": True, "code": "NOT_FOUND", "message": f"Endpoint '/{full_path}' not found."})
        target_file = FRONTEND_DIST / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)
        return FileResponse(FRONTEND_DIST / "index.html")
