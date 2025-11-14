@echo off
REM Workflow Bridge Startup Script for Windows
REM This script starts both backend and frontend

echo.
echo ========================================
echo   Starting Workflow Bridge Application
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

REM Start Backend
echo [1/2] Starting Backend...
cd automation-chatbot-backend

REM Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment and start backend
call venv\Scripts\activate
echo Installing/checking dependencies...
pip install -r requirements.txt > nul 2>&1

echo Starting backend on http://localhost:8000
start "Workflow Bridge Backend" cmd /k "venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

cd ..
timeout /t 5 /nobreak > nul

REM Start Frontend
echo [2/2] Starting Frontend...
cd automation-chatbot-frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Starting frontend on http://localhost:5173
start "Workflow Bridge Frontend" cmd /k "npm run dev"

cd ..

echo.
echo ========================================
echo   Application Started Successfully!
echo ========================================
echo.
echo Frontend:  http://localhost:5173
echo Backend:   http://localhost:8000
echo API Docs:  http://localhost:8000/docs
echo Test Page: http://localhost:5173/test
echo.
echo Two new terminal windows have opened:
echo   1. Backend (FastAPI)
echo   2. Frontend (Vite)
echo.
echo Close those windows to stop the servers.
echo.
echo Opening test page in your browser...
timeout /t 3 /nobreak > nul

REM Open test page in default browser
start http://localhost:5173/test

echo.
echo Ready! Press any key to exit this window...
pause > nul

