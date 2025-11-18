# 🚀 Workflow Bridge - Complete Startup Guide

This guide will help you start the **Frontend**, **Backend**, and **n8n MCP** components of Workflow Bridge.

---

## ✅ Prerequisites

Before starting, ensure you have:

- ✅ **Python 3.11+** installed
- ✅ **Node.js 18+** installed
- ✅ **Git** installed
- ✅ **Supabase account** (free tier works)
- ✅ **Anthropic API key** (for Claude AI) or **OpenAI API key**

---

## 📦 First Time Setup

### Step 1: Configure Backend Environment

1. Navigate to the backend directory:
   ```powershell
   cd automation-chatbot-backend
   ```

2. Copy the example environment file:
   ```powershell
   Copy-Item env.example .env
   ```

3. Edit `.env` and fill in **required** values:
   ```env
   # Required - Get from https://supabase.com/dashboard
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   
   # Required - Choose ONE AI provider
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   # OR
   OPENAI_API_KEY=sk-your-key-here
   
   # Optional - Only if using n8n integration
   N8N_MCP_URL=http://localhost:3001
   N8N_API_URL=https://your-n8n-instance.com
   N8N_API_KEY=your-n8n-api-key
   ```

### Step 2: Setup Database Schema

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Run the SQL from `database_schema.sql` (main project root)
5. If using n8n integration, also run `automation-chatbot-backend/database_n8n_schema.sql`

### Step 3: (Optional) Setup n8n-mcp Server

**Only needed if you want n8n workflow AI capabilities.**

Run the setup script:
```powershell
.\SETUP_N8N_MCP.ps1
```

This will:
- Clone the n8n-mcp repository to `D:\workflow bridge\n8n-mcp`
- Install dependencies
- Build the project
- Initialize the database

Alternatively, do it manually:
```powershell
cd "D:\workflow bridge"
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp
npm install
npm run build
npm run rebuild
```

---

## 🚀 Starting the Application

### Option 1: Start All Services (Recommended)

Run the automated startup script:

```powershell
.\START_ALL.ps1
```

This will:
1. ✅ Start the **Backend** (FastAPI) on `http://localhost:8000`
2. ✅ Start the **Frontend** (Vite + React) on `http://localhost:5173`
3. ✅ Start **n8n MCP** (if available) on `http://localhost:3001`
4. 🌐 Open the application in your browser

---

### Option 2: Start Services Individually

#### Backend Only:
```powershell
cd automation-chatbot-backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

#### Frontend Only:
```powershell
cd automation-chatbot-frontend
npm run dev
```

#### n8n MCP Only:
```powershell
cd "D:\workflow bridge\n8n-mcp"
npm start
```

---

## 🔍 Checking Service Status

To check if all services are running:

```powershell
.\CHECK_SERVICES.ps1
```

This will show:
```
========================================
  Workflow Bridge - Service Status
========================================

Backend (FastAPI) : ✓ Running
Frontend (Vite) : ✓ Running
n8n MCP : ✓ Running

========================================
  All Services Running! ✓
========================================
```

---

## 🌐 Access URLs

Once services are running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main application |
| **Backend API** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Test Page** | http://localhost:5173/test | Integration test page |
| **n8n Chat** | http://localhost:5173/n8n-chat | AI workflow builder (if n8n-mcp is running) |
| **n8n MCP** | http://localhost:3001 | MCP server (internal) |

---

## 🧪 Testing the Setup

### Quick Health Check:

```powershell
# Test backend
Invoke-WebRequest http://localhost:8000/health | Select-Object -Expand Content

# Test frontend
Invoke-WebRequest http://localhost:5173 | Select-Object StatusCode
```

### Full Integration Test:

1. Open http://localhost:5173/test
2. Click **"Run All Tests"**
3. Verify all tests pass ✅

---

## 🛑 Stopping Services

To stop all services, simply close the PowerShell windows that were opened by `START_ALL.ps1`.

Or use:
```powershell
# Find and stop specific processes
Get-Process | Where-Object {$_.ProcessName -like "*uvicorn*" -or $_.ProcessName -like "*node*"} | Stop-Process
```

---

## ❌ Troubleshooting

### Backend Not Starting

**Problem:** Backend fails to start or shows errors

**Solutions:**
1. Check if `.env` file exists in `automation-chatbot-backend/`
2. Verify all required environment variables are set
3. Ensure database schema is created in Supabase
4. Check Python version: `python --version` (should be 3.11+)
5. Reinstall dependencies:
   ```powershell
   cd automation-chatbot-backend
   .\venv\Scripts\activate
   pip install -r requirements.txt --force-reinstall
   ```

### Frontend Not Starting

**Problem:** Frontend fails to start or shows errors

**Solutions:**
1. Delete `node_modules` and reinstall:
   ```powershell
   cd automation-chatbot-frontend
   Remove-Item -Recurse -Force node_modules
   npm install
   ```
2. Check Node.js version: `node --version` (should be 18+)
3. Clear npm cache: `npm cache clean --force`

### n8n MCP Not Found

**Problem:** Script says "n8n-mcp directory not found"

**Solutions:**
1. Run the setup script: `.\SETUP_N8N_MCP.ps1`
2. Or clone manually:
   ```powershell
   cd "D:\workflow bridge"
   git clone https://github.com/czlonkowski/n8n-mcp.git
   ```

### Port Already in Use

**Problem:** "Port 8000 already in use" or similar

**Solutions:**
```powershell
# Find what's using the port
netstat -ano | findstr :8000

# Kill the process (replace <PID> with actual number)
taskkill /PID <PID> /F
```

### Database Connection Errors

**Problem:** "Could not connect to Supabase"

**Solutions:**
1. Verify your Supabase credentials in `.env`
2. Ensure your IP is allowed in Supabase dashboard
3. Check if database schema is created
4. Test connection:
   ```powershell
   cd automation-chatbot-backend
   python test_database.py
   ```

### CORS Errors

**Problem:** Frontend shows CORS errors in browser console

**Solutions:**
1. Add frontend URL to `CORS_ORIGINS` in backend `.env`:
   ```env
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```
2. Restart backend service

---

## 🔧 Optional: Supabase MCP Server

**Supabase MCP** allows Cursor's AI to interact directly with your Supabase database!

### What It Does:
- Query tables directly from Cursor
- Inspect schemas and data
- Debug faster without switching to Supabase dashboard
- Execute SQL from AI chat

### Setup:
1. The Supabase MCP has been added to `C:\Users\shahd\.cursor\mcp.json`
2. Add your **service role key** to the configuration
3. Restart Cursor
4. Test by asking: "Show me all tables in my Supabase database"

**See detailed instructions in:** `SUPABASE_MCP_SETUP.md`

---

## 📚 Additional Resources

- **Main Documentation:** See `README.md`
- **API Documentation:** http://localhost:8000/docs (when running)
- **Running Guide:** `RUNNING_THE_APP.md`
- **Quick Start:** `QUICK_START.md`
- **n8n Integration:** `QUICK_START_N8N.md`
- **Authentication:** `AUTHENTICATION_QUICK_START.md`
- **Supabase MCP:** `SUPABASE_MCP_SETUP.md` ⭐ NEW

---

## 🎯 Quick Reference

### Start Everything:
```powershell
.\START_ALL.ps1
```

### Check Status:
```powershell
.\CHECK_SERVICES.ps1
```

### Setup n8n MCP:
```powershell
.\SETUP_N8N_MCP.ps1
```

### Open Application:
```powershell
Start-Process http://localhost:5173
```

---

## 📝 Environment Variables Summary

### Backend Required:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key from Supabase
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` - AI provider key

### Backend Optional:
- `N8N_MCP_URL` - n8n-mcp server URL (default: http://localhost:3001)
- `N8N_API_URL` - Your n8n instance URL
- `N8N_API_KEY` - n8n API key
- `CORS_ORIGINS` - Allowed origins (default includes localhost:5173)

### Frontend Required:
- None (uses defaults)

### Frontend Optional:
- `VITE_API_BASE_URL` - Backend URL (default: http://localhost:8000)
- `VITE_SUPABASE_URL` - Your Supabase URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

---

**Happy Building! 🎉**

*For more detailed information, refer to the specific documentation files mentioned above.*

