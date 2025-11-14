# Running the Application

## Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account (free tier works)

## Backend Setup

```bash
cd automation-chatbot-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_KEY
# - OPENAI_API_KEY (or ANTHROPIC_API_KEY)

# Seed templates (optional but recommended)
python seed_templates.py

# Start server
uvicorn app.main:app --reload --port 8000
```

**Backend will run on:** http://localhost:8000  
**API docs:** http://localhost:8000/docs

## Frontend Setup

```bash
cd automation-chatbot-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit if needed (default should work)
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

**Frontend will run on:** http://localhost:5173 or http://localhost:3000

## Testing the Integration

1. Open http://localhost:5173/test
2. Click **"Run All Tests"** button
3. Verify all tests pass ✅

### Individual Tests

- **Health Check**: Verifies backend is running
- **Chat**: Tests message sending and AI response
- **Workflow Generation**: Creates a workflow from intent
- **Validation**: Validates workflow structure
- **Export**: Downloads workflow as JSON file

## Troubleshooting

### CORS Errors

Ensure `CORS_ORIGINS` in backend `.env` includes your frontend URL:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Connection Refused

- Verify backend is running on port 8000
- Check no other service is using the port
- Try: `curl http://localhost:8000/health`

### 404 Errors

- Verify `API_BASE_URL` in frontend `.env`
- Should be: `VITE_API_BASE_URL=http://localhost:8000`
- Check browser console for actual URL being called

### Database Errors

- Verify Supabase credentials in backend `.env`
- Run `database_schema.sql` in Supabase SQL editor
- Check Supabase dashboard for table existence

### AI Provider Errors

- Ensure you have either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` set
- Check API key is valid and has credits
- Default provider is OpenAI (gpt-4)

## Environment Variables Reference

### Backend (.env)

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# AI Provider (choose one)
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# Optional
AI_PROVIDER=openai  # or anthropic
AI_MODEL=gpt-4      # or claude-3-sonnet-20240229
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Quick Start (One Command)

### Backend
```bash
cd automation-chatbot-backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload
```

### Frontend (in separate terminal)
```bash
cd automation-chatbot-frontend && npm install && npm run dev
```

## Production Deployment

### Backend (Railway/Render/Fly.io)

1. Set environment variables in platform
2. Deploy from Git repository
3. Use start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel/Netlify)

1. Set `VITE_API_BASE_URL` to production backend URL
2. Deploy from Git repository
3. Build command: `npm run build`
4. Output directory: `dist`

## Testing Checklist

- [ ] Backend health check returns 200
- [ ] Chat messages save to database
- [ ] Workflow generation works for all 3 platforms
- [ ] Validation correctly identifies errors
- [ ] Export downloads proper JSON files
- [ ] Frontend displays loading states
- [ ] Errors show user-friendly toast messages
- [ ] All API calls use correct endpoints

## API Endpoints

### Health
- `GET /health` - Health check

### Chat
- `POST /api/chat/message` - Send message
- `GET /api/chat/history/{session_id}` - Get chat history

### Workflows
- `POST /api/workflows/generate` - Generate workflow
- `POST /api/workflows/validate` - Validate workflow
- `GET /api/workflows` - List workflows
- `GET /api/workflows/{id}` - Get workflow by ID
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `POST /api/workflows/{id}/export` - Export workflow

### Platforms
- `GET /api/platforms` - List supported platforms
- `GET /api/platforms/{platform}/capabilities` - Get platform capabilities

### Templates
- `GET /api/templates` - List workflow templates

## Support

For issues, please check:
1. Backend logs in terminal
2. Browser console for frontend errors
3. Network tab in browser dev tools
4. API documentation at http://localhost:8000/docs

