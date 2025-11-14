#!/bin/bash

# Authentication Setup Script
# This script helps you set up authentication quickly

echo "=============================================="
echo "  Workflow Automation - Auth Setup Script"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -d "automation-chatbot-backend" ] || [ ! -d "automation-chatbot-frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Detected project structure"
echo ""

# Function to prompt for input
prompt_input() {
    local prompt=$1
    local var_name=$2
    local default=$3
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value=${value:-$default}
    else
        read -p "$prompt: " value
    fi
    
    eval "$var_name='$value'"
}

echo "📝 Please provide your Supabase credentials"
echo "   (You can find these in Supabase Dashboard → Settings → API)"
echo ""

# Get Supabase URL
prompt_input "Enter your Supabase URL (e.g., https://xxxxx.supabase.co)" "SUPABASE_URL"

# Get Supabase Anon Key
prompt_input "Enter your Supabase Anon Key" "SUPABASE_ANON_KEY"

# Get Supabase Service Role Key
prompt_input "Enter your Supabase Service Role Key" "SUPABASE_SERVICE_KEY"

echo ""
echo "🔧 Configuring backend..."

# Check if backend .env exists
if [ -f "automation-chatbot-backend/.env" ]; then
    # Update existing .env
    if grep -q "SUPABASE_URL" automation-chatbot-backend/.env; then
        sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|" automation-chatbot-backend/.env
    else
        echo "SUPABASE_URL=$SUPABASE_URL" >> automation-chatbot-backend/.env
    fi
    
    if grep -q "SUPABASE_KEY" automation-chatbot-backend/.env; then
        sed -i.bak "s|SUPABASE_KEY=.*|SUPABASE_KEY=$SUPABASE_SERVICE_KEY|" automation-chatbot-backend/.env
    else
        echo "SUPABASE_KEY=$SUPABASE_SERVICE_KEY" >> automation-chatbot-backend/.env
    fi
    
    echo "✅ Updated automation-chatbot-backend/.env"
else
    echo "⚠️  Backend .env not found. Please create it manually."
fi

echo ""
echo "🔧 Configuring frontend..."

# Create or update frontend .env
if [ ! -f "automation-chatbot-frontend/.env" ]; then
    cp automation-chatbot-frontend/env.example automation-chatbot-frontend/.env
    echo "✅ Created automation-chatbot-frontend/.env from template"
fi

# Update frontend .env
if grep -q "VITE_SUPABASE_URL" automation-chatbot-frontend/.env; then
    sed -i.bak "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|" automation-chatbot-frontend/.env
else
    echo "VITE_SUPABASE_URL=$SUPABASE_URL" >> automation-chatbot-frontend/.env
fi

if grep -q "VITE_SUPABASE_ANON_KEY" automation-chatbot-frontend/.env; then
    sed -i.bak "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" automation-chatbot-frontend/.env
else
    echo "VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" >> automation-chatbot-frontend/.env
fi

echo "✅ Updated automation-chatbot-frontend/.env"

echo ""
echo "📦 Installing frontend dependencies..."
cd automation-chatbot-frontend

if command -v npm &> /dev/null; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  npm not found. Please run 'npm install' manually in automation-chatbot-frontend/"
fi

cd ..

echo ""
echo "=============================================="
echo "  ✅ Authentication Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd automation-chatbot-backend"
echo "   source venv/bin/activate  # Windows: venv\\Scripts\\activate"
echo "   python -m uvicorn app.main:app --reload --port 8000"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd automation-chatbot-frontend"
echo "   npm run dev"
echo ""
echo "3. Open your browser:"
echo "   http://localhost:5173"
echo ""
echo "4. Create an account and start using the app!"
echo ""
echo "📚 For more details, see:"
echo "   - AUTHENTICATION_QUICK_START.md"
echo "   - AUTHENTICATION_SYSTEM_GUIDE.md"
echo ""


