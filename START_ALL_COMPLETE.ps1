# Workflow Bridge Complete Startup Script - All Services
# This script starts Backend, Frontend, n8n MCP, and Make MCP

Write-Host ""
Write-Host "=============================================="
Write-Host "  Starting Workflow Bridge - Complete Stack"
Write-Host "=============================================="
Write-Host ""

$ProjectRoot = "D:\workflow bridge\workflow-bridge"
$N8nMcpPath = "D:\workflow bridge\workflow-bridge\n8n-mcp"
$MakeMcpPath = "D:\workflow bridge\workflow-bridge\make-mcp"

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

# Check if make-mcp directory exists
$SkipMake = $false
if (-not (Test-Path $MakeMcpPath)) {
    Write-Host "WARNING: make-mcp directory not found at $MakeMcpPath" -ForegroundColor Yellow
    Write-Host "Will skip Make MCP startup"
    $SkipMake = $true
}

Write-Host "=============================================="
Write-Host "[1/4] Starting Backend (FastAPI)..."
Write-Host "=============================================="
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
Write-Host "=============================================="
Write-Host "[2/4] Starting Frontend (Vite + React)..."
Write-Host "=============================================="
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
    Write-Host "=============================================="
    Write-Host "[3/4] Starting n8n MCP (HTTP Mode)..."
    Write-Host "=============================================="
    Write-Host ""
    
    Set-Location $N8nMcpPath
    
    # Check if node_modules exists
    if (-not (Test-Path "$N8nMcpPath\node_modules")) {
        Write-Host "Installing n8n-mcp dependencies..." -ForegroundColor Cyan
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Failed to install n8n-mcp dependencies!" -ForegroundColor Yellow
            $SkipN8n = $true
        }
    }
    
    # Check if dist exists, if not build
    if (-not (Test-Path "$N8nMcpPath\dist")) {
        Write-Host "Building n8n-mcp..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Failed to build n8n-mcp!" -ForegroundColor Yellow
            $SkipN8n = $true
        }
    }
    
    if (-not $SkipN8n) {
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
    Write-Host "[3/4] Skipping n8n MCP (not found)"
}

# Start Make MCP if directory exists
if (-not $SkipMake) {
    Write-Host ""
    Write-Host "=============================================="
    Write-Host "[4/4] Starting Make MCP (HTTP Mode)..."
    Write-Host "=============================================="
    Write-Host ""
    
    Set-Location $MakeMcpPath
    
    # Check if node_modules exists
    if (-not (Test-Path "$MakeMcpPath\node_modules")) {
        Write-Host "Installing make-mcp dependencies..." -ForegroundColor Cyan
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Failed to install make-mcp dependencies!" -ForegroundColor Yellow
            $SkipMake = $true
        }
    }
    
    # Check if dist exists, if not build
    if (-not (Test-Path "$MakeMcpPath\dist")) {
        Write-Host "Building make-mcp..." -ForegroundColor Cyan
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Failed to build make-mcp!" -ForegroundColor Yellow
            $SkipMake = $true
        }
    }
    
    if (-not $SkipMake) {
        Write-Host "Starting Make MCP on http://localhost:3002" -ForegroundColor Green
        
        $makeScript = @"
cd '$MakeMcpPath'
`$env:MCP_MODE='http'
`$env:PORT='3002'
`$env:AUTH_TOKEN='aB3dE7fG9hJ2kL4mN6pQ8rS0tU5vW1xY'
node dist/index.js
"@
        
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $makeScript
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host ""
    Write-Host "[4/4] Skipping Make MCP (not found)"
}

Write-Host ""
Write-Host "=============================================="
Write-Host "  All Services Started Successfully!"
Write-Host "=============================================="
Write-Host ""
Write-Host "Services running:" -ForegroundColor Green
Write-Host "  Backend:   http://localhost:8000"
Write-Host "  API Docs:  http://localhost:8000/docs"
Write-Host "  Frontend:  http://localhost:5173"
Write-Host "  Test Page: http://localhost:5173/test"
if (-not $SkipN8n) {
    Write-Host "  n8n MCP:   http://localhost:3001"
}
if (-not $SkipMake) {
    Write-Host "  Make MCP:  http://localhost:3002"
}
Write-Host ""
Write-Host "Terminal windows opened:" -ForegroundColor Cyan
Write-Host "  1. Backend (FastAPI on port 8000)"
Write-Host "  2. Frontend (Vite on port 5173)"
if (-not $SkipN8n) {
    Write-Host "  3. n8n MCP (HTTP server on port 3001)"
}
if (-not $SkipMake) {
    Write-Host "  4. Make MCP (HTTP server on port 3002)"
}
Write-Host ""
Write-Host "Close those windows to stop the servers."
Write-Host ""
Write-Host "Opening application in your browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Open application in default browser
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "=============================================="
Write-Host "  Ready to use!"
Write-Host "=============================================="
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Yellow
Write-Host "(The services will continue running in their own windows)"
Read-Host

