# n8n-mcp Integration with Claude AI

## 📋 Overview

This project now includes full integration with **n8n-mcp** (Model Context Protocol for n8n) and **Claude AI** to enable natural language workflow creation for n8n automation platform.

### What This Integration Provides

- **Conversational workflow creation** using Claude Sonnet 4
- **Real-time streaming responses** with Server-Sent Events (SSE)
- **Access to 500+ n8n nodes** through n8n-mcp
- **Pre-built workflow templates** from n8n's template gallery
- **Automatic workflow validation** before deployment
- **One-click deployment** to your n8n instance
- **Persistent conversation history** in Supabase

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │ ─────│   FastAPI    │ ─────│   Claude    │
│  (React)    │      │   Backend    │      │     AI      │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            │                      │
                     ┌──────┴──────┐        ┌──────┴──────┐
                     │             │        │             │
                 ┌───▼───┐    ┌───▼───┐   Tool Calls    │
                 │ n8n   │    │ n8n-  │◄─────────────────┘
                 │ API   │    │ mcp   │
                 └───────┘    └───────┘
                     │             │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │  Supabase   │
                     │  Database   │
                     └─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (for n8n-mcp server)
2. **Python 3.8+** (for FastAPI backend)
3. **Supabase Account** (for database)
4. **Anthropic API Key** (for Claude AI)
5. **n8n Instance** (self-hosted or cloud)

### Step 1: Install n8n-mcp

```bash
# Clone n8n-mcp repository
git clone https://github.com/czlonkowski/n8n-mcp.git
cd n8n-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Initialize database
npm run rebuild

# Start the server (default: http://localhost:3001)
npm start
```

### Step 2: Setup Backend Environment

Create or update your `.env` file in `automation-chatbot-backend/`:

```bash
# Existing Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Claude AI Configuration (NEW)
ANTHROPIC_API_KEY=sk-ant-your-claude-api-key-here
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=1.0

# n8n-mcp Integration (NEW)
N8N_MCP_URL=http://localhost:3001
N8N_API_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key

# FastAPI Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Step 3: Setup Database Schema

```bash
cd automation-chatbot-backend

# Install new dependencies
pip install anthropic>=0.39.0

# Setup database tables
python setup_n8n_database.py
```

Follow the prompts to execute the SQL schema in your Supabase dashboard.

### Step 4: Start Backend Server

```bash
cd automation-chatbot-backend

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 5: Setup Frontend Environment

Create or update `.env` in `automation-chatbot-frontend/`:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 6: Start Frontend

```bash
cd automation-chatbot-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Step 7: Test the Integration

1. Navigate to `http://localhost:5173/n8n-chat` (or wherever your frontend runs)
2. Try asking: "Create a workflow that sends me an email when someone fills out my contact form"
3. Watch Claude AI stream the response and generate the workflow
4. Validate and deploy the workflow to your n8n instance!

---

## 🧪 Testing

### Run Integration Tests

```bash
cd automation-chatbot-backend

# Run all tests
pytest test_n8n_integration.py -v

# Run specific test
pytest test_n8n_integration.py::test_mcp_health_check -v

# Run with verbose output
pytest test_n8n_integration.py -vv -s
```

### Test Health Endpoint

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T12:00:00",
  "claude_service": {
    "status": "configured",
    "model": "claude-sonnet-4-20250514"
  },
  "n8n_mcp": {
    "status": "connected",
    "url": "http://localhost:3001"
  },
  "n8n": {
    "status": "configured",
    "url": "https://your-n8n-instance.com"
  }
}
```

---

## 📡 API Endpoints

### Chat Endpoints

#### POST `/api/n8n/chat`
Stream chat messages with Claude AI.

**Request:**
```json
{
  "message": "Create a workflow that sends emails",
  "conversation_id": "optional-conversation-id"
}
```

**Response:** Server-Sent Events stream

```
event: start
data: {"conversation_id": "uuid"}

event: message
data: {"text": "I'll help you create..."}

event: tool_use
data: {"tool_name": "search_templates", "tool_input": {...}}

event: workflow
data: {"workflow": {...}}

event: done
data: {"conversation_id": "uuid"}
```

#### POST `/api/n8n/validate-workflow`
Validate a workflow structure.

**Request:**
```json
{
  "workflow": {...},
  "profile": "balanced"
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "profile": "balanced"
}
```

#### POST `/api/n8n/deploy-workflow`
Deploy a workflow to n8n.

**Request:**
```json
{
  "workflow": {...},
  "conversation_id": "optional-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "workflow_id": "n8n-workflow-id",
  "workflow_url": "https://your-n8n.com/workflow/123",
  "message": "Workflow deployed successfully"
}
```

### Conversation Management

#### GET `/api/n8n/conversations`
List user's conversations.

#### GET `/api/n8n/conversations/{conversation_id}`
Get specific conversation with messages.

#### DELETE `/api/n8n/conversations/{conversation_id}`
Delete a conversation.

---

## 🗄️ Database Schema

The integration adds four main tables:

### `conversations`
Stores chat sessions.

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    metadata JSONB
);
```

### `messages`
Stores individual chat messages.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID REFERENCES conversations,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    workflow_json JSONB,
    created_at TIMESTAMPTZ
);
```

### `workflows`
Stores deployed workflows.

```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    conversation_id UUID REFERENCES conversations,
    workflow_data JSONB NOT NULL,
    n8n_workflow_id TEXT,
    n8n_workflow_url TEXT,
    deployed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### `workflow_executions` (Optional)
Tracks workflow execution history.

---

## 🎨 Frontend Components

### New Components Created

1. **`useN8nChat.ts`** - Custom React hook for chat streaming
   - Manages conversation state
   - Handles streaming events
   - Extracts workflows from responses

2. **`n8n-chat-container.tsx`** - Main chat interface
   - Streaming message display
   - Tool use indicators
   - Error handling

3. **`WorkflowPreview.tsx`** - Workflow display component
   - Node list view
   - Validation status
   - Deploy button

4. **`n8n-chat.tsx`** - Full page chat interface
   - Complete chat experience
   - Info panels
   - Tips and examples

---

## 🔧 Configuration

### Claude AI Models

Available models (configure in `.env`):
- `claude-sonnet-4-20250514` (Recommended - Latest)
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`

### n8n-mcp Server

Default configuration:
- **URL**: `http://localhost:3001`
- **Protocol**: HTTP/JSON-RPC
- **Timeout**: 30 seconds

### Validation Profiles

Three validation strictness levels:
- **`strict`** - All checks enabled
- **`balanced`** - Recommended default
- **`permissive`** - Minimal validation

---

## 🐛 Troubleshooting

### n8n-mcp Connection Failed

**Error:** `Cannot connect to n8n-mcp server`

**Solutions:**
1. Ensure n8n-mcp is running: `npm start` in n8n-mcp directory
2. Check URL in `.env`: `N8N_MCP_URL=http://localhost:3001`
3. Test connectivity: `curl http://localhost:3001/mcp/tool -d '{"tool":"health_check","input":{}}'`

### Claude API Errors

**Error:** `Claude AI service not configured`

**Solutions:**
1. Set API key: `ANTHROPIC_API_KEY=sk-ant-...`
2. Check API key validity at https://console.anthropic.com/
3. Verify quota/billing status

### Database Schema Missing

**Error:** `Table 'conversations' not found`

**Solutions:**
1. Run setup script: `python setup_n8n_database.py`
2. Execute SQL manually in Supabase dashboard
3. Check database connection: `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`

### Streaming Not Working

**Error:** Response not streaming / hanging

**Solutions:**
1. Check CORS configuration in backend
2. Ensure browser supports SSE
3. Check network tab for streaming events
4. Verify Claude API key is valid

---

## 📊 Monitoring & Logging

### Health Monitoring

Check service health:
```bash
curl http://localhost:8000/health | jq
```

### Backend Logs

```bash
# View FastAPI logs
tail -f logs/app.log

# Or if running in terminal
# Logs appear in console
```

### n8n-mcp Logs

```bash
cd n8n-mcp
npm start
# Logs appear in console
```

---

## 🚀 Production Deployment

### Environment Variables

Ensure these are set in production:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
N8N_MCP_URL=https://n8n-mcp.yourapp.com
N8N_API_URL=https://n8n.yourapp.com
N8N_API_KEY=...

# Optional but recommended
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
```

### Scaling Considerations

1. **n8n-mcp**: Deploy as separate service (Railway, Heroku, etc.)
2. **FastAPI**: Use gunicorn with multiple workers
3. **Database**: Enable connection pooling
4. **Caching**: Consider Redis for conversation caching

---

## 📚 Resources

- **n8n-mcp GitHub**: https://github.com/czlonkowski/n8n-mcp
- **n8n Documentation**: https://docs.n8n.io/
- **Claude API Docs**: https://docs.anthropic.com/
- **MCP Specification**: https://modelcontextprotocol.io/

---

## 🤝 Contributing

### Adding New MCP Tools

1. Add tool definition in `claude_service.py`
2. Map tool to MCP client method
3. Update tests
4. Document in API reference

### Extending Functionality

- Add more n8n-mcp tool integrations
- Improve workflow validation logic
- Add workflow execution tracking
- Implement workflow versioning

---

## 📝 License

This integration maintains the same license as the parent project.

---

## ✅ Checklist for Setup

- [ ] n8n-mcp server installed and running
- [ ] Anthropic API key configured
- [ ] n8n instance accessible
- [ ] Supabase database schema created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment variables set
- [ ] Health check passes
- [ ] Test conversation successful
- [ ] Workflow deployment successful

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.

**Happy Automating! 🎉**

