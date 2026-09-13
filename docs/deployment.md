# Deployment & Execution Guide

This document outlines environment setup, configuration, model checkpoint management, and execution instructions for the DepthWizard backend and frontend.

---

## 1. Environment & Dependencies

### Python Runtime
- **Version**: Python 3.11 or higher
- **Virtual Environment**: Recommended to avoid dependency conflicts.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### Key Python Packages
- `torch>=2.0`: PyTorch tensor and TorchScript runtime (CPU or CUDA).
- `fastapi>=0.110.0`, `uvicorn>=0.28.0`: High-performance asynchronous API server.
- `pydantic>=2.0`: Request/response validation.
- `rasterio>=1.3`: Geospatial raster I/O and transform handling.
- `trimesh>=4.0`: 3D geometry manipulation and GLB export.
- `pillow>=10.0`, `numpy>=1.24,<2.0`, `pyyaml>=6.0`, `h5py>=3.10`: Image and dataset processing.
- `pytest>=8.0`, `httpx>=0.27.0`: Test runner and API test client.

---

## 2. Environment Variables

Create `.env` from `.env.example`:

| Variable | Type | Default | Description |
|---|---|---|---|
| `DEPTH_CHECKPOINT` | string (path) | `models/checkpoints/depth_anything_v2_vits.pt` | Path to TorchScript model weights. |
| `API_STORAGE_DIR` | string (path) | `output/api_jobs` | Working directory for job uploads and outputs. |
| `API_MAX_UPLOAD_BYTES` | integer | `52428800` (50 MB) | Size limit for incoming uploads. |
| `API_CORS_ORIGINS` | string | `*` | Comma-separated list of allowed CORS origins. |
| `VITE_API_URL` | string (URL) | `http://localhost:8000` | Backend URL consumed by the Vite frontend. |

---

## 3. Depth Anything V2 Checkpoint Setup

The system loads a serialized TorchScript model via `torch.jit.load`.

1. **Location**: Place the TorchScript `.pt` file in `models/checkpoints/depth_anything_v2_vits.pt`.
2. **Exporting**: If you have the official PyTorch `.pth` checkpoint from Hugging Face:
   ```bash
   python scripts/export_depth_anything_torchscript.py \
       models/pretrained/depth_anything_v2_vits.pth \
       models/checkpoints/depth_anything_v2_vits.pt \
       --encoder vits
   ```
3. **Missing Model Handling**: If an inference request is made when no checkpoint is present, the API will fail gracefully with a descriptive error code `PIPELINE_FAILED` and instructions on where to place the weights.

---

## 4. Running the Backend Server

Start the FastAPI application with Uvicorn:

```powershell
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Health Endpoint**: `GET http://127.0.0.1:8000/health`
- **Interactive Documentation**: `GET http://127.0.0.1:8000/docs`
- **Inference Submission**: `POST http://127.0.0.1:8000/inference` (multipart image)

---

## 5. Running the Frontend Application

The frontend is a modern React + Three.js application located in `frontend/`.

```powershell
cd frontend
# On Windows PowerShell, use npm.cmd if scripts are restricted:
npm.cmd install
npm.cmd run dev
```

The application will be served at `http://localhost:5173`.

---

## 6. Testing & Quality Assurance

Run the complete test suite:

```powershell
python -m pytest -ra
```

Run test suite with verbose output:

```powershell
python -m pytest -v
```
