#!/bin/bash

echo "===================================================="
echo "Starting Setup and Execution for Frontend and Backend"
echo "===================================================="

# Function to run in a new terminal window on macOS
run_in_new_terminal() {
    osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && $1\""
}

# Start Backend
echo ""
echo "[1/2] Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
echo "Activating virtual environment and installing requirements..."
source venv/bin/activate
pip install -r requirements.txt
echo "Starting Backend Server..."
run_in_new_terminal "cd backend && source venv/bin/activate && python3 server.py"
cd ..

# Start Frontend
echo ""
echo "[2/2] Setting up Frontend..."
cd frontend
echo "Installing frontend dependencies..."
npm install
echo "Starting Frontend Development Server..."
run_in_new_terminal "cd frontend && npm start"
cd ..

echo ""
echo "===================================================="
echo "Setup Complete!"
echo "Backend and Frontend are running in separate Terminal windows."
echo "===================================================="
