#!/usr/bin/env sh
set -eu

echo "Running database migrations..."
alembic upgrade head

echo "Seeding initial data (idempotent)..."
python -m app.services.seed

PORT="${PORT:-8000}"
echo "Starting API on port ${PORT}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
