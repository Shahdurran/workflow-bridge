# 🔐 Setup Authentication Tokens

## Quick Setup Guide

### Step 1: Generate a Secure Token

You can use any random string, but here are secure options:

**Option A - PowerShell:**
```powershell
# Run this to generate a random token
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Option B - Python:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

**Option C - Simple Random String:**
```
my-super-secret-token-12345-change-this
```

### Step 2: Update Both Files with the SAME Token

#### File 1: `START_N8N_MCP_HTTP.bat`

Open the file and change this line:
```batch
set AUTH_TOKEN=your-secret-token-here-change-me
```

To:
```batch
set AUTH_TOKEN=your-actual-token-here
```

#### File 2: `automation-chatbot-backend/.env`

Add or update this line:
```bash
N8N_MCP_AUTH_TOKEN=your-actual-token-here
```

**⚠️ IMPORTANT: Use the SAME token in both files!**

---

## Complete .env Example

Your `automation-chatbot-backend/.env` should look like:

```bash
# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Claude AI (Required)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
CLAUDE_MODEL=claude-sonnet-4-20250514

# n8n-mcp (Required for HTTP mode)
N8N_MCP_URL=http://localhost:3001
N8N_MCP_AUTH_TOKEN=your-matching-token-here  # SAME as in batch file!

# n8n Instance (Optional - for deployment)
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key

# FastAPI
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
ENVIRONMENT=development
```

---

## Startup Sequence

### 1. Start n8n-mcp in HTTP mode:
```cmd
cd "D:\workflow bridge\automation-chatbot-backend"
START_N8N_MCP_HTTP.bat
```

**Expected output:**
```
[INFO] HTTP server listening on http://localhost:3001
[INFO] Authentication enabled with token
```

### 2. Start FastAPI backend:
```cmd
cd "D:\workflow bridge\automation-chatbot-backend"
uvicorn app.main:app --reload
```

### 3. Start Frontend:
```cmd
cd "D:\workflow bridge\automation-chatbot-frontend"
npm run dev
```

---

## Verify Everything Works

### Test 1: n8n-mcp Health Check
```powershell
$headers = @{
    "Authorization" = "Bearer your-token-here"
}
Invoke-RestMethod -Uri "http://localhost:3001/health" -Headers $headers
```

### Test 2: FastAPI Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

Should show:
```json
{
  "status": "healthy",
  "n8n_mcp": {
    "status": "connected"
  }
}
```

---

## Troubleshooting

### Issue: "No authentication token found"
- ✅ Check `AUTH_TOKEN` is set in batch file
- ✅ Token is not empty or default value

### Issue: "401 Unauthorized" when calling n8n-mcp
- ✅ Token in `.env` matches token in batch file
- ✅ Token doesn't have extra spaces
- ✅ Backend was restarted after changing `.env`

### Issue: Still can't connect
1. Stop everything (Ctrl+C in all terminals)
2. Verify token in batch file: `type START_N8N_MCP_HTTP.bat | findstr AUTH_TOKEN`
3. Verify token in .env: `type .env | findstr N8N_MCP_AUTH_TOKEN`
4. Make sure they match!
5. Restart in order: n8n-mcp → Backend → Frontend

---

## Security Notes

- 🔒 Keep your token secret (don't commit to git)
- 🔒 Use a strong random token in production
- 🔒 Different tokens for dev/staging/production
- 🔒 Add `.env` to `.gitignore` (should already be there)

---

## Quick Reference

**Generate Token (PowerShell):**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Example Token:**
```
aB3dE7fG9hJ2kL4mN6pQ8rS0tU5vW1xY
```

Use this SAME token in:
1. ✅ `START_N8N_MCP_HTTP.bat` → Line with `set AUTH_TOKEN=`
2. ✅ `.env` → Line with `N8N_MCP_AUTH_TOKEN=`

---

**Ready?** Generate a token, update both files, and start the servers! 🚀




