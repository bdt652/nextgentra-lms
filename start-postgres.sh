#!/bin/bash
# Bash script to start PostgreSQL database for LMS development

echo "Starting PostgreSQL container..." | \033[0;32m
# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running or not accessible." | \033[0;31m
    echo "Please start Docker Desktop and try again." | \033[0;33m
    exit 1
fi

# Navigate to backend-python directory
cd backend-python

# Start PostgreSQL container
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo ""
echo "Waiting for PostgreSQL to start..." | \033[0;33m
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    result=$(docker-compose exec -T postgres pg_isready -U appuser 2>/dev/null)
    if [ "$result" = "/var/run/postgresql:5432 - accepting connections" ]; then
        echo "PostgreSQL is ready!" | \033[0;32m
        break
    fi
    attempt=$((attempt + 1))
    echo "Attempt $attempt/$max_attempts - PostgreSQL not ready yet, waiting 2s..." | \033[0;90m
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "WARNING: PostgreSQL did not become ready within expected time." | \033[0;33m
fi

echo ""
echo "PostgreSQL container started at: localhost:5432" | \033[0;36m
echo "Database: lms_db" | \033[0;36m
echo "Username: appuser" | \033[0;36m
echo "Password: Thang_652123" | \033[0;36m
echo ""
echo "Next steps:" | \033[0;32m
echo "1. Generate Prisma client: cd backend-python && python -m prisma generate" | \033[0;37m
echo "2. Run migrations: cd backend-python && python -m prisma migrate dev --name init" | \033[0;37m
