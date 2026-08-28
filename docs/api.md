# Depth Workflow API

The API is served by `api.main:app`.  All errors use the following JSON shape:

```json
{"error": true, "code": "JOB_NOT_FOUND", "message": "...", "detail": null}
```

`POST /inference` accepts `multipart/form-data` with one `file` field. PNG, JPG,
JPEG, TIFF and GeoTIFF images are supported. The upload limit defaults to 50 MiB
and is configurable with `API_MAX_UPLOAD_BYTES`.

## Health

**Method:** `GET`  
**URL:** `/health`

**Request:** none.

**Response (200):** `{"status":"ok","service":"depth-workflow-api"}`

**Errors:** `500` for an unexpected service failure.

**Example:** `curl http://localhost:8000/health`

## Start inference

**Method:** `POST`  
**URL:** `/inference`

**Request:** multipart form field `file` containing an image. Filenames must be
plain safe filenames; path separators are rejected.

**Response (202):**

```json
{"job_id":"DW-000001","status":"QUEUED","input_file":"survey.tif","created_at":"...","updated_at":"..."}
```

**Errors:** `400` missing/unsafe/unsupported/corrupt image, `413` oversized
upload, `500` internal error.

**Example:** `curl -F "file=@survey.tif;type=image/tiff" http://localhost:8000/inference`

## Check inference job status

**Method:** `GET`  
**URL:** `/inference/{job_id}`

**Request:** path parameter `job_id`.

**Response (200):** the job identifier, current status, input filename, and
creation/update timestamps. Status is one of `UPLOADED`, `QUEUED`, `PROCESSING`,
`DEPTH_ESTIMATION`, `CALIBRATION`, `DSM_GENERATION`, `VALIDATION`,
`MESH_GENERATION`, `COMPLETED`, or `FAILED`.

**Errors:** `404` unknown job, `500` internal error.

**Example:** `curl http://localhost:8000/inference/DW-000001`

## Request calibration

**Method:** `POST`  
**URL:** `/calibration`

**Request:** `{"job_id":"DW-000001","method":"auto","parameters":{}}`.
Methods are `auto`, `srtm`, `gcp`, and `scale_shift`; the API passes these to the
core calibration implementation.

**Response (202):** job response plus optional `result`.

**Errors:** `404` unknown job, `422` invalid request body, `500` internal error.

**Example:** `curl -X POST -H "Content-Type: application/json" -d '{"job_id":"DW-000001","method":"auto"}' http://localhost:8000/calibration`

## Download DSM

**Method:** `GET`  
**URL:** `/dsm/{job_id}`

**Request:** path parameter `job_id`.

**Response (200):** the generated DSM GeoTIFF file.

**Errors:** `404` unknown job or no DSM result, `500` internal error.

**Example:** `curl -OJ http://localhost:8000/dsm/DW-000001`

## DSM metadata

**Method:** `GET`  
**URL:** `/dsm/{job_id}/metadata`

**Request:** path parameter `job_id`.

**Response (200):** job response with `metadata` from `src/dsm`, including CRS,
dimensions, GSD, bounds, and elevation statistics.

**Errors:** `404` unknown job or unavailable metadata, `500` internal error.

**Example:** `curl http://localhost:8000/dsm/DW-000001/metadata`

## Validation results

**Method:** `GET`  
**URL:** `/validation/{job_id}`

**Request:** path parameter `job_id`.

**Response (200):** job response with pipeline-produced `results`, for example
`{"mae":0.4,"rmse":0.6,"r2":0.91,"bias":-0.1,"p95_error":1.2}`.

**Errors:** `404` unknown job or unavailable validation output, `500` internal error.

**Example:** `curl http://localhost:8000/validation/DW-000001`

## Visualization manifest

**Method:** `GET`  
**URL:** `/visualization/{job_id}`

**Request:** path parameter `job_id`.

**Response (200):** job response with `assets` links for the mesh, DSM and RGB
texture, plus visualization metadata.

**Errors:** `404` unknown job or unavailable visualization, `500` internal error.

**Example:** `curl http://localhost:8000/visualization/DW-000001`

## Download terrain mesh

**Method:** `GET`  
**URL:** `/visualization/{job_id}/mesh`

**Request:** path parameter `job_id`.

**Response (200):** `terrain.glb` with `model/gltf-binary` content type.

**Errors:** `404` unknown job or unavailable mesh, `500` internal error.

**Example:** `curl -OJ http://localhost:8000/visualization/DW-000001/mesh`

## Download RGB texture

**Method:** `GET`  
**URL:** `/visualization/{job_id}/texture`

**Request:** path parameter `job_id`.

**Response (200):** generated RGB texture image.

**Errors:** `404` unknown job or unavailable texture, `500` internal error.

**Example:** `curl -OJ http://localhost:8000/visualization/DW-000001/texture`

## Visualization metadata

**Method:** `GET`  
**URL:** `/visualization/{job_id}/metadata`

**Request:** path parameter `job_id`.

**Response (200):** job response with generated mesh/terrain metadata.

**Errors:** `404` unknown job or unavailable metadata, `500` internal error.

**Example:** `curl http://localhost:8000/visualization/DW-000001/metadata`
