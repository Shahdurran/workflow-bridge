# 🧪 Testing the n8n AI Chat

## ✅ What Was Done

1. ✅ Added n8n chat route to App.tsx
2. ✅ Added "AI Chat" link to navigation header
3. ✅ Created streaming chat components
4. ✅ Integrated Claude AI with n8n-mcp

---

## 🚀 How to Test

### Step 1: Make Sure All 3 Services Are Running

**Terminal 1 - n8n-mcp:**
```cmd
cd "D:\workflow bridge\automation-chatbot-backend"
START_N8N_MCP_HTTP.bat
```

Wait for: `[INFO] HTTP server listening on http://localhost:3001`

**Terminal 2 - Backend:**
```cmd
cd "D:\workflow bridge\automation-chatbot-backend"
uvicorn app.main:app --reload
```

Wait for: `Application startup complete`

**Terminal 3 - Frontend:**
```cmd
cd "D:\workflow bridge\automation-chatbot-frontend"
npm run dev
```

Wait for: `Local: http://localhost:5173/`

### Step 2: Access the AI Chat

1. Open your browser: http://localhost:5173
2. Login (if not logged in)
3. Click **"AI Chat"** in the navigation (with robot icon 🤖)
4. Or go directly to: http://localhost:5173/n8n-chat

### Step 3: Test a Simple Query

Try asking:
> "Create a workflow that sends me an email when someone submits a contact form"

**What Should Happen:**
1. ✅ You see "Thinking..." with tool names (like "search_templates")
2. ✅ Claude's response streams in real-time
3. ✅ A workflow preview card appears
4. ✅ You can validate and deploy the workflow

---

## 🔍 What's Different from Old Chat?

### Old Chat (`/builder`):
- ❌ Uses mock AI responses
- ❌ No real workflow generation
- ❌ No n8n integration

### New AI Chat (`/n8n-chat`):
- ✅ Real Claude AI streaming
- ✅ Access to n8n-mcp tools
- ✅ Real workflow generation
- ✅ Validation & deployment

---

## 🐛 Troubleshooting

### Issue: "AI Chat" link not showing
- **Fix**: Refresh the page after frontend restart

### Issue: Chat loads but no response
- **Check**: Is backend running? Test: http://localhost:8000/health
- **Check**: Is n8n-mcp running? Look for HTTP server message

### Issue: "503 Service Unavailable"
- **Fix**: Make sure n8n-mcp HTTP server is running
- **Fix**: Check AUTH_TOKEN matches in batch file and .env

### Issue: Chat works but says "cannot connect to n8n-mcp"
- **Check**: Both tokens match:
  - `START_N8N_MCP_HTTP.bat` line 19: `set AUTH_TOKEN=...`
  - `.env` file: `N8N_MCP_AUTH_TOKEN=...`

---

## 📊 Testing Checklist

- [ ] All 3 services running
- [ ] Frontend loads at http://localhost:5173
- [ ] Can login successfully
- [ ] "AI Chat" link visible in header
- [ ] Clicking AI Chat navigates to chat page
- [ ] Welcome message displays
- [ ] Can type in chat input
- [ ] Sending message shows "Thinking..."
- [ ] Response streams in real-time
- [ ] Tool use indicators appear
- [ ] Workflow preview shows up
- [ ] Can validate workflow
- [ ] Can deploy workflow

---

## 🎯 Quick Test Messages

Try these to test different features:

**Template Search:**
> "Show me workflow templates for email automation"

**Workflow Creation:**
> "I need a workflow that posts to Twitter when I upload to Google Drive"

**Node Information:**
> "What n8n nodes can I use to send Slack messages?"

**Validation:**
> "Create a simple HTTP request workflow and validate it"

---

## 📸 What You Should See

### Navigation:
```
Dashboard | 🤖 AI Chat | Create | My Workflows | Templates
```

### Chat Interface:
```
┌─────────────────────────────────────────┐
│  n8n Workflow Assistant                 │
│  Powered by Claude AI & n8n-mcp        │
├─────────────────────────────────────────┤
│                                         │
│  👋 Welcome to n8n Workflow Assistant   │
│                                         │
│  [Your messages appear here]            │
│                                         │
│  🤖 [AI responses stream here]          │
│                                         │
│  ┌─────────────────────────────┐       │
│  │ Workflow Preview            │       │
│  │ • Node 1                    │       │
│  │ • Node 2                    │       │
│  │ [Validate] [Deploy to n8n]  │       │
│  └─────────────────────────────┘       │
│                                         │
├─────────────────────────────────────────┤
│ Describe the workflow you want...      │
└─────────────────────────────────────────┘
```

---

## ✅ Success Indicators

**You'll know it's working when:**

1. ✅ Chat page loads with welcome message
2. ✅ Typing a message and sending works
3. ✅ You see "🔧 search_templates" or similar tool indicators
4. ✅ Response appears word-by-word (streaming)
5. ✅ Workflow preview card shows up
6. ✅ Backend logs show: `Calling MCP tool: search_templates`
7. ✅ n8n-mcp logs show: `Received tool request`

---

## 🎉 You're All Set!

Now you have:
- ✅ AI-powered workflow generation
- ✅ Real-time streaming responses
- ✅ Access to 500+ n8n nodes
- ✅ Template search
- ✅ Workflow validation
- ✅ One-click deployment

**Go test it out!** 🚀

