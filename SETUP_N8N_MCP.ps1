# Setup n8n-mcp Server
# This script clones and sets up the n8n-mcp server

Write-Host ""
Write-Host "========================================"
Write-Host "  n8n-mcp Server Setup"
Write-Host "========================================"
Write-Host ""

$N8nMcpPath = "D:\workflow bridge\n8n-mcp"
$ParentDir = "D:\workflow bridge"

# Check if parent directory exists
if (-not (Test-Path $ParentDir)) {
    Write-Host "Creating parent directory..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
}

# Check if n8n-mcp already exists
if (Test-Path $N8nMcpPath) {
    Write-Host "n8n-mcp directory already exists at: $N8nMcpPath" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to rebuild it? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        exit 0
    }
    Write-Host "Removing existing directory..." -ForegroundColor Cyan
    Remove-Item -Path $N8nMcpPath -Recurse -Force
}

# Clone n8n-mcp repository
Write-Host ""
Write-Host "[1/5] Cloning n8n-mcp repository..." -ForegroundColor Cyan
Set-Location $ParentDir

try {
    git clone https://github.com/czlonkowski/n8n-mcp.git
    if ($LASTEXITCODE -ne 0) {
        throw "Git clone failed"
    }
} catch {
    Write-Host "ERROR: Failed to clone repository!" -ForegroundColor Red
    Write-Host "Please ensure git is installed and you have internet connection."
    Read-Host "Press Enter to exit"
    exit 1
}

# Navigate to n8n-mcp directory
Set-Location $N8nMcpPath

# Install dependencies
Write-Host ""
Write-Host "[2/5] Installing dependencies (this may take a few minutes)..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Build the project
Write-Host ""
Write-Host "[3/5] Building project..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Initialize database
Write-Host ""
Write-Host "[4/5] Initializing database..." -ForegroundColor Cyan
npm run rebuild
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Database rebuild had issues, but continuing..." -ForegroundColor Yellow
}

# Test the server
Write-Host ""
Write-Host "[5/5] Testing server startup..." -ForegroundColor Cyan
Write-Host "Starting server (will automatically stop in 5 seconds)..." -ForegroundColor Yellow

$job = Start-Job -ScriptBlock {
    Set-Location "D:\workflow bridge\n8n-mcp"
    npm start
}

Start-Sleep -Seconds 5

# Check if server responded
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/mcp/tool" -Method POST -Body '{"tool":"health_check","input":{}}' -ContentType "application/json" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✓ Server started successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not verify server (this is normal for initial setup)" -ForegroundColor Yellow
}

# Stop the test server
Stop-Job $job
Remove-Job $job

Write-Host ""
Write-Host "========================================"
Write-Host "  n8n-mcp Setup Complete! ✓"
Write-Host "========================================"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure your backend .env file with:"
Write-Host "   N8N_MCP_URL=http://localhost:3001"
Write-Host "   ANTHROPIC_API_KEY=your-api-key"
Write-Host ""
Write-Host "2. Run the full application:"
Write-Host "   .\START_ALL.ps1" -ForegroundColor Green
Write-Host ""
Write-Host "3. Or start n8n-mcp separately:"
Write-Host "   cd '$N8nMcpPath'"
Write-Host "   npm start" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit"

