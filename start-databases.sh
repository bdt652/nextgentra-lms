#!/bin/bash
# Bash script to start PostgreSQL and Redis databases for LMS development

echo "Starting PostgreSQL and Redis containers..." | \033[0;32m

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running or not accessible." | \033[0;31m
    echo "Please start Docker Desktop and try again." | \033[0;33m
    exit 1
fi

# Navigate to backend-python directory
cd backend-python

# Start all services
docker-compose up -d

# Wait for PostgreSQL
echo "" | \033[0;33m
echo "Waiting for services to start..." | \033[0;33m
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

# Wait for Redis
attempt=0
while [ $attempt -lt $max_attempts ]; do
    result=$(docker-compose exec -T redis redis-cli ping 2>/dev/null)
    if [ "$result" = "PONG" ]; then
        echo "Redis is ready!" | \033[0;32m
        break
    fi
    attempt=$((attempt + 1))
    echo "Attempt $attempt/$max_attempts - Redis not ready yet, waiting 2s..." | \033[0;90m
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "WARNING: Redis did not become ready within expected time." | \033[0;33m
fi

echo "" | \033[0;32m
echo "✅ All services started successfully!" | \033[0;32m
echo "" | \033[0;36m
echo "📋 Service Status:" | \033[0;36m
echo "   PostgreSQL: localhost:5432" | \033[0;37m
echo "     Database: lms_db" | \033[0;37m
echo "     Username: appuser" | \033[0;37m
echo "     Password: Thang_652123" | \033[0;37m
echo "   Redis: localhost:6379" | \033[0;37m
echo "" | \033[0;32m
echo "🔧 Next steps:" | \033[0;32m
echo "1. Generate Prisma client: cd backend-python && python -m prisma generate" | \033[0;37m
echo "2. Run migrations: cd backend-python && python -m prisma migrate deploy" | \033[0;37m
echo "3. Start backend: cd backend-python && uvicorn app.main:app --reload --port 8000" | \033[0;37m
echo "" | \033[0;33m
echo "📝 To stop all services: docker-compose down" | \033[0;33m
echo "   (keeps data volumes)" | \033[0;90m
echo "📝 To stop and delete data: docker-compose down -v" | \033[0;33m
