# Deployment

Install the Python dependencies from `requirements.txt`. A local TorchScript checkpoint can be loaded with `TorchScriptDepthModel.from_checkpoint` and runs on CUDA when available, otherwise CPU.

Keep model weights, DEMs, datasets, and generated outputs outside Git. Configure model, tiling, calibration, mesh, and nodata settings through `configs/default.yaml` or a validated equivalent.

The core package exposes Python functions and CLI scripts. FastAPI upload handling, job management, frontend rendering, and cloud infrastructure belong to their owning components and are intentionally outside this repository scope.
