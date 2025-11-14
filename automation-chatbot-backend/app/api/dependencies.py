"""
Dependency injection for FastAPI routes.

This module provides dependency functions for injecting services
and other dependencies into FastAPI route handlers.
"""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, status

from app.services.ai_service import AIService, AIServiceError
from app.services.workflow_generator import WorkflowGenerator, WorkflowGenerationError
from app.services.validator import WorkflowValidator
from app.services.supabase_client import get_supabase_client
from app.services.claude_service import ClaudeService, get_claude_service
from app.services.n8n_mcp_client import N8nMcpClient, get_mcp_client
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Global service instances (singleton pattern)
_ai_service_instance: Optional[AIService] = None
_workflow_generator_instance: Optional[WorkflowGenerator] = None
_workflow_validator_instance: Optional[WorkflowValidator] = None
_claude_service_instance: Optional[ClaudeService] = None
_mcp_client_instance: Optional[N8nMcpClient] = None


async def get_ai_service() -> AIService:
    """
    Dependency injection for AI service.
    
    This function provides a singleton instance of the AIService
    to avoid reinitializing the OpenAI client on every request.
    
    Returns:
        AIService: The AI service instance
        
    Raises:
        HTTPException: If AI service cannot be initialized
    """
    global _ai_service_instance
    
    try:
        if _ai_service_instance is None:
            settings = get_settings()
            
            # Check if OpenAI is configured
            if not settings.openai_configured:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="AI service is not configured. Please set OPENAI_API_KEY."
                )
            
            logger.info("Initializing AI service...")
            _ai_service_instance = AIService()
            logger.info("AI service initialized successfully")
        
        return _ai_service_instance
        
    except AIServiceError as e:
        logger.error("AI service error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error("Unexpected error initializing AI service: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize AI service"
        )


async def get_database_client():
    """
    Dependency injection for database client.
    
    Returns:
        Database client instance (Supabase or other)
        
    Raises:
        HTTPException: If database client cannot be initialized
    """
    try:
        return get_supabase_client()
    except ValueError as e:
        logger.error("Database configuration error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is not configured"
        )
    except Exception as e:
        logger.error("Database connection error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable"
        )


def get_current_settings():
    """
    Dependency injection for application settings.
    
    Returns:
        Settings: Application configuration
    """
    return get_settings()


async def validate_ai_service_health(ai_service: AIService = Depends(get_ai_service)) -> AIService:
    """
    Health check dependency for AI service.
    
    This dependency can be used to ensure the AI service is healthy
    before processing requests that require AI functionality.
    
    Args:
        ai_service: The AI service instance
        
    Returns:
        AIService: The validated AI service instance
        
    Raises:
        HTTPException: If AI service is not healthy
    """
    try:
        # Get token usage stats as a simple health check
        stats = ai_service.get_token_usage_stats()
        logger.debug("AI service health check passed. Stats: %s", stats)
        return ai_service
        
    except Exception as e:
        logger.error("AI service health check failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not responding"
        )


# Rate limiting dependency (placeholder for future implementation)
async def rate_limit_check():
    """
    Rate limiting dependency.
    
    TODO: Implement actual rate limiting logic
    This could use Redis or in-memory storage to track request rates.
    """
    # For now, this is a placeholder
    # In a real implementation, you would:
    # 1. Get client IP or user ID
    # 2. Check current request count
    # 3. Raise HTTPException if limit exceeded
    pass


# Authentication dependency (placeholder for future implementation)
async def get_current_user():
    """
    Authentication dependency.
    
    TODO: Implement actual authentication logic
    This would validate JWT tokens and return user information.
    """
    # For now, this is a placeholder
    # In a real implementation, you would:
    # 1. Extract JWT token from Authorization header
    # 2. Validate and decode the token
    # 3. Return user information or raise HTTPException
    return {"user_id": "anonymous", "role": "user"}


# Conversation session management (placeholder)
async def get_conversation_session(session_id: Optional[str] = None):
    """
    Conversation session dependency.
    
    TODO: Implement conversation session management
    This would handle conversation state and history.
    
    Args:
        session_id: Optional session identifier
        
    Returns:
        Conversation session information
    """
    # For now, return a simple session object
    return {
        "session_id": session_id or "default",
        "created_at": None,
        "message_count": 0
    }


async def get_workflow_generator() -> WorkflowGenerator:
    """
    Dependency injection for workflow generator.
    
    This function provides a singleton instance of the WorkflowGenerator
    to avoid reinitializing on every request.
    
    Returns:
        WorkflowGenerator: The workflow generator instance
        
    Raises:
        HTTPException: If workflow generator cannot be initialized
    """
    global _workflow_generator_instance
    
    try:
        if _workflow_generator_instance is None:
            logger.info("Initializing workflow generator...")
            _workflow_generator_instance = WorkflowGenerator()
            logger.info("Workflow generator initialized successfully")
        
        return _workflow_generator_instance
        
    except WorkflowGenerationError as e:
        logger.error("Workflow generator error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Workflow generator unavailable: {str(e)}"
        )
    except Exception as e:
        logger.error("Unexpected error initializing workflow generator: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize workflow generator"
        )


async def get_workflow_validator() -> WorkflowValidator:
    """
    Dependency injection for workflow validator.
    
    This function provides a singleton instance of the WorkflowValidator
    to avoid reinitializing on every request.
    
    Returns:
        WorkflowValidator: The workflow validator instance
        
    Raises:
        HTTPException: If workflow validator cannot be initialized
    """
    global _workflow_validator_instance
    
    try:
        if _workflow_validator_instance is None:
            logger.info("Initializing workflow validator...")
            _workflow_validator_instance = WorkflowValidator()
            logger.info("Workflow validator initialized successfully")
        
        return _workflow_validator_instance
        
    except Exception as e:
        logger.error("Unexpected error initializing workflow validator: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize workflow validator"
        )


def reset_ai_service():
    """
    Reset the global AI service instance.
    
    This function can be used for testing or when configuration changes.
    """
    global _ai_service_instance
    if _ai_service_instance:
        logger.info("Resetting AI service instance")
        _ai_service_instance.reset_conversation()
        _ai_service_instance = None


def reset_workflow_generator():
    """
    Reset the global workflow generator instance.
    
    This function can be used for testing or when configuration changes.
    """
    global _workflow_generator_instance
    if _workflow_generator_instance:
        logger.info("Resetting workflow generator instance")
        _workflow_generator_instance = None


def reset_workflow_validator():
    """
    Reset the global workflow validator instance.
    
    This function can be used for testing or when configuration changes.
    """
    global _workflow_validator_instance
    if _workflow_validator_instance:
        logger.info("Resetting workflow validator instance")
        _workflow_validator_instance = None


async def get_claude_service_dependency() -> ClaudeService:
    """
    Dependency injection for Claude service.
    
    Returns:
        ClaudeService: The Claude AI service instance
        
    Raises:
        HTTPException: If Claude service cannot be initialized
    """
    global _claude_service_instance
    
    try:
        if _claude_service_instance is None:
            settings = get_settings()
            
            # Check if Claude is configured
            if not settings.claude_configured:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Claude AI service is not configured. Please set ANTHROPIC_API_KEY."
                )
            
            logger.info("Initializing Claude service...")
            _claude_service_instance = get_claude_service()
            logger.info("Claude service initialized successfully")
        
        return _claude_service_instance
        
    except ValueError as e:
        logger.error("Claude service configuration error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Claude service configuration error: {str(e)}"
        )
    except Exception as e:
        logger.error("Unexpected error initializing Claude service: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize Claude service"
        )


async def get_mcp_client_dependency() -> N8nMcpClient:
    """
    Dependency injection for n8n-mcp client.
    
    Returns:
        N8nMcpClient: The n8n-mcp client instance
        
    Raises:
        HTTPException: If MCP client cannot be initialized
    """
    global _mcp_client_instance
    
    try:
        if _mcp_client_instance is None:
            logger.info("Initializing n8n-mcp client...")
            _mcp_client_instance = get_mcp_client()
            logger.info("n8n-mcp client initialized successfully")
        
        return _mcp_client_instance
        
    except Exception as e:
        logger.error("Unexpected error initializing n8n-mcp client: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize n8n-mcp client"
        )


# Alias for database client (for consistency with workflow routes)
async def get_db():
    """Alias for get_database_client."""
    return await get_database_client()


# Session validation
async def validate_session_id(session_id: Optional[str] = None) -> str:
    """
    Validate and return session ID.
    
    Args:
        session_id: Optional session ID from request
        
    Returns:
        str: Valid session ID
    """
    import uuid
    if session_id:
        # Validate format
        try:
            uuid.UUID(session_id)
            return session_id
        except ValueError:
            pass
    # Generate new session ID if invalid or not provided
    return str(uuid.uuid4())


# Health check dependencies
async def check_service_health():
    """
    Overall service health check dependency.
    
    Returns:
        dict: Health status of all services
    """
    health_status = {
        "status": "healthy",
        "services": {},
        "timestamp": None
    }
    
    try:
        # Check AI service
        ai_service = await get_ai_service()
        ai_stats = ai_service.get_token_usage_stats()
        health_status["services"]["ai"] = {
            "status": "healthy",
            "model": ai_stats.get("model"),
            "tokens_used": ai_stats.get("total_tokens_used", 0)
        }
    except Exception as e:
        health_status["services"]["ai"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    try:
        # Check database
        db_client = await get_database_client()
        health_status["services"]["database"] = {
            "status": "healthy",
            "type": "supabase"
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    from datetime import datetime
    health_status["timestamp"] = datetime.utcnow().isoformat()
    
    return health_status