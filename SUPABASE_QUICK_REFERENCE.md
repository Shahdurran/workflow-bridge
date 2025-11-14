# Supabase Integration - Quick Reference

## 🚀 Quick Start

### 1. Setup (5 minutes)

```bash
# 1. Create Supabase project at supabase.com
# 2. Run database_schema.sql in Supabase SQL Editor
# 3. Copy credentials to .env

# .env file:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### 2. Seed Data (Optional)

```bash
cd automation-chatbot-backend
python seed_templates.py
```

### 3. Start & Test

```bash
# Start server
uvicorn app.main:app --reload

# Test health check
curl http://localhost:8000/health
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `database_schema.sql` | Complete SQL schema |
| `app/models/database.py` | CRUD operations (600 lines) |
| `app/models/schema.py` | Pydantic models |
| `app/api/routes/workflow.py` | Workflow endpoints |
| `app/api/routes/chat.py` | Chat endpoints |
| `seed_templates.py` | Sample data script |
| `test_database.py` | Test script |
| `DATABASE_SETUP.md` | Full setup guide |
| `SUPABASE_IMPLEMENTATION_SUMMARY.md` | Implementation details |

---

## 📊 Database Tables

### workflows
- `id`, `name`, `description`, `platform`, `workflow_json`
- `status`, `created_at`, `updated_at`, `created_by`, `tags`, `metadata`

### conversations
- `id`, `session_id`, `workflow_id`, `messages` (JSONB array)
- `platform`, `status`, `created_at`, `updated_at`, `metadata`

### workflow_templates
- `id`, `name`, `description`, `platform`, `trigger_type`, `action_types`
- `json_template`, `usage_count`, `tags`, `category`, `is_public`
- `created_at`, `updated_at`

---

## 🔌 Key Functions

### Workflows
```python
from app.models.database import *

# Create
workflow = await create_workflow({
    "name": "My Workflow",
    "platform": "n8n",
    "workflow_json": {...}
})

# Get
workflow = await get_workflow(workflow_id)

# Update
workflow = await update_workflow(workflow_id, {"status": "active"})

# Delete
success = await delete_workflow(workflow_id)

# List
workflows = await list_workflows(platform="n8n", status="active", limit=50)
```

### Conversations
```python
# Create
conv = await create_conversation({
    "session_id": "session-123",
    "platform": "n8n"
})

# Get
conv = await get_conversation("session-123")

# Add message
conv = await add_message_to_conversation("session-123", {
    "role": "user",
    "content": "Hello"
})
```

### Templates
```python
# Save
template = await save_workflow_template({
    "name": "My Template",
    "platform": "zapier",
    "trigger_type": "webhook",
    "action_types": ["gmail"]
})

# Get
templates = await get_workflow_templates(platform="zapier")
```

---

## 🌐 API Endpoints

### Workflows
- `POST /api/workflow/generate-and-save` - Generate & save
- `GET /api/workflow/workflows` - List (filter: platform, status)
- `GET /api/workflow/workflows/{id}` - Get by ID
- `PUT /api/workflow/workflows/{id}` - Update
- `DELETE /api/workflow/workflows/{id}` - Delete
- `POST /api/workflow/validate` - Validate JSON
- `POST /api/workflow/{id}/export` - Export

### Chat
- `POST /api/chat/message` - Send message (auto-saves)
- `GET /api/chat/history/{session_id}` - Get history

### Templates
- `GET /api/workflow/templates/list` - List templates

### System
- `GET /health` - Health check + DB stats

---

## ⚡ Common Tasks

### Create Workflow via API
```bash
curl -X POST http://localhost:8000/api/workflow/generate-and-save \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "n8n",
    "intent": {
      "trigger": {"app": "webhook"},
      "actions": [{"app": "gmail"}]
    },
    "workflow_name": "My Workflow"
  }'
```

### Send Chat Message
```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to automate emails",
    "session_id": "my-session"
  }'
```

### List Workflows
```bash
curl "http://localhost:8000/api/workflow/workflows?platform=n8n&status=active&limit=10"
```

### Check Health
```bash
curl http://localhost:8000/health
```

---

## 🐛 Troubleshooting

### Can't Connect to Database
```bash
# Check .env file
cat automation-chatbot-backend/.env | grep SUPABASE

# Test connection
curl http://localhost:8000/health
```

### Tables Not Found
```bash
# Re-run schema
# Go to Supabase SQL Editor
# Run database_schema.sql
```

### Import Errors
```bash
# Install dependencies
pip install -r requirements.txt
```

---

## 🔒 Security Checklist

- ✅ Use `SUPABASE_SERVICE_KEY` in backend
- ✅ Never commit `.env` files
- ✅ Enable RLS for production (optional)
- ✅ Use environment variables for secrets
- ✅ Sanitize user inputs (via Pydantic)

---

## 📈 Performance Tips

- ✅ Use indexes (already configured)
- ✅ Use pagination (limit + offset)
- ✅ Cache frequently accessed data
- ✅ Monitor with health endpoint
- ✅ Clean up old conversations periodically

```python
# Cleanup old conversations
from app.models.database import cleanup_old_conversations
deleted = await cleanup_old_conversations(days=30)
```

---

## 🧪 Testing

### Manual Test
```bash
# Run test suite
cd automation-chatbot-backend
python test_database.py
```

### Expected Output
```
✅ Workflow Operations: PASSED
✅ Conversation Operations: PASSED
✅ Template Operations: PASSED
✅ Database Statistics: PASSED
```

---

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Connection failed | Check `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` |
| Tables not found | Run `database_schema.sql` |
| Module not found | Run `pip install -r requirements.txt` |
| Permission denied | Use `SUPABASE_SERVICE_KEY` (not anon key) |
| Data not saving | Check logs for detailed errors |

---

## 📚 Documentation

- **Full Setup:** `DATABASE_SETUP.md`
- **Implementation:** `SUPABASE_IMPLEMENTATION_SUMMARY.md`
- **This Guide:** `SUPABASE_QUICK_REFERENCE.md`

---

## ✅ Status

| Component | Status |
|-----------|--------|
| Database Schema | ✅ Complete |
| CRUD Operations | ✅ Complete |
| API Integration | ✅ Complete |
| Documentation | ✅ Complete |
| Seed Data | ✅ Complete |
| Test Suite | ✅ Complete |

**All systems operational!** 🚀

---

**Need more details?** See `DATABASE_SETUP.md` or `SUPABASE_IMPLEMENTATION_SUMMARY.md`

