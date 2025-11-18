# Service Status Checker for Workflow Bridge
# Checks if all required services are running

Write-Host ""
Write-Host "========================================"
Write-Host "  Workflow Bridge - Service Status"
Write-Host "========================================"
Write-Host ""

$services = @{
    "Backend (FastAPI)" = "http://localhost:8000/health"
    "Frontend (Vite)" = "http://localhost:5173"
    "n8n MCP" = "http://localhost:3001"
}

function Test-ServiceEndpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "$Name : " -NoNewline -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "Running" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Not responding" -ForegroundColor Red
        return $false
    }
}

$allRunning = $true

foreach ($service in $services.GetEnumerator()) {
    $isRunning = Test-ServiceEndpoint -Name $service.Key -Url $service.Value
    if (-not $isRunning) {
        $allRunning = $false
    }
}

Write-Host ""
Write-Host "========================================"

if ($allRunning) {
    Write-Host "  All Services Running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access URLs:"
    Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Cyan
    Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  n8n Chat:  http://localhost:5173/n8n-chat" -ForegroundColor Cyan
} else {
    Write-Host "  Some Services Not Running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start all services, run:"
    Write-Host "  .\START_ALL.ps1" -ForegroundColor Cyan
}

Write-Host "========================================"
Write-Host ""
