# Frontend startup script for Windows PowerShell

$frontendPath = "$PSScriptRoot\frontend"
$nodeModulesPath = "$frontendPath\node_modules"

Write-Host "Starting Aziza Events Frontend..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    cd $frontendPath
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
}

# Run dev server
Write-Host "Starting React development server..." -ForegroundColor Cyan
Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

cd $frontendPath
npm run dev
