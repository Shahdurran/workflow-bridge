# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites Check
```bash
python --version  # Should be 3.11+
node --version    # Should be 18+
```

### Step 1: Backend Setup (2 minutes)

```bash
# Terminal 1
cd automation-chatbot-backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# Install dependencies (takes ~1-2 minutes)
pip install -r requirements.txt
```

### Step 2: Configure Environment

Create `automation-chatbot-backend/.env`:

```env
# Supabase (Get from https://supabase.com/dashboard/project/_/settings/api)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# AI Provider (Get from OpenAI or Anthropic)
OPENAI_API_KEY=sk-your-key-here
# OR
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional
AI_PROVIDER=openai
AI_MODEL=gpt-4
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Setup Database

1. Go to https://supabase.com/dashboard
2. Open your project
3. Click "SQL Editor"
4. Copy contents of `database_schema.sql`
5. Click "Run"

### Step 4: Start Backend

```bash
# Still in automation-chatbot-backend directory
uvicorn app.main:app --reload --port 8000
```

✅ You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

Visit http://localhost:8000/docs to see API documentation!

### Step 5: Frontend Setup (1 minute)

```bash
# Terminal 2 (new terminal)
cd automation-chatbot-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

✅ You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Step 6: Test Everything!

Visit: **http://localhost:5173/test**

Click: **"🚀 Run All Tests"**

You should see:
```
✅ Health check passed
✅ Chat message sent successfully
✅ Workflow generated: abc-123
✅ Workflow validation passed
✅ Workflow exported successfully
```

## 🎉 Success! You're Ready!

Now visit http://localhost:5173 to use the app!

---

## Troubleshooting

### "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### "CORS Error"
Make sure your backend `.env` has:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### "Module not found: axios"
```bash
cd automation-chatbot-frontend
npm install axios
```

### "Supabase connection failed"
1. Verify your `SUPABASE_URL` ends with `.supabase.co`
2. Use the **service_role** key, not the anon key
3. Check if tables exist in Supabase dashboard

### "OpenAI API Error"
1. Verify your API key starts with `sk-`
2. Check you have credits: https://platform.openai.com/usage
3. Try Anthropic instead by setting `ANTHROPIC_API_KEY`

---

## Next Steps

1. ✅ Seed templates: `python seed_templates.py`
2. 📖 Read [RUNNING_THE_APP.md](./RUNNING_THE_APP.md) for detailed docs
3. 🎨 Customize the frontend UI
4. 🤖 Try different AI models
5. 🚀 Deploy to production

---

## Quick Commands Reference

```bash
# Backend
cd automation-chatbot-backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload

# Frontend
cd automation-chatbot-frontend
npm run dev

# Test
open http://localhost:5173/test
```

## Environment Variables Template

### Backend (.env)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
OPENAI_API_KEY=sk-xxx
AI_PROVIDER=openai
AI_MODEL=gpt-4
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

**Need help?** Check the full documentation in [RUNNING_THE_APP.md](./RUNNING_THE_APP.md)

