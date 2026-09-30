# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build Frontend (Vite + React + Three.js)
# ==============================================================================
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Install dependencies using lockfile
COPY frontend/package*.json ./
RUN npm ci || npm install

# Build static bundle to /app/frontend/dist
COPY frontend/ ./
RUN npm run build


# ==============================================================================
# Stage 2: Production Python Runtime (CPU-optimized)
# ==============================================================================
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    DEPTH_CHECKPOINT=/app/models/checkpoints/depth_anything_v2_vits.pt \
    API_STORAGE_DIR=/app/output/api_jobs \
    FRONTEND_DIST_DIR=/app/frontend/dist

WORKDIR /app

# Install minimal OS dependencies for geospatial and network healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install lightweight PyTorch CPU build (~700MB vs ~3.5GB with CUDA)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir "torch>=2.0" --index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies (excluding torch to avoid PyPI overwrite)
COPY requirements.txt .
RUN grep -v "^torch" requirements.txt > requirements-docker.txt && \
    pip install --no-cache-dir -r requirements-docker.txt

# Copy backend source code and configurations
COPY api/ /app/api/
COPY src/ /app/src/
COPY configs/ /app/configs/
COPY scripts/ /app/scripts/
COPY pyproject.toml /app/pyproject.toml
COPY models/ /app/models/

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy entrypoint script and ensure executable permissions
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create required runtime directories and set up non-root user
RUN mkdir -p /app/output/api_jobs /app/models/checkpoints /app/models/pretrained /app/data/raw /app/data/processed && \
    useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
