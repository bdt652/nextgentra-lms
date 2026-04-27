#!/bin/sh
set -e

echo "=== LMS Backend Startup ==="

# Install Prisma CLI if not present (for query engine)
pip install -q prisma

# Generate Prisma client (downloads query engine)
echo "Generating Prisma client..."
prisma generate

# Start application
echo "Starting backend..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
