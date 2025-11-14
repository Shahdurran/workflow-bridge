@echo off
REM Authentication Setup Script for Windows
REM This script helps you set up authentication quickly

echo ==============================================
echo   Workflow Automation - Auth Setup Script
echo ==============================================
echo.

REM Check if we're in the right directory
if not exist "automation-chatbot-backend" (
    echo [ERROR] automation-chatbot-backend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "automation-chatbot-frontend" (
    echo [ERROR] automation-chatbot-frontend directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

echo [OK] Detected project structure
echo.

echo Please provide your Supabase credentials
echo (You can find these in Supabase Dashboard - Settings - API)
echo.

REM Get Supabase URL
set /p SUPABASE_URL="Enter your Supabase URL (e.g., https://xxxxx.supabase.co): "

REM Get Supabase Anon Key
set /p SUPABASE_ANON_KEY="Enter your Supabase Anon Key: "

REM Get Supabase Service Role Key
set /p SUPABASE_SERVICE_KEY="Enter your Supabase Service Role Key: "

echo.
echo Configuring backend...

REM Check if backend .env exists
if exist "automation-chatbot-backend\.env" (
    echo Updating automation-chatbot-backend\.env
    
    REM Backup existing .env
    copy "automation-chatbot-backend\.env" "automation-chatbot-backend\.env.backup" >nul
    
    REM Update or append SUPABASE_URL
    findstr /C:"SUPABASE_URL=" "automation-chatbot-backend\.env" >nul
    if errorlevel 1 (
        echo SUPABASE_URL=%SUPABASE_URL% >> "automation-chatbot-backend\.env"
    ) else (
        powershell -Command "(Get-Content 'automation-chatbot-backend\.env') -replace 'SUPABASE_URL=.*', 'SUPABASE_URL=%SUPABASE_URL%' | Set-Content 'automation-chatbot-backend\.env'"
    )
    
    REM Update or append SUPABASE_KEY
    findstr /C:"SUPABASE_KEY=" "automation-chatbot-backend\.env" >nul
    if errorlevel 1 (
        echo SUPABASE_KEY=%SUPABASE_SERVICE_KEY% >> "automation-chatbot-backend\.env"
    ) else (
        powershell -Command "(Get-Content 'automation-chatbot-backend\.env') -replace 'SUPABASE_KEY=.*', 'SUPABASE_KEY=%SUPABASE_SERVICE_KEY%' | Set-Content 'automation-chatbot-backend\.env'"
    )
    
    echo [OK] Updated automation-chatbot-backend\.env
) else (
    echo [WARNING] Backend .env not found. Please create it manually.
)

echo.
echo Configuring frontend...

REM Create frontend .env if it doesn't exist
if not exist "automation-chatbot-frontend\.env" (
    if exist "automation-chatbot-frontend\env.example" (
        copy "automation-chatbot-frontend\env.example" "automation-chatbot-frontend\.env" >nul
        echo [OK] Created automation-chatbot-frontend\.env from template
    )
)

if exist "automation-chatbot-frontend\.env" (
    REM Backup existing .env
    copy "automation-chatbot-frontend\.env" "automation-chatbot-frontend\.env.backup" >nul
    
    REM Update or append VITE_SUPABASE_URL
    findstr /C:"VITE_SUPABASE_URL=" "automation-chatbot-frontend\.env" >nul
    if errorlevel 1 (
        echo VITE_SUPABASE_URL=%SUPABASE_URL% >> "automation-chatbot-frontend\.env"
    ) else (
        powershell -Command "(Get-Content 'automation-chatbot-frontend\.env') -replace 'VITE_SUPABASE_URL=.*', 'VITE_SUPABASE_URL=%SUPABASE_URL%' | Set-Content 'automation-chatbot-frontend\.env'"
    )
    
    REM Update or append VITE_SUPABASE_ANON_KEY
    findstr /C:"VITE_SUPABASE_ANON_KEY=" "automation-chatbot-frontend\.env" >nul
    if errorlevel 1 (
        echo VITE_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY% >> "automation-chatbot-frontend\.env"
    ) else (
        powershell -Command "(Get-Content 'automation-chatbot-frontend\.env') -replace 'VITE_SUPABASE_ANON_KEY=.*', 'VITE_SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%' | Set-Content 'automation-chatbot-frontend\.env'"
    )
    
    echo [OK] Updated automation-chatbot-frontend\.env
)

echo.
echo Installing frontend dependencies...
cd automation-chatbot-frontend

where npm >nul 2>nul
if %errorlevel% == 0 (
    call npm install
    echo [OK] Frontend dependencies installed
) else (
    echo [WARNING] npm not found. Please run 'npm install' manually in automation-chatbot-frontend/
)

cd ..

echo.
echo ==============================================
echo   [OK] Authentication Setup Complete!
echo ==============================================
echo.
echo Next steps:
echo.
echo 1. Start the backend:
echo    cd automation-chatbot-backend
echo    venv\Scripts\activate
echo    python -m uvicorn app.main:app --reload --port 8000
echo.
echo 2. Start the frontend (in another terminal):
echo    cd automation-chatbot-frontend
echo    npm run dev
echo.
echo 3. Open your browser:
echo    http://localhost:5173
echo.
echo 4. Create an account and start using the app!
echo.
echo For more details, see:
echo    - AUTHENTICATION_QUICK_START.md
echo    - AUTHENTICATION_SYSTEM_GUIDE.md
echo.
pause


