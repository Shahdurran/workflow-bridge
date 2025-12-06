@echo off
REM Workflow Bridge - Check Service Status

echo.
echo ========================================
echo   Workflow Bridge - Service Status
echo ========================================
echo.

set BACKEND_RUNNING=0
set FRONTEND_RUNNING=0
set N8N_RUNNING=0

REM Check Backend (port 8000)
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Backend ^(FastAPI^)  : RUNNING on http://localhost:8000
    set BACKEND_RUNNING=1
) else (
    echo Backend ^(FastAPI^)  : NOT RUNNING
)

REM Check n8n-mcp (port 3001)
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo n8n MCP            : RUNNING on http://localhost:3001
    set N8N_RUNNING=1
) else (
    echo n8n MCP            : NOT RUNNING
)

REM Check Frontend (port 5173, 5174, or 5175)
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Frontend ^(Vite^)    : RUNNING on http://localhost:5173
    set FRONTEND_RUNNING=1
) else (
    netstat -ano | findstr ":5174" | findstr "LISTENING" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Frontend ^(Vite^)    : RUNNING on http://localhost:5174
        set FRONTEND_RUNNING=1
    ) else (
        netstat -ano | findstr ":5175" | findstr "LISTENING" >nul 2>&1
        if %ERRORLEVEL% EQU 0 (
            echo Frontend ^(Vite^)    : RUNNING on http://localhost:5175
            set FRONTEND_RUNNING=1
        ) else (
            echo Frontend ^(Vite^)    : NOT RUNNING
        )
    )
)

echo.
echo ========================================

REM Check if all services are running
if %BACKEND_RUNNING%==1 if %FRONTEND_RUNNING%==1 if %N8N_RUNNING%==1 (
    echo   ALL SERVICES RUNNING!
    echo ========================================
    echo.
    echo Access URLs:
    echo   Frontend:  http://localhost:5173
    echo   Backend:   http://localhost:8000
    echo   API Docs:  http://localhost:8000/docs
    echo   n8n MCP:   http://localhost:3001
    echo   n8n Chat:  http://localhost:5173/n8n-chat
) else (
    echo   SOME SERVICES NOT RUNNING
    echo ========================================
    echo.
    echo To start all services:
    echo   START_CLEAN.bat
)

echo ========================================
echo.
pause







