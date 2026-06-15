#!/usr/bin/env bash
set -euo pipefail

exec gunicorn \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 2 \
  --bind "0.0.0.0:${PORT:-8000}" \
  backend.app.main:app
