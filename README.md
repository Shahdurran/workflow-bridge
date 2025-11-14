# Workflow Automation Bridge

A powerful full-stack application that enables users to create, manage, and export workflow automations across multiple platforms (Zapier, Make, n8n) using conversational AI.

## 🚀 Features

### Core Functionality
- **AI-Powered Workflow Generation**: Chat with AI to describe your automation needs and get platform-specific workflows
- **Multi-Platform Support**: Generate workflows for Zapier, Make (Integromat), and n8n
- **Visual Workflow Editor**: Interactive canvas to visualize and edit workflows
- **Workflow Validation**: Real-time validation ensuring workflows are platform-compliant
- **Template Library**: Pre-built templates for common automation scenarios
- **Export/Import**: Download workflows as JSON or import existing automations
- **Persistent Storage**: All workflows and chat history saved to Supabase

### Tech Stack

#### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 / Anthropic Claude
- **Validation**: Custom rule-based validation system
- **API Docs**: Auto-generated OpenAPI/Swagger docs

#### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **Routing**: Wouter
- **State Management**: React Query
- **HTTP Client**: Axios

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key OR Anthropic API key

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd workflow-bridge
```

### 2. Backend Setup

```bash
cd automation-chatbot-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see below)

# Setup database (run SQL in Supabase)
# Copy contents of database_schema.sql to Supabase SQL editor

# Seed templates (optional)
python seed_templates.py

# Start backend server
uvicorn app.main:app --reload --port 8000
```

**Backend runs at:** http://localhost:8000  
**API Documentation:** http://localhost:8000/docs

### 3. Frontend Setup

```bash
cd automation-chatbot-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env (default should work for local dev)

# Start development server
npm run dev
```

**Frontend runs at:** http://localhost:5173

## 🚀 Production Deployment

### Quick Deploy (15 minutes)

The application is production-ready with comprehensive deployment configurations!

**Recommended Stack:**
- **Backend:** Railway (free 500 hrs/month)
- **Frontend:** Vercel (free 100GB bandwidth)
- **Database:** Supabase (already configured)
- **Total Cost:** $0-10/month

**Deployment Files Included:**
- ✅ `railway.json` - Railway deployment config
- ✅ `Procfile` - Render/Heroku config
- ✅ `render.yaml` - Render service config
- ✅ `vercel.json` - Vercel deployment config
- ✅ `netlify.toml` - Netlify deployment config
- ✅ `Dockerfile` - Docker containers (backend & frontend)
- ✅ `docker-compose.yml` - Multi-container orchestration

**Complete Guides:**
- 📖 **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment (12 pages)
- 🔒 **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** - Security verification (10 pages)
- ✅ **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Go-live checklist (8 pages)
- 📊 **[PRODUCTION_DEPLOYMENT_SUMMARY.md](./PRODUCTION_DEPLOYMENT_SUMMARY.md)** - Complete summary (5 pages)

### Quick Deploy Steps

```bash
# 1. Deploy Backend to Railway (5 min)
Visit: https://railway.app
New Project → Deploy from GitHub → automation-chatbot-backend
Add environment variables → Deploy

# 2. Deploy Frontend to Vercel (5 min)
Visit: https://vercel.com
New Project → Import GitHub → automation-chatbot-frontend
Set VITE_API_BASE_URL → Deploy

# 3. Update CORS (2 min)
Railway dashboard → Add frontend URL to CORS_ORIGINS

# 4. Test (3 min)
Visit: https://your-app.vercel.app/test
Click: "Run All Tests" → Verify all pass ✅
```

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for detailed instructions.

---

## 🔧 Configuration

### Backend Environment Variables

Create `automation-chatbot-backend/.env`:

```env
# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key

# AI Provider (Required - choose one)
OPENAI_API_KEY=sk-...
# OR
ANTHROPIC_API_KEY=sk-ant-...

# AI Configuration (Optional)
AI_PROVIDER=openai  # or anthropic
AI_MODEL=gpt-4      # or claude-3-sonnet-20240229

# CORS (Optional)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend Environment Variables

Create `automation-chatbot-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🧪 Testing

### Run Integration Tests

1. Ensure both backend and frontend are running
2. Navigate to: http://localhost:5173/test
3. Click **"Run All Tests"** button
4. Verify all tests pass ✅

### Test Coverage

- ✅ Health check
- ✅ Chat message sending
- ✅ Workflow generation (Zapier, Make, n8n)
- ✅ Workflow validation
- ✅ Workflow export
- ✅ Database persistence
- ✅ Error handling

## 📖 Usage

### Creating a Workflow

1. **Open the app**: http://localhost:5173
2. **Select a platform**: Choose Zapier, Make, or n8n
3. **Describe your automation**: 
   - "Send an email when a Google Form is submitted"
   - "Create a Slack message when a Trello card is moved"
4. **AI generates workflow**: Review the generated workflow on canvas
5. **Validate**: Automatic validation shows any issues
6. **Export**: Download as JSON to import into your platform

### Using Templates

1. Browse pre-built templates on the home page
2. Click a template to preview
3. Customize parameters
4. Generate workflow

### API Integration

The backend provides RESTful APIs for all operations:

```typescript
// Example: Generate workflow
const response = await fetch('http://localhost:8000/api/workflows/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'zapier',
    intent: {
      trigger: { app: 'Google Forms', event: 'New Response' },
      actions: [{ app: 'Gmail', event: 'Send Email' }]
    },
    parameters: {
      form_id: 'abc123',
      email_recipient: 'user@example.com'
    },
    workflow_name: 'Form to Email'
  })
});
```

## 📚 API Endpoints

### Chat
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history/{session_id}` - Get chat history

### Workflows
- `POST /api/workflows/generate` - Generate workflow
- `POST /api/workflows/validate` - Validate workflow
- `GET /api/workflows` - List workflows
- `GET /api/workflows/{id}` - Get workflow
- `PUT /api/workflows/{id}` - Update workflow
- `DELETE /api/workflows/{id}` - Delete workflow
- `POST /api/workflows/{id}/export` - Export workflow

### Platforms
- `GET /api/platforms` - List supported platforms
- `GET /api/platforms/{platform}/capabilities` - Get capabilities

### Templates
- `GET /api/templates` - List templates

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   React + TS    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│   Backend       │
│   FastAPI       │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│ AI   │  │Supabase│
│ GPT-4│  │ Postgres│
└──────┘  └────────┘
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test` and `pytest`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Create Pull Request

## 🐛 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.11+)
- Verify virtual environment is activated
- Check Supabase credentials in `.env`

### Frontend won't connect
- Ensure backend is running on port 8000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify CORS settings in backend

### Database errors
- Run `database_schema.sql` in Supabase SQL editor
- Check Supabase service role key (not anon key)
- Verify tables exist in Supabase dashboard

### AI errors
- Check API key is valid
- Verify you have credits/quota
- Try switching AI provider (OpenAI ↔ Anthropic)

## 📝 Documentation

- [Running the App](./RUNNING_THE_APP.md) - Detailed setup guide
- [Database Setup](./DATABASE_SETUP.md) - Database configuration
- [Validation System](./automation-chatbot-backend/VALIDATION_README.md) - Workflow validation
- [Supabase Integration](./SUPABASE_IMPLEMENTATION_SUMMARY.md) - Database integration

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)
- AI by [OpenAI](https://openai.com/) / [Anthropic](https://anthropic.com/)

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **API Docs**: http://localhost:8000/docs (when running locally)
- **Test Page**: http://localhost:5173/test

## ⚡ Quick Start

```bash
# Terminal 1 - Backend
cd automation-chatbot-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd automation-chatbot-frontend
npm install && npm run dev

# Visit http://localhost:5173/test to verify integration
```

---

**Built with ❤️ for workflow automation enthusiasts**

