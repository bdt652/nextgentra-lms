# Start Development Environment - NextGenTra LMS
$ErrorActionPreference = "Stop"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  NextGenTra LMS - Development Environment" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$RootDir = Get-Location

# 1. Start Backend (Python FastAPI)
Write-Host "[1/3] Starting Backend API..." -ForegroundColor Yellow
$BackendDir = Join-Path $RootDir "backend-python"
if (Test-Path $BackendDir) {
    Push-Location $BackendDir
    
    # Check/Create virtual environment
    if (-not (Test-Path "venv")) {
        Write-Host "  Creating virtual environment..." -ForegroundColor Gray
        python -m venv venv
    }
    
    # Install dependencies if needed
    Write-Host "  Installing/Updating dependencies..." -ForegroundColor Gray
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt --quiet
    
    # Start backend
    Write-Host "  Starting FastAPI on port 8000..." -ForegroundColor Green
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd `"$PWD`"; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal
    
    Pop-Location
} else {
    Write-Host "  ✗ Backend directory not found!" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 2. Start Teacher Portal
Write-Host "[2/3] Starting Teacher Portal..." -ForegroundColor Yellow
$TeacherDir = Join-Path $RootDir "teacher-portal"
if (Test-Path $TeacherDir) {
    Push-Location $TeacherDir
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        npm install --silent
    }
    
    # Start teacher portal
    Write-Host "  Starting on port 3000..." -ForegroundColor Green
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd `"$PWD`"; npm run dev" -WindowStyle Normal
    
    Pop-Location
} else {
    Write-Host "  ✗ Teacher Portal directory not found!" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# 3. Start Student Portal
Write-Host "[3/3] Starting Student Portal..." -ForegroundColor Yellow
$StudentDir = Join-Path $RootDir "student-portal"
if (Test-Path $StudentDir) {
    Push-Location $StudentDir
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        npm install --silent
    }
    
    # Start student portal
    Write-Host "  Starting on port 3001..." -ForegroundColor Green
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd `"$PWD`"; npm run dev" -WindowStyle Normal
    
    Pop-Location
} else {
    Write-Host "  ✗ Student Portal directory not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "  All services started!" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor White
Write-Host "  Backend API:     http://localhost:8000" -ForegroundColor Gray
Write-Host "  API Docs:        http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  Teacher Portal:  http://localhost:3000" -ForegroundColor Gray
Write-Host "  Student Portal:  http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop: Close the terminal windows or press Ctrl+C" -ForegroundColor Yellow
Write-Host ""
