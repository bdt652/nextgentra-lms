#!/usr/bin/env pwsh
# PowerShell script to start PostgreSQL database for LMS development

Write-Host "Starting PostgreSQL container..." -ForegroundColor Green

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

# Start PostgreSQL container
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
Write-Host "`nWaiting for PostgreSQL to start..." -ForegroundColor Yellow
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

Write-Host "`nPostgreSQL container started at: localhost:5432" -ForegroundColor Cyan
Write-Host "Database: lms_db" -ForegroundColor Cyan
Write-Host "Username: appuser" -ForegroundColor Cyan
Write-Host "Password: Thang_652123" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Green
Write-Host "1. Generate Prisma client: cd backend-python && python -m prisma generate" -ForegroundColor White
Write-Host "2. Run migrations: cd backend-python && python -m prisma migrate dev --name init" -ForegroundColor White
