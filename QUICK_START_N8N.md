# 🚀 Quick Start: n8n-mcp Integration

Get your n8n workflow AI chatbot running in **15 minutes**!

---

## ⚡ Prerequisites

- ✅ Node.js installed
- ✅ Python 3.8+ installed  
- ✅ Supabase account created
- ✅ Anthropic API key ([Get one here](https://console.anthropic.com/))
- ✅ n8n instance (cloud or self-hosted)

---

## 📋 Step-by-Step Setup

### 1️⃣ Setup n8n-mcp Server (5 min)

```bash
# Clone and setup n8n-mcp
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp
npm install
npm run build
npm run rebuild
npm start
```

✅ **Verify**: Server running at http://localhost:3001

---

### 2️⃣ Configure Backend (5 min)

```bash
cd automation-chatbot-backend

# Create .env file
cp env.example .env

# Edit .env and add:
# - ANTHROPIC_API_KEY=sk-ant-your-key
# - SUPABASE_URL and keys
# - N8N_MCP_URL=http://localhost:3001
# - N8N_API_URL and N8N_API_KEY

# Install dependencies
pip install -r requirements.txt

# Setup database
python setup_n8n_database.py
```

When prompted, **copy the SQL** and **execute it in Supabase Dashboard** → SQL Editor.

---

### 3️⃣ Start Backend (1 min)

```bash
cd automation-chatbot-backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ **Verify**: http://localhost:8000/health shows all services "healthy"

---

### 4️⃣ Configure Frontend (2 min)

```bash
cd automation-chatbot-frontend

# Create .env file
cp env.example .env

# Edit .env and add:
# - VITE_API_BASE_URL=http://localhost:8000
# - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Install dependencies
npm install
```

---

### 5️⃣ Start Frontend (1 min)

```bash
cd automation-chatbot-frontend
npm run dev
```

✅ **Verify**: Open http://localhost:5173/n8n-chat

---

### 6️⃣ Test It! (1 min)

Try asking:

> "Create a workflow that sends me an email when someone fills out my contact form"

Watch as Claude AI:
1. 🔍 Searches for relevant n8n nodes
2. 🤖 Generates the workflow
3. ✅ Validates it
4. 🚀 Offers to deploy it!

---

## 🎉 You're Done!

Your AI-powered n8n workflow builder is ready!

---

## 🔍 Quick Troubleshooting

### n8n-mcp not connecting?
```bash
# Test connectivity
curl http://localhost:3001/mcp/tool -d '{"tool":"health_check","input":{}}'
```

### Backend health check failing?
```bash
# Check logs for errors
curl http://localhost:8000/health | jq
```

### Database tables missing?
```bash
# Re-run database setup
python setup_n8n_database.py
```

### Claude API errors?
- Check your API key at https://console.anthropic.com/
- Verify billing/quota status
- Ensure `ANTHROPIC_API_KEY` is set correctly

---

## 📚 What Next?

1. **Read the Full Docs**: See `N8N_INTEGRATION_README.md`
2. **Explore Examples**: Try the sample prompts
3. **Deploy to Production**: Follow the deployment guide
4. **Customize**: Adjust the system prompt for your needs

---

## 🆘 Still Need Help?

- Check `N8N_INTEGRATION_README.md` → Troubleshooting section
- Review backend logs for detailed errors
- Ensure all environment variables are set
- Verify all services are running

---

**Happy Automating! 🎉**

*Need more details? See the complete documentation in `N8N_INTEGRATION_README.md`*

