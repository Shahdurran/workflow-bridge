@echo off
REM Workflow Bridge Complete Startup Script for Windows
REM This script starts Backend, Frontend, and n8n MCP

echo.
echo ========================================
echo   Starting Workflow Bridge - Full Stack
echo ========================================
echo.

REM Check if backend directory exists
if not exist "automation-chatbot-backend" (
    echo ERROR: Backend directory not found!
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "automation-chatbot-frontend" (
    echo ERROR: Frontend directory not found!
    pause
    exit /b 1
)

REM Check if n8n-mcp directory exists
if not exist "D:\workflow bridge\n8n-mcp" (
    echo WARNING: n8n-mcp directory not found at D:\workflow bridge\n8n-mcp
    echo Will skip n8n MCP startup
    set SKIP_N8N=1
) else (
    set SKIP_N8N=0
)

echo ========================================
echo [1/3] Starting Backend (FastAPI)...
echo ========================================
echo.
cd automation-chatbot-backend

REM Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment!
        echo Please ensure Python 3.11+ is installed.
        pause
        exit /b 1
    )
)

REM Activate virtual environment and start backend
call venv\Scripts\activate
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment!
    pause
    exit /b 1
)

echo Checking dependencies...
pip install -r requirements.txt --quiet
if errorlevel 1 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo Starting backend on http://localhost:8000
start "Workflow Bridge Backend" cmd /k "cd /d "%~dp0automation-chatbot-backend" && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

cd ..
timeout /t 3 /nobreak > nul

echo.
echo ========================================
echo [2/3] Starting Frontend (Vite + React)...
echo ========================================
echo.
cd automation-chatbot-frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies (this may take a few minutes)...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install npm dependencies!
        echo Please ensure Node.js 18+ is installed.
        pause
        exit /b 1
    )
)

echo Starting frontend on http://localhost:5173
start "Workflow Bridge Frontend" cmd /k "cd /d "%~dp0automation-chatbot-frontend" && npm run dev"

cd ..
timeout /t 3 /nobreak > nul

REM Start n8n MCP if directory exists
if "%SKIP_N8N%"=="0" (
    echo.
    echo ========================================
    echo [3/3] Starting n8n MCP (HTTP Mode)...
    echo ========================================
    echo.
    
    REM Check if n8n-mcp is built
    if not exist "D:\workflow bridge\n8n-mcp\dist" (
        echo WARNING: n8n-mcp dist folder not found!
        echo Please build n8n-mcp first: cd n8n-mcp && npm run build
        set SKIP_N8N=1
    ) else (
        echo Starting n8n MCP on http://localhost:3001
        start "n8n MCP Server" cmd /k "cd /d "D:\workflow bridge\n8n-mcp" && set MCP_MODE=http && set PORT=3001 && set USE_FIXED_HTTP=true && set AUTH_TOKEN=aB3dE7fG9hJ2kL4mN6pQ8rS0tU5vW1xY && node dist/mcp/index.js"
        timeout /t 3 /nobreak > nul
    )
) else (
    echo.
    echo [3/3] Skipping n8n MCP (not found)
)

echo.
echo ========================================
echo   All Services Started Successfully!
echo ========================================
echo.
echo Services running:
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo   Frontend:  http://localhost:5173
echo   Test Page: http://localhost:5173/test
if "%SKIP_N8N%"=="0" (
    echo   n8n MCP:   http://localhost:3001
)
echo.
echo Three new terminal windows have opened:
echo   1. Backend (FastAPI on port 8000)
echo   2. Frontend (Vite on port 5173)
if "%SKIP_N8N%"=="0" (
    echo   3. n8n MCP (HTTP server on port 3001)
)
echo.
echo Close those windows to stop the servers.
echo.
echo Opening application in your browser...
timeout /t 5 /nobreak > nul

REM Open application in default browser
start http://localhost:5173

echo.
echo ========================================
echo   Ready to use! 
echo ========================================
echo.
echo Press any key to exit this window...
echo (The services will continue running in their own windows)
pause > nul

