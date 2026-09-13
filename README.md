# DepthWizard

DepthWizard is a single-view 3D terrain reconstruction system that converts standard RGB or multispectral satellite/aerial imagery into elevation models (DSM) and textured 3D meshes (GLB).

---

## Architecture Overview

- **Core Engine (`src/`)**: Image validation, tiling, Depth Anything V2 relative depth inference, scale-and-shift calibration, DSM generation, and 3D heightfield/mesh generation.
- **Backend API (`api/`)**: FastAPI server providing asynchronous job queuing, upload handling, terrain generation pipelines, and visualization asset streaming.
- **Frontend (`frontend/`)**: Vite + React + Three.js application for interactive 3D terrain exploration and real-time inference telemetry.
- **CLI Tools (`scripts/`)**: Standalone scripts for batch dataset preparation, DSM calibration, mesh building, and model export.

---

## Quickstart Guide

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18 or higher (only required for the frontend)
- **OS**: Windows, Linux, or macOS (CPU supported out-of-the-box; CUDA used automatically when available)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/CodeXEaters/SIH_PS_175.git
cd SIH_PS_175
```

---

### Step 2: Python Environment & Dependencies

#### On Windows (PowerShell):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

> **Note for Windows PowerShell**: If `Activate.ps1` gives an execution policy error, run:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> .\.venv\Scripts\Activate.ps1
> ```

#### On Linux / macOS (Bash):
```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

---

### Step 3: Configure Environment Variables

Copy `.env.example` to `.env`:

#### Windows:
```powershell
Copy-Item .env.example .env
```

#### Linux / macOS:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Description | Default |
|---|---|---|
| `DEPTH_CHECKPOINT` | Path to TorchScript depth model | `models/checkpoints/depth_anything_v2_vits.pt` |
| `API_STORAGE_DIR` | Directory for uploads and generated outputs | `output/api_jobs` |
| `API_MAX_UPLOAD_BYTES` | Maximum allowed upload size in bytes | `52428800` (50 MB) |
| `API_CORS_ORIGINS` | Comma-separated allowed CORS origins | `*` |
| `VITE_API_URL` | API URL for the frontend | `http://localhost:8000` |

---

### Step 4: Model Checkpoint Setup

The backend uses a local **TorchScript** serialized checkpoint of Depth Anything V2 (`depth_anything_v2_vits.pt`, ~99.6 MB). Because weights are large binaries, they are excluded from Git.

**Expected location:** `models/checkpoints/depth_anything_v2_vits.pt`

#### Option A: Obtain Pre-Exported TorchScript Weights
Place `depth_anything_v2_vits.pt` directly into `models/checkpoints/`. If stored in a different path, set `DEPTH_CHECKPOINT` in `.env`:
```env
DEPTH_CHECKPOINT=path/to/your/depth_anything_v2_vits.pt
```

#### Option B: Export from Official Depth Anything V2 PyTorch Weights
1. Download official ViT-S weights (`depth_anything_v2_vits.pth`):
   ```bash
   curl -L -o models/pretrained/depth_anything_v2_vits.pth https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth
   ```
2. Clone Depth Anything V2 repository to project root (used for architecture definition):
   ```bash
   git clone https://github.com/DepthAnything/Depth-Anything-V2.git Depth-Anything-V2
   ```
3. Run the export script:
   ```bash
   python scripts/export_depth_anything_torchscript.py models/pretrained/depth_anything_v2_vits.pth models/checkpoints/depth_anything_v2_vits.pt --encoder vits
   ```

> **What happens if weights are missing?**
> The backend and tests will still start cleanly. If an inference request is submitted without weights, the job gracefully transitions to `FAILED` with an actionable error directing you to download or place `depth_anything_v2_vits.pt`.

---

### Step 5: Run Tests

Execute the full automated test suite (97 tests):

```powershell
python -m pytest
```

---

### Step 6: Start the Backend API

Start the FastAPI development server:

```powershell
python -m uvicorn api.main:app --reload --host 127.0.0.1 --port 8000
```

- **Health check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) -> `{"status": "ok", "service": "depth-workflow-api"}`
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Step 7: Start the Frontend (Optional)

In a separate terminal:

#### On Windows:
```powershell
cd frontend
# If npm is blocked by PowerShell execution policy, use npm.cmd:
npm.cmd install
npm.cmd run dev
```

#### On Linux / macOS:
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the interactive 3D terrain canvas and upload workspace.

---

## CLI Script Usage

### End-to-End Image Processing
```powershell
python scripts/process.py path/to/image.png --checkpoint models/checkpoints/depth_anything_v2_vits.pt --output output/bundle/
```

### Build 3D GLB Terrain Mesh from DSM
```powershell
python scripts/build_mesh.py path/to/dsm.npy --output output/terrain.glb --pixel-size 1.0 --vertical-exaggeration 1.0
```

### Run Relative Depth Inference
```powershell
python scripts/run_inference.py path/to/image.png --model depth_anything --output output/depth.npy
```

---

## Project Structure

```text
SIH_PS_175/
├── api/                    # FastAPI web server and routes
│   ├── routes/             # inference, calibration, dsm, validation, visualization
│   ├── schemas/            # Pydantic request/response schemas
│   ├── main.py             # FastAPI entrypoint and CORS config
│   └── services.py         # Async job queue and pipeline orchestration
├── configs/                # Pipeline configurations (default.yaml)
├── data/                   # Data storage (raw, processed)
├── docs/                   # Technical documentation
├── frontend/               # Vite + React + Three.js application
├── models/
│   ├── checkpoints/        # Local TorchScript models (.pt) [ignored in git]
│   └── pretrained/         # Official PyTorch weights (.pth) [ignored in git]
├── output/                 # API job artifacts and CLI outputs
├── scripts/                # Standalone CLI tools
├── src/                    # Core scientific algorithms & processing library
│   ├── calibration/        # GCP, SRTM alignment, Huber scale-shift calibration
│   ├── depth/              # Depth Anything adapter and model factory
│   ├── dsm/                # DSM generation, hole filling, outlier filtering
│   ├── geospatial/         # CRS, GeoTIFF, rasterization, reprojection
│   ├── io/                 # Image, GeoTIFF, and HDF5 loaders
│   ├── mesh/               # Heightfield, terrain mesh, LOD, and GLB export
│   ├── preprocessing/      # Tiling, normalization, and augmentation
│   └── validation/         # Accuracy metrics (MAE, RMSE, LE90)
├── tests/                  # Automated pytest test suite
├── .env.example            # Documented environment template
├── pyproject.toml          # Package metadata and test configuration
└── requirements.txt        # Python package dependencies
```
