@echo off
REM Workflow Bridge - Stop All Services

echo.
echo ========================================
echo   Stopping Workflow Bridge Services
echo ========================================
echo.

REM Kill all Node.js processes (Frontend and n8n-mcp)
echo Stopping Node.js processes (Frontend, n8n-mcp)...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   - Node.js processes stopped
) else (
    echo   - No Node.js processes found
)

REM Kill all Python/Uvicorn processes (Backend)
echo Stopping Python processes (Backend)...
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   - Python processes stopped
) else (
    echo   - No Python processes found
)

REM Kill specific ports if still in use
echo.
echo Checking for processes on ports...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo   - Stopping process on port 8000 (Backend)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo   - Stopping process on port 3001 (n8n-mcp)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo   - Stopping process on port 5173 (Frontend)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174" ^| findstr "LISTENING"') do (
    echo   - Stopping process on port 5174 (Frontend alt)
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5175" ^| findstr "LISTENING"') do (
    echo   - Stopping process on port 5175 (Frontend alt)
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ========================================
echo   All Services Stopped
echo ========================================
echo.
echo You can now:
echo   - Start services: START_CLEAN.bat
echo   - Check status:   CHECK_STATUS.bat
echo.
pause






