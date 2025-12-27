#!/bin/bash

# 1. Setup Python Virtual Environment
echo "Setting up Python environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# 2. Install Python Dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# 3. Install Playwright Browsers
echo "Installing Playwright browsers..."
playwright install chromium

# 4. Build Frontend
echo "Building frontend..."
if command -v npm &> /dev/null; then
    cd frontend
    echo "Installing frontend packages..."
    npm install
    # Explicitly install the required libraries to ensure they exist
    npm install axios lucide-react
    echo "Compiling assets..."
    npm run build
    cd ..
else
    echo "WARNING: Node.js not found. Skipping frontend build."
fi

# 5. Start Server
echo "Starting server on http://localhost:8000"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
