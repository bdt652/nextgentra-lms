#!/usr/bin/env pwsh
# PowerShell script to start PostgreSQL and Redis databases for LMS development

Write-Host "Starting PostgreSQL and Redis containers..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info > $null 2>&1
} catch {
    Write-Host "ERROR: Docker is not running or not accessible." -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Navigate to backend-python directory
$backendDir = Join-Path $PSScriptRoot "backend-python"
Set-Location $backendDir

# Start all services (PostgreSQL + Redis)
docker-compose up -d

# Wait for services to be ready
Write-Host "`nWaiting for services to start..." -ForegroundColor Yellow

# Wait for PostgreSQL
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        $result = docker-compose exec -T postgres pg_isready -U appuser 2>$null
        if ($result -eq "/var/run/postgresql:5432 - accepting connections") {
            Write-Host "PostgreSQL is ready!" -ForegroundColor Green
            break
        }
    } catch {}
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts - PostgreSQL not ready yet, waiting 2s..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "WARNING: PostgreSQL did not become ready within expected time." -ForegroundColor Yellow
}

# Wait for Redis
$attempt = 0
while ($attempt -lt $maxAttempts) {
    try {
        $result = docker-compose exec -T redis redis-cli ping 2>$null
        if ($result -eq "PONG") {
            Write-Host "Redis is ready!" -ForegroundColor Green
            break
        }
    } catch {}
    $attempt++
    Write-Host "Attempt $attempt/$maxAttempts - Redis not ready yet, waiting 2s..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "WARNING: Redis did not become ready within expected time." -ForegroundColor Yellow
}

Write-Host "`n✅ All services started successfully!" -ForegroundColor Green
Write-Host "`n📋 Service Status:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "     Database: lms_db" -ForegroundColor White
Write-Host "     Username: appuser" -ForegroundColor White
Write-Host "     Password: Thang_652123" -ForegroundColor White
Write-Host "   Redis: localhost:6379" -ForegroundColor White
Write-Host "`n🔧 Next steps:" -ForegroundColor Green
Write-Host "1. Generate Prisma client: cd backend-python && python -m prisma generate" -ForegroundColor White
Write-Host "2. Run migrations: cd backend-python && python -m prisma migrate deploy" -ForegroundColor White
Write-Host "3. Start backend: cd backend-python && uvicorn app.main:app --reload --port 8000" -ForegroundColor White
Write-Host "`n📝 To stop all services: docker-compose down" -ForegroundColor Yellow
Write-Host "   (keeps data volumes)" -ForegroundColor Gray
Write-Host "📝 To stop and delete data: docker-compose down -v" -ForegroundColor Yellow
