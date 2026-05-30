@echo off
echo ====================================================
echo Starting Setup and Execution for Frontend and Backend
echo ====================================================

:: Start Backend
echo.
echo [1/2] Setting up Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Activating virtual environment and installing requirements...
call venv\Scripts\activate
pip install -r requirements.txt
echo Starting Backend Server...
start "Backend Server" cmd /k "python server.py"
cd ..

:: Start Frontend
echo.
echo [2/2] Setting up Frontend...
cd frontend
echo Installing frontend dependencies...
call npm install
echo Starting Frontend Development Server...
start "Frontend Server" cmd /k "npm start"
cd ..

echo.
echo ====================================================
echo Setup Complete! 
echo Backend and Frontend are running in separate windows.
echo ====================================================
pause
