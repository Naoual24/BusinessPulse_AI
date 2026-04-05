@echo off
echo Starting BusinessPulse Locally (No Docker)...

:: Backend Setup
echo [INFO] Setting up Backend...
cd backend
if not exist venv (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo [INFO] Upgrading pip and build tools...
python -m pip install --upgrade pip setuptools wheel
echo [INFO] Installing backend dependencies...
pip install -r requirements.txt

:: Start Backend in a new window
echo [INFO] Starting Backend Server...
start "BusinessPulse Backend" cmd /k "set PYTHONIOENCODING=utf-8 && call venv\Scripts\activate && python -m uvicorn app.main:app --reload --port 8000 --host 127.0.0.1"

:: Frontend Setup
cd ..
echo [INFO] Setting up Frontend...
cd frontend
if not exist node_modules\.bin\next (
    echo [INFO] Installing frontend dependencies...
    call npm install
)

:: Start Frontend in a new window
echo [INFO] Starting Frontend Server...
start "BusinessPulse Frontend" cmd /k "call npm run dev"

echo [SUCCESS] BusinessPulse local servers are starting!
echo Backend API: http://localhost:8000
echo Frontend:    http://localhost:3000
echo.
echo Note: If you don't have PostgreSQL installed, the app will automatically use SQLite (businesspulse.db).
pause
