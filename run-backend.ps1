# Backend startup script for Windows PowerShell

$backendPath = "$PSScriptRoot\backend"
$venvPath = "$backendPath\venv\Scripts\Activate.ps1"

Write-Host "Starting Aziza Events Backend..." -ForegroundColor Green
Write-Host ""

# Check if venv exists
if (-not (Test-Path $venvPath)) {
    Write-Host "ERROR: Virtual environment not found at $venvPath" -ForegroundColor Red
    Write-Host "Run this first:" -ForegroundColor Yellow
    Write-Host "  cd backend"
    Write-Host "  python -m venv venv"
    Write-Host "  .\venv\Scripts\Activate.ps1"
    Write-Host "  pip install -r requirements.txt"
    exit 1
}

# Activate venv
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& $venvPath

# Run server
Write-Host "Starting Django development server..." -ForegroundColor Cyan
Write-Host "Backend will be available at: http://localhost:8000/api" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

cd $backendPath
python manage.py runserver
