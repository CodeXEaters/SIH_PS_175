#!/bin/sh
set -e

# Verify or download checkpoint if needed
python scripts/download_model.py

# Ensure runtime directories exist
mkdir -p output/api_jobs models/checkpoints models/pretrained data/raw data/processed

# Read PORT from environment (default to 8000)
PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"
WORKERS="${WEB_CONCURRENCY:-1}"

echo "=================================================="
echo "Starting DepthWizard Unified Server"
echo "Host:    $HOST"
echo "Port:    $PORT"
echo "Workers: $WORKERS"
echo "=================================================="

exec uvicorn api.main:app --host "$HOST" --port "$PORT" --workers "$WORKERS"
