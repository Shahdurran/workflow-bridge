# Automation Chatbot Backend

A FastAPI backend for the workflow automation chatbot application.

## Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **Supabase Integration**: Ready for Supabase database and authentication
- **CORS Support**: Configured for frontend development
- **Modular Structure**: Organized routes, models, and services
- **Type Safety**: Full Pydantic models and type hints

## Project Structure

```
automation-chatbot-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── models/
│   │   ├── __init__.py
│   │   └── schema.py          # Pydantic models
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── workflows.py       # Workflow endpoints
│   │   ├── chat.py           # Chat message endpoints
│   │   └── templates.py      # Template endpoints
│   └── services/
│       ├── __init__.py
│       ├── supabase_client.py # Supabase client setup
│       └── storage.py         # Data storage service
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
└── README.md               # This file
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository and navigate to the backend directory:**
   ```bash
   cd automation-chatbot-backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   
   On Windows:
   ```bash
   venv\Scripts\activate
   ```
   
   On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running the Application

1. **Start the development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **The API will be available at:**
   - Main API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

### API Endpoints

#### Health Check
- `GET /` - Root endpoint
- `GET /health` - Health check with Supabase connection status

#### Workflows
- `GET /api/workflows` - Get all workflows
- `POST /api/workflows` - Create a new workflow
- `GET /api/workflows/{id}` - Get a specific workflow
- `PUT /api/workflows/{id}` - Update a workflow
- `DELETE /api/workflows/{id}` - Delete a workflow
- `POST /api/workflows/{id}/export/{platform}` - Export workflow

#### Chat Messages
- `GET /api/chat/{workflow_id}/messages` - Get chat messages for a workflow
- `POST /api/chat/{workflow_id}/messages` - Create a new chat message
- `DELETE /api/chat/{workflow_id}/messages/{message_id}` - Delete a chat message

#### Templates
- `GET /api/templates` - Get all workflow templates
- `GET /api/templates/{id}` - Get a specific template

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_KEY` | Your Supabase service key | No |
| `API_HOST` | API host (default: 0.0.0.0) | No |
| `API_PORT` | API port (default: 8000) | No |
| `DEBUG` | Enable debug mode (default: True) | No |
| `CORS_ORIGINS` | Allowed CORS origins | No |

## Development

### Adding New Endpoints

1. Create or modify route files in `app/routes/`
2. Add corresponding Pydantic models in `app/models/schema.py`
3. Update the storage service in `app/services/storage.py`
4. Include the router in `app/main.py`

### Database Integration

Currently using in-memory storage. To integrate with Supabase:

1. Set up your Supabase project and database tables
2. Update the `StorageService` class to use Supabase client
3. Replace in-memory operations with Supabase queries

### Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

## Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Railway/Render/Heroku

1. Set environment variables in your deployment platform
2. Ensure `requirements.txt` is in the root directory
3. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
