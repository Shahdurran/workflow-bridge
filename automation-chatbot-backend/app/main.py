from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os
import logging
from datetime import datetime

from app.api.routes import chat, workflow, platforms, feedback
from app.api.routes import n8n_chat
from app.services.supabase_client import get_supabase_client
from app.services.n8n_mcp_client import get_mcp_client
from app.core.config import settings, get_cors_config, validate_required_settings
from app.models.database import get_database_stats

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format=settings.log_format
)
logger = logging.getLogger(__name__)

# Validate required settings
try:
    validate_required_settings()
    logger.info("Configuration validated successfully")
except ValueError as e:
    logger.error(f"Configuration Error: {e}")
    if settings.is_production:
        raise

# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    debug=settings.debug
)

# Configure CORS
cors_config = get_cors_config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_config["allow_origins"],
    allow_credentials=cors_config["allow_credentials"],
    allow_methods=cors_config["allow_methods"],
    allow_headers=cors_config["allow_headers"],
)

# Add production security headers
if settings.is_production:
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        """Add security headers for production."""
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
    
    logger.info("Production security headers enabled")

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(n8n_chat.router, prefix="/api/n8n", tags=["n8n-chat"])
app.include_router(workflow.router, prefix="/api/workflow", tags=["workflow"])
app.include_router(platforms.router, prefix="/api/platforms", tags=["platforms"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Automation Chatbot API is running!"}

@app.get("/health")
async def health_check():
    """
    Enhanced health check endpoint for production monitoring.
    
    Returns comprehensive health information about the API, database, and services.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": settings.api_version,
        "environment": settings.environment,
    }
    
    # Check database
    try:
        db_client = get_supabase_client()
        stats = await get_database_stats()
        health_status["database"] = {
            "status": "connected",
            "type": "supabase",
            "workflows_count": stats.get("total_workflows", 0),
            "templates_count": stats.get("total_templates", 0)
        }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = {
            "status": "disconnected",
            "error": str(e) if settings.debug else "Connection failed"
        }
        logger.error(f"Database health check failed: {e}")
    
    # Check AI service
    try:
        if settings.openai_configured:
            health_status["ai_service"] = {
                "status": "configured",
                "provider": "openai",
                "model": settings.openai_model
            }
        else:
            health_status["ai_service"] = {
                "status": "not_configured"
            }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["ai_service"] = {
            "status": "error",
            "error": str(e) if settings.debug else "Service check failed"
        }
        logger.error(f"AI service health check failed: {e}")
    
    # Check Claude AI service
    try:
        if settings.claude_configured:
            health_status["claude_service"] = {
                "status": "configured",
                "provider": "anthropic",
                "model": settings.claude_model
            }
        else:
            health_status["claude_service"] = {
                "status": "not_configured"
            }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["claude_service"] = {
            "status": "error",
            "error": str(e) if settings.debug else "Service check failed"
        }
        logger.error(f"Claude service health check failed: {e}")
    
    # Check n8n-mcp service
    try:
        mcp_client = get_mcp_client()
        # Try to call health check
        mcp_health = await mcp_client.health_check()
        health_status["n8n_mcp"] = {
            "status": "connected",
            "url": settings.n8n_mcp_url,
            "response": mcp_health
        }
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["n8n_mcp"] = {
            "status": "disconnected",
            "url": settings.n8n_mcp_url,
            "error": str(e) if settings.debug else "Connection failed"
        }
        logger.error(f"n8n-mcp health check failed: {e}")
    
    # Check n8n instance
    try:
        if settings.n8n_configured:
            health_status["n8n"] = {
                "status": "configured",
                "url": settings.n8n_api_url
            }
        else:
            health_status["n8n"] = {
                "status": "not_configured"
            }
    except Exception as e:
        health_status["n8n"] = {
            "status": "error",
            "error": str(e) if settings.debug else "Configuration check failed"
        }
        logger.error(f"n8n configuration check failed: {e}")
    
    # Return appropriate status code
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
