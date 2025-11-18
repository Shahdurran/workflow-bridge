@echo off
REM Workflow Bridge - Clean Start Script
REM Kills all existing instances and starts fresh

echo.
echo ========================================
echo   Workflow Bridge - Clean Restart
echo ========================================
echo.

REM Change to project directory
cd /d "%~dp0"

echo [1/4] Stopping existing services...
echo.

REM Kill all Node.js processes (Frontend and n8n-mcp)
echo Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   - Node.js processes stopped
) else (
    echo   - No Node.js processes found
)

REM Kill all Python/Uvicorn processes (Backend)
echo Stopping Python processes...
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   - Python processes stopped
) else (
    echo   - No Python processes found
)

REM Kill specific ports if still in use
echo Checking for processes on required ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo   - Killing process on port 8000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo   - Killing process on port 3001 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo   - Killing process on port 5173 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Waiting for ports to clear...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo [2/4] Starting Backend (FastAPI)...
echo ========================================
echo.

cd automation-chatbot-backend

REM Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment!
        pause
        exit /b 1
    )
)

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Creating .env from template...
    copy env.example .env >nul
    echo.
    echo IMPORTANT: Please edit automation-chatbot-backend\.env
    echo Add your API keys before the backend will work properly.
    echo.
)

echo Starting backend on http://localhost:8000
start "Workflow Bridge - Backend" cmd /k "cd /d "%~dp0automation-chatbot-backend" && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

cd ..
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo [3/4] Starting n8n MCP Server...
echo ========================================
echo.

REM Check if n8n-mcp exists
if not exist "n8n-mcp" (
    echo ERROR: n8n-mcp directory not found!
    echo Please run: .\SETUP_N8N_MCP.ps1
    set SKIP_N8N=1
) else if not exist "n8n-mcp\dist" (
    echo ERROR: n8n-mcp not built!
    echo Please run: cd n8n-mcp && npm run build
    set SKIP_N8N=1
) else (
    echo Starting n8n MCP on http://localhost:3001
    start "Workflow Bridge - n8n MCP" cmd /k "cd /d "%~dp0n8n-mcp" && set MCP_MODE=http && set PORT=3001 && set USE_FIXED_HTTP=true && set AUTH_TOKEN=aB3dE7fG9hJ2kL4mN6pQ8rS0tU5vW1xY && node dist/mcp/index.js"
    set SKIP_N8N=0
)

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo [4/4] Starting Frontend (Vite)...
echo ========================================
echo.

cd automation-chatbot-frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo Starting frontend on http://localhost:5173
start "Workflow Bridge - Frontend" cmd /k "cd /d "%~dp0automation-chatbot-frontend" && npm run dev"

cd ..
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   All Services Started!
echo ========================================
echo.
echo Services running:
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
if "%SKIP_N8N%"=="0" (
    echo   n8n MCP:   http://localhost:3001
    echo   n8n Chat:  http://localhost:5173/n8n-chat
)
echo.
echo Three command windows have opened (check taskbar):
echo   1. Backend (FastAPI)
echo   2. Frontend (Vite)
if "%SKIP_N8N%"=="0" (
    echo   3. n8n MCP Server
)
echo.
echo Close those windows to stop the services.
echo.
echo Opening application in browser...
timeout /t 3 /nobreak >nul

REM Open in browser
start http://localhost:5173

echo.
echo ========================================
echo   Ready! Press any key to exit
echo ========================================
echo.
pause >nul






