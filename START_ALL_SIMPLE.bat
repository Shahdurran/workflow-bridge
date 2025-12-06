@echo off
SETLOCAL EnableDelayedExpansion

echo.
echo ================================================
echo   Starting Workflow Bridge - Complete Stack
echo ================================================
echo.

REM Get the script directory
set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"

echo ================================================
echo [1/4] Starting Backend (FastAPI)...
echo ================================================
echo.

set "BACKEND_PATH=%ROOT_DIR%\automation-chatbot-backend"
if not exist "%BACKEND_PATH%" (
    echo ERROR: Backend directory not found!
    pause
    exit /b 1
)

cd /d "%BACKEND_PATH%"
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Starting backend on http://localhost:8000
start "Backend" cmd /k "cd /d "%BACKEND_PATH%" && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
timeout /t 3 /nobreak 2>nul >nul

echo.
echo ================================================
echo [2/4] Starting Frontend (Vite + React)...
echo ================================================
echo.

set "FRONTEND_PATH=%ROOT_DIR%\automation-chatbot-frontend"
if not exist "%FRONTEND_PATH%" (
    echo ERROR: Frontend directory not found!
    pause
    exit /b 1
)

cd /d "%FRONTEND_PATH%"
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting frontend on http://localhost:5173
start "Frontend" cmd /k "cd /d "%FRONTEND_PATH%" && npm run dev"
timeout /t 3 /nobreak 2>nul >nul

echo.
echo ================================================
echo [3/4] Starting n8n MCP...
echo ================================================
echo.

set "N8N_PATH=%ROOT_DIR%\n8n-mcp"
if exist "%N8N_PATH%\dist" (
    echo Starting n8n MCP on http://localhost:3001
    start "n8n MCP" cmd /k "cd /d "%N8N_PATH%" && set MCP_MODE=http && set PORT=3001 && set USE_FIXED_HTTP=true && set AUTH_TOKEN=aB3dE7fG9hJ2kL4mN6pQ8rS0tU5vW1xY && node dist/mcp/index.js"
    timeout /t 3 /nobreak 2>nul >nul
) else (
    echo Skipping n8n MCP (not built)
)

echo.
echo ================================================
echo [4/4] Starting Make MCP...
echo ================================================
echo.

set "MAKE_PATH=%ROOT_DIR%\make-mcp"
if exist "%MAKE_PATH%\dist" (
    echo Starting Make MCP on http://localhost:3002
    start "Make MCP" cmd /k "cd /d "%MAKE_PATH%" && set MCP_MODE=http && set PORT=3002 && set AUTH_TOKEN=aB3dE7fG9hJ2kL4mN6pQ8rS0tU5vW1xY && node dist/index.js"
    timeout /t 3 /nobreak 2>nul >nul
) else (
    echo Skipping Make MCP (not built)
)

echo.
echo ================================================
echo   All Services Started!
echo ================================================
echo.
echo Services running:
echo   Backend:   http://localhost:8000
echo   Frontend:  http://localhost:5173
echo   n8n MCP:   http://localhost:3001
echo   Make MCP:  http://localhost:3002
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo Press any key to exit (services will keep running)...
pause 2>nul >nul

