# Service Status Checker for Workflow Bridge

Write-Host ""
Write-Host "=============================================="
Write-Host "  Workflow Bridge - Service Status Check"
Write-Host "=============================================="
Write-Host ""

$services = @(
    @{ Name = "Backend (FastAPI)"; Port = 8000; Path = "/health" },
    @{ Name = "Frontend (Vite)"; Port = 5173; Path = "/" },
    @{ Name = "n8n MCP"; Port = 3001; Path = "/" },
    @{ Name = "Make MCP"; Port = 3002; Path = "/" }
)

foreach ($service in $services) {
    Write-Host -NoNewline "Checking $($service.Name) on port $($service.Port)... "
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Path)" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✓ RUNNING" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ NOT RESPONDING" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=============================================="
Write-Host "  Service URLs"
Write-Host "=============================================="
Write-Host ""
Write-Host "Backend:   http://localhost:8000"
Write-Host "API Docs:  http://localhost:8000/docs"
Write-Host "Frontend:  http://localhost:5173"
Write-Host "n8n MCP:   http://localhost:3001"
Write-Host "Make MCP:  http://localhost:3002"
Write-Host ""
