#!/bin/bash

# Workflow Bridge Startup Script
# This script starts both backend and frontend in separate terminals

set -e

echo "🚀 Starting Workflow Bridge Application..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend directory exists
if [ ! -d "automation-chatbot-backend" ]; then
    echo -e "${RED}❌ Backend directory not found!${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "automation-chatbot-frontend" ]; then
    echo -e "${RED}❌ Frontend directory not found!${NC}"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if backend is already running
if check_port 8000; then
    echo -e "${YELLOW}⚠️  Backend already running on port 8000${NC}"
else
    echo -e "${BLUE}📦 Starting Backend...${NC}"
    cd automation-chatbot-backend
    
    # Check if venv exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Creating virtual environment...${NC}"
        python -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Check if dependencies are installed
    if ! pip show fastapi >/dev/null 2>&1; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        pip install -r requirements.txt
    fi
    
    # Start backend in background
    echo -e "${GREEN}✅ Starting backend on http://localhost:8000${NC}"
    uvicorn app.main:app --reload --port 8000 > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    cd ..
    sleep 3
fi

# Check if frontend is already running
if check_port 5173; then
    echo -e "${YELLOW}⚠️  Frontend already running on port 5173${NC}"
else
    echo -e "${BLUE}📦 Starting Frontend...${NC}"
    cd automation-chatbot-frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
    
    # Start frontend in background
    echo -e "${GREEN}✅ Starting frontend on http://localhost:5173${NC}"
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    cd ..
    sleep 3
fi

echo ""
echo -e "${GREEN}✅ Application Started!${NC}"
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo "   Test Page: http://localhost:5173/test"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "   Backend:  tail -f automation-chatbot-backend/backend.log"
echo "   Frontend: tail -f automation-chatbot-frontend/frontend.log"
echo ""
echo -e "${YELLOW}🛑 To stop:${NC}"
echo "   ./STOP_APP.sh"
echo ""

# Health check
echo -e "${BLUE}🔍 Running health check...${NC}"
sleep 2

if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy!${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Check logs: tail -f automation-chatbot-backend/backend.log"
fi

if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible!${NC}"
else
    echo -e "${YELLOW}⏳ Frontend still starting... (this is normal)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Ready to go! Open http://localhost:5173 in your browser${NC}"

