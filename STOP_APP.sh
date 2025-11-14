#!/bin/bash

# Stop Workflow Bridge Application

echo "🛑 Stopping Workflow Bridge Application..."

# Function to kill process by PID file
kill_by_pidfile() {
    if [ -f "$1" ]; then
        PID=$(cat "$1")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Stopping process $PID..."
            kill $PID
            sleep 1
            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                kill -9 $PID
            fi
        fi
        rm "$1"
    fi
}

# Kill backend
if [ -f "automation-chatbot-backend/backend.pid" ]; then
    kill_by_pidfile "automation-chatbot-backend/backend.pid"
    echo "✅ Backend stopped"
fi

# Kill frontend
if [ -f "automation-chatbot-frontend/frontend.pid" ]; then
    kill_by_pidfile "automation-chatbot-frontend/frontend.pid"
    echo "✅ Frontend stopped"
fi

# Also try to kill by port
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "Killing process on port 8000..."
    lsof -ti:8000 | xargs kill -9
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo "Killing process on port 5173..."
    lsof -ti:5173 | xargs kill -9
fi

echo "✅ Application stopped"

