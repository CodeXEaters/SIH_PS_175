# DepthWizard Production Deployment Guide

DepthWizard is packaged as a unified, production-ready system where the FastAPI backend and compiled React + Three.js frontend are served together from a single high-performance container.

---

## 1. Deployment Architecture

```
                    Internet / User Requests
                                │
                                ▼
                   ┌──────────────────────────┐
                   │    Docker Container      │
                   │    (Port $PORT: 8000)    │
                   │                          │
                   │  ┌────────────────────┐  │
                   │  │  FastAPI (Uvicorn) │  │
                   │  └────┬───────────┬───┘  │
                   │       │           │      │
     ┌─────────────┴───────▼────┐      ▼──────┴──────────────────┐
     │ Frontend SPA Assets      │      │ Async Pipeline Engine   │
     │ /        -> index.html   │      │ /health                 │
     │ /assets/ -> static files │      │ /inference              │
     │ /*       -> SPA router   │      │ /calibration /dsm /etc  │
     └──────────────────────────┘      └────────────┬────────────┘
                                                    │
                                      ┌─────────────▼────────────┐
                                      │ Depth Anything V2 (CPU)  │
                                      │ models/checkpoints/*.pt  │
                                      └──────────────────────────┘
```

### Key Architectural Advantages
- **Single Port & Unified Origin**: Eliminates CORS latency and configuration issues.
- **CPU-Optimized PyTorch**: Installed directly from PyTorch's official CPU wheel index, slashing container size from **~3.5 GB down to ~800 MB**.
- **Dynamic Port Assignment**: Automatically reads `$PORT` (compatible with Render, Railway, Google Cloud Run, and AWS).
- **Persistent Volume Support**: Uploads and generated meshes (`output/api_jobs`) and checkpoints (`models/checkpoints`) persist across container restarts.

---

## 2. Quick Deploy with Docker

### Option A: Using Docker Compose (Recommended for Local / VPS)

1. Make sure you have your model checkpoint ready in `models/checkpoints/depth_anything_v2_vits.pt`.
2. Start the service:
   ```bash
   docker compose up -d --build
   ```
3. Check container logs:
   ```bash
   docker compose logs -f
   ```
4. Access the application:
   - **Web UI & 3D Viewer**: [http://localhost:8000](http://localhost:8000)
   - **Health Endpoint**: [http://localhost:8000/health](http://localhost:8000/health)
   - **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the service:
```bash
docker compose down
```

---

### Option B: Using Standalone Docker CLI

#### 1. Build the Image
```bash
docker build -t depthwizard:latest .
```

#### 2. Run the Container
```bash
docker run -d \
  --name depthwizard-app \
  -p 8000:8000 \
  -e PORT=8000 \
  -v "$(pwd)/output/api_jobs:/app/output/api_jobs" \
  -v "$(pwd)/models/checkpoints:/app/models/checkpoints" \
  depthwizard:latest
```

---

## 3. Model Checkpoint Management in Production

The Depth Anything V2 TorchScript checkpoint (`depth_anything_v2_vits.pt`, ~95 MB) is required for running depth inference.

Because large binary weights are excluded from Git repositories (`.gitignore`), choose one of the following methods for production:

### Method 1: Mount Local Checkpoints (VPS / EC2 / Local Server)
Mount your local checkpoint folder into the container:
```bash
-v /path/to/models/checkpoints:/app/models/checkpoints
```

### Method 2: Automatic Download via Environment Variable (Cloud PaaS)
If deploying directly from a GitHub repository to Render, Railway, or Cloud Run, set the `DEPTH_MODEL_URL` environment variable:
```env
DEPTH_MODEL_URL=https://your-storage-bucket.com/depth_anything_v2_vits.pt
```
On container startup, `scripts/download_model.py` automatically downloads and verifies the model into `models/checkpoints/depth_anything_v2_vits.pt`.

---

## 4. Cloud Platform Deployment Guides

### A. Deploy to Render (render.com)

Render automatically detects `Dockerfile` and `render.yaml`.

1. Push your repository to GitHub or GitLab.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** -> **Blueprint**, and select your repository (it will read `render.yaml`).
   *Alternatively*: Click **New +** -> **Web Service**, select **Docker** environment.
4. Set Environment Variables:
   - `DEPTH_MODEL_URL`: *(Optional)* Direct download link for `depth_anything_v2_vits.pt`.
   - `API_MAX_UPLOAD_BYTES`: `52428800` (50MB)
5. Select a plan with at least **1 GB RAM** (Standard or Starter recommended for CPU inference).
6. Click **Deploy**. Render provides an HTTPS URL automatically.

---

### B. Deploy to Railway (railway.app)

1. Install the Railway CLI or connect via the web dashboard.
2. Link your repository:
   ```bash
   railway init
   ```
3. Set environment variables:
   ```bash
   railway variables set DEPTH_MODEL_URL="https://your-storage-bucket.com/depth_anything_v2_vits.pt"
   ```
4. Deploy the service:
   ```bash
   railway up
   ```
   Railway automatically detects `Dockerfile` and builds using the CPU-optimized PyTorch instructions.

---

### C. Deploy to Google Cloud Run

Google Cloud Run offers serverless container execution with automatic scaling.

1. Build and push your image to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/depthwizard:latest
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy depthwizard \
     --image gcr.io/YOUR_PROJECT_ID/depthwizard:latest \
     --platform managed \
     --region us-central1 \
     --memory 2Gi \
     --cpu 2 \
     --timeout 300 \
     --allow-unauthenticated
   ```

---

### D. Deploy to AWS EC2 or Any Ubuntu/Debian VPS

1. SSH into your VPS:
   ```bash
   ssh ubuntu@your-server-ip
   ```
2. Install Docker and Docker Compose:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-v2
   sudo usermod -aG docker $USER
   ```
3. Clone your repository:
   ```bash
   git clone https://github.com/CodeXEaters/SIH_PS_175.git
   cd SIH_PS_175
   ```
4. Copy your model checkpoint into `models/checkpoints/`:
   ```bash
   mkdir -p models/checkpoints
   # upload or download depth_anything_v2_vits.pt into models/checkpoints/
   ```
5. Start the container in detached mode:
   ```bash
   docker compose up -d --build
   ```
6. (Optional) Set up Nginx reverse proxy with SSL via Let's Encrypt (Certbot).

---

## 5. Environment Variables Reference

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8000` | Port for the Uvicorn web server (automatically set on cloud hosts). |
| `HOST` | `0.0.0.0` | Bind host address. |
| `WEB_CONCURRENCY` | `1` | Number of Uvicorn worker processes (1-2 recommended for CPU). |
| `DEPTH_CHECKPOINT` | `/app/models/checkpoints/depth_anything_v2_vits.pt` | Path to TorchScript model weights. |
| `DEPTH_MODEL_URL` | *(None)* | URL to auto-download model checkpoint if absent. |
| `API_STORAGE_DIR` | `/app/output/api_jobs` | Working directory for job uploads and generated outputs. |
| `API_MAX_UPLOAD_BYTES` | `52428800` (50 MB) | Maximum upload file size limit. |
| `API_CORS_ORIGINS` | `*` | Comma-separated list of allowed CORS origins. |
| `FRONTEND_DIST_DIR` | `/app/frontend/dist` | Directory containing compiled React static files. |

---

## 6. Health & Diagnostic Endpoints

- **Liveness / Readiness Probe**: `GET /health`
  ```json
  {"status": "ok", "service": "depth-workflow-api"}
  ```
- **OpenAPI Schema**: `GET /openapi.json`
- **Interactive Documentation**: `GET /docs`
