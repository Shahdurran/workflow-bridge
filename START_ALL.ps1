# Workflow Bridge Complete Startup Script for Windows (PowerShell)
# This script starts Backend, Frontend, and n8n MCP

Write-Host ""
Write-Host "========================================"
Write-Host "  Starting Workflow Bridge - Full Stack"
Write-Host "========================================"
Write-Host ""

$ProjectRoot = "D:\workflow bridge\workflow-bridge"
$N8nMcpPath = "D:\workflow bridge\workflow-bridge\n8n-mcp"

# Check if backend directory exists
if (-not (Test-Path "$ProjectRoot\automation-chatbot-backend")) {
    Write-Host "ERROR: Backend directory not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if frontend directory exists
if (-not (Test-Path "$ProjectRoot\automation-chatbot-frontend")) {
    Write-Host "ERROR: Frontend directory not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if n8n-mcp directory exists
$SkipN8n = $false
if (-not (Test-Path $N8nMcpPath)) {
    Write-Host "WARNING: n8n-mcp directory not found at $N8nMcpPath" -ForegroundColor Yellow
    Write-Host "Will skip n8n MCP startup"
    $SkipN8n = $true
}

Write-Host "========================================"
Write-Host "[1/3] Starting Backend (FastAPI)..."
Write-Host "========================================"
Write-Host ""

Set-Location "$ProjectRoot\automation-chatbot-backend"

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create virtual environment!" -ForegroundColor Red
        Write-Host "Please ensure Python 3.11+ is installed."
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Checking dependencies..." -ForegroundColor Cyan
& ".\venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet

Write-Host "Starting backend on http://localhost:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\automation-chatbot-backend'; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================"
Write-Host "[2/3] Starting Frontend (Vite + React)..."
Write-Host "========================================"
Write-Host ""

Set-Location "$ProjectRoot\automation-chatbot-frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies (this may take a few minutes)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install npm dependencies!" -ForegroundColor Red
        Write-Host "Please ensure Node.js 18+ is installed."
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "Starting frontend on http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\automation-chatbot-frontend'; npm run dev"

Start-Sleep -Seconds 3

# Start n8n MCP if directory exists
if (-not $SkipN8n) {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "[3/3] Starting n8n MCP (HTTP Mode)..."
    Write-Host "========================================"
    Write-Host ""
    
    # Check if n8n-mcp is built
    if (-not (Test-Path "$N8nMcpPath\dist")) {
        Write-Host "WARNING: n8n-mcp dist folder not found!" -ForegroundColor Yellow
        Write-Host "Please build n8n-mcp first: cd n8n-mcp && npm run build"
        $SkipN8n = $true
    } else {
        Write-Host "Starting n8n MCP on http://localhost:3001" -ForegroundColor Green
        
        $n8nScript = @"
cd '$N8nMcpPath'
`$env:MCP_MODE='http'
`$env:PORT='3001'
`$env:USE_FIXED_HTTP='true'
`$env:AUTH_TOKEN='aB3dE7fG9hJ2kL4mN6pQ8rS0tU5vW1xY'
node dist/mcp/index.js
"@
        
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $n8nScript
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host ""
    Write-Host "[3/3] Skipping n8n MCP (not found)"
}

Write-Host ""
Write-Host "========================================"
Write-Host "  All Services Started Successfully!"
Write-Host "========================================"
Write-Host ""
Write-Host "Services running:" -ForegroundColor Green
Write-Host "  Backend:   http://localhost:8000"
Write-Host "  API Docs:  http://localhost:8000/docs"
Write-Host "  Frontend:  http://localhost:5173"
Write-Host "  Test Page: http://localhost:5173/test"
if (-not $SkipN8n) {
    Write-Host "  n8n MCP:   http://localhost:3001"
}
Write-Host ""
Write-Host "Three new terminal windows have opened:"
Write-Host "  1. Backend (FastAPI on port 8000)"
Write-Host "  2. Frontend (Vite on port 5173)"
if (-not $SkipN8n) {
    Write-Host "  3. n8n MCP (HTTP server on port 3001)"
}
Write-Host ""
Write-Host "Close those windows to stop the servers."
Write-Host ""
Write-Host "Opening application in your browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Open application in default browser
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================"
Write-Host "  Ready to use!"
Write-Host "========================================"
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Yellow
Write-Host "(The services will continue running in their own windows)"
Read-Host

