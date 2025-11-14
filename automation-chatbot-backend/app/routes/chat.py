"""
Chat API routes for processing user conversations and AI responses.
"""

import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from app.models.schema import ChatMessage, InsertChatMessage
from app.services.ai_service import AIService, AIServiceError, ConversationResponse
from app.services.storage import get_storage_service
from app.api.dependencies import get_ai_service, get_conversation_session

logger = logging.getLogger(__name__)

router = APIRouter()

# Request/Response models for chat API
class MessageRequest(BaseModel):
    """Request model for sending a message to the AI."""
    message: str = Field(..., min_length=1, max_length=2000, description="User message content")
    session_id: Optional[str] = Field(None, description="Conversation session ID")
    context: Optional[dict] = Field(None, description="Additional context for the conversation")
    platform_preference: Optional[str] = Field(None, description="Preferred automation platform")

class MessageResponse(BaseModel):
    """Response model for AI chat messages."""
    message: str = Field(..., description="AI response message")
    session_id: str = Field(..., description="Conversation session ID")
    intent: Optional[dict] = Field(None, description="Extracted workflow intent")
    clarifying_questions: List[str] = Field(default=[], description="Follow-up questions from AI")
    workflow_ready: bool = Field(False, description="Whether workflow is ready to generate")
    suggested_name: Optional[str] = Field(None, description="Suggested workflow name")
    platform_recommendation: Optional[str] = Field(None, description="Recommended platform")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="AI confidence in understanding")
    conversation_stage: str = Field("greeting", description="Current conversation stage")
    metadata: dict = Field(default={}, description="Additional response metadata")

class WorkflowGenerationRequest(BaseModel):
    """Request model for generating workflow JSON."""
    session_id: str = Field(..., description="Conversation session ID")
    platform: str = Field(..., description="Target platform (zapier, make, n8n)")
    workflow_name: Optional[str] = Field(None, description="Custom workflow name")
    parameters: Optional[dict] = Field(None, description="Additional workflow parameters")

class WorkflowGenerationResponse(BaseModel):
    """Response model for generated workflow."""
    workflow_json: dict = Field(..., description="Generated workflow JSON")
    platform: str = Field(..., description="Target platform")
    workflow_name: str = Field(..., description="Workflow name")
    validation_status: str = Field("valid", description="Validation status")
    warnings: List[str] = Field(default=[], description="Validation warnings")
    metadata: dict = Field(default={}, description="Generation metadata")

class ConversationHistoryResponse(BaseModel):
    """Response model for conversation history."""
    session_id: str = Field(..., description="Session ID")
    messages: List[ChatMessage] = Field(..., description="Conversation messages")
    message_count: int = Field(..., description="Total message count")
    created_at: Optional[str] = Field(None, description="Session creation time")
    updated_at: Optional[str] = Field(None, description="Last update time")


@router.post("/message", response_model=MessageResponse)
async def process_message(
    request: MessageRequest,
    ai_service: AIService = Depends(get_ai_service),
    storage = Depends(get_storage_service),
    session = Depends(get_conversation_session)
) -> MessageResponse:
    """
    Process user message and return AI response with workflow intent analysis.
    
    This endpoint handles the main conversation flow:
    1. Saves the user message
    2. Retrieves conversation history
    3. Processes the message with AI service
    4. Saves the AI response
    5. Returns structured response with next steps
    """
    try:
        logger.info("Processing message for session: %s", request.session_id or "new")
        
        # Generate session ID if not provided
        session_id = request.session_id or f"session_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Save user message to storage
        user_message = InsertChatMessage(
            workflowId=session_id,  # Using session_id as workflow_id for conversation tracking
            role="user",
            content=request.message
        )
        
        saved_user_message = await storage.create_chat_message(user_message)
        logger.debug("Saved user message: %s", saved_user_message.id)
        
        # Get conversation history
        conversation_history = await storage.get_chat_messages(session_id)
        
        # Process conversation with AI service
        ai_response: ConversationResponse = await ai_service.process_conversation(
            messages=conversation_history[:-1],  # Exclude the just-added message
            current_message=request.message
        )
        
        # Save AI response to storage
        ai_message = InsertChatMessage(
            workflowId=session_id,
            role="assistant",
            content=ai_response.message
        )
        
        saved_ai_message = await storage.create_chat_message(ai_message)
        logger.debug("Saved AI message: %s", saved_ai_message.id)
        
        # Return structured response
        return MessageResponse(
            message=ai_response.message,
            session_id=session_id,
            intent=ai_response.intent,
            clarifying_questions=ai_response.clarifying_questions,
            workflow_ready=ai_response.workflow_ready,
            suggested_name=ai_response.suggested_name,
            platform_recommendation=ai_response.platform_recommendation,
            confidence=ai_response.confidence,
            conversation_stage=ai_response.conversation_stage,
            metadata={
                **ai_response.metadata,
                "user_message_id": saved_user_message.id,
                "ai_message_id": saved_ai_message.id
            }
        )
        
    except AIServiceError as e:
        logger.error("AI service error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service error: {str(e)}"
        )
    except Exception as e:
        logger.error("Unexpected error processing message: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process message"
        )


@router.post("/generate-workflow", response_model=WorkflowGenerationResponse)
async def generate_workflow(
    request: WorkflowGenerationRequest,
    ai_service: AIService = Depends(get_ai_service),
    storage = Depends(get_storage_service)
) -> WorkflowGenerationResponse:
    """
    Generate platform-specific workflow JSON from conversation intent.
    
    This endpoint takes the extracted intent from a conversation and generates
    a complete workflow JSON for the specified platform.
    """
    try:
        logger.info("Generating workflow for session: %s, platform: %s", 
                   request.session_id, request.platform)
        
        # Get conversation history to extract intent
        conversation_history = await storage.get_chat_messages(request.session_id)
        
        if not conversation_history:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No conversation found for session"
            )
        
        # Extract intent from the last AI response or reprocess the conversation
        # For now, we'll reprocess the last user message to get fresh intent
        user_messages = [msg for msg in conversation_history if msg.role == "user"]
        if not user_messages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No user messages found in conversation"
            )
        
        last_user_message = user_messages[-1].content
        intent = await ai_service.extract_intent(last_user_message, conversation_history[:-1])
        
        # Validate that we have enough information to generate workflow
        if not intent.get("trigger") or not intent.get("actions"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient information to generate workflow. Please provide more details."
            )
        
        # Generate workflow JSON
        workflow_json = await ai_service.generate_workflow_json(
            intent=intent,
            platform=request.platform,
            parameters=request.parameters,
            workflow_name=request.workflow_name
        )
        
        # Determine workflow name
        final_workflow_name = (
            request.workflow_name or 
            workflow_json.get("name") or 
            await ai_service.suggest_workflow_name(intent)
        )
        
        # TODO: Add workflow validation logic here
        validation_status = "valid"
        warnings = []
        
        # Save generated workflow to storage (optional)
        # This could be implemented to save successful generations
        
        return WorkflowGenerationResponse(
            workflow_json=workflow_json,
            platform=request.platform,
            workflow_name=final_workflow_name,
            validation_status=validation_status,
            warnings=warnings,
            metadata={
                "session_id": request.session_id,
                "generated_at": datetime.utcnow().isoformat(),
                "intent_confidence": intent.get("confidence", 0.0),
                "token_usage": ai_service.get_token_usage_stats()
            }
        )
        
    except AIServiceError as e:
        logger.error("AI service error during workflow generation: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Workflow generation failed: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error generating workflow: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate workflow"
        )


@router.get("/history/{session_id}", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    session_id: str,
    storage = Depends(get_storage_service)
) -> ConversationHistoryResponse:
    """
    Get conversation history for a session.
    
    Returns all messages in chronological order for the specified session.
    """
    try:
        logger.debug("Fetching conversation history for session: %s", session_id)
        
        messages = await storage.get_chat_messages(session_id)
        
        if not messages:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No conversation found for session"
            )
        
        # Calculate timestamps
        created_at = messages[0].timestamp if messages else None
        updated_at = messages[-1].timestamp if messages else None
        
        return ConversationHistoryResponse(
            session_id=session_id,
            messages=messages,
            message_count=len(messages),
            created_at=created_at,
            updated_at=updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error fetching conversation history: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch conversation history"
        )


@router.delete("/history/{session_id}")
async def delete_conversation(
    session_id: str,
    storage = Depends(get_storage_service)
) -> dict:
    """
    Delete an entire conversation session.
    
    This removes all messages associated with the session.
    """
    try:
        logger.info("Deleting conversation session: %s", session_id)
        
        # Get messages to check if session exists
        messages = await storage.get_chat_messages(session_id)
        
        if not messages:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No conversation found for session"
            )
        
        # Delete all messages in the session
        # TODO: Implement bulk delete in storage service
        deleted_count = 0
        for message in messages:
            success = await storage.delete_chat_message(message.id)
            if success:
                deleted_count += 1
        
        logger.info("Deleted %d messages from session %s", deleted_count, session_id)
        
        return {
            "message": f"Conversation deleted successfully",
            "session_id": session_id,
            "messages_deleted": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting conversation: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )


@router.get("/sessions")
async def list_conversation_sessions(
    limit: int = 50,
    offset: int = 0,
    storage = Depends(get_storage_service)
) -> dict:
    """
    List all conversation sessions.
    
    TODO: Implement proper session management in storage service.
    For now, this is a placeholder that could be implemented later.
    """
    try:
        # This would require implementing session tracking in the storage service
        # For now, return a placeholder response
        
        return {
            "sessions": [],
            "total": 0,
            "limit": limit,
            "offset": offset,
            "message": "Session listing not yet implemented"
        }
        
    except Exception as e:
        logger.error("Error listing sessions: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list sessions"
        )


@router.get("/health")
async def chat_service_health(
    ai_service: AIService = Depends(get_ai_service)
) -> dict:
    """
    Health check endpoint for chat service.
    
    Returns the status of AI service and token usage statistics.
    """
    try:
        stats = ai_service.get_token_usage_stats()
        
        return {
            "status": "healthy",
            "ai_service": {
                "model": stats.get("model"),
                "tokens_used": stats.get("total_tokens_used", 0),
                "estimated_cost": stats.get("estimated_cost_usd", 0.0)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Chat service health check failed: %s", str(e))
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


# Legacy endpoints for backward compatibility
@router.get("/{workflow_id}/messages", response_model=List[ChatMessage])
async def get_chat_messages(
    workflow_id: str,
    storage = Depends(get_storage_service)
):
    """
    Legacy endpoint: Get all chat messages for a workflow.
    
    This maintains compatibility with the existing frontend.
    """
    try:
        messages = await storage.get_chat_messages(workflow_id)
        return messages
    except Exception as e:
        logger.error("Error fetching messages for workflow %s: %s", workflow_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch chat messages: {str(e)}"
        )


@router.post("/{workflow_id}/messages", response_model=ChatMessage)
async def create_chat_message(
    workflow_id: str, 
    message: InsertChatMessage,
    storage = Depends(get_storage_service)
):
    """
    Legacy endpoint: Create a new chat message for a workflow.
    
    This maintains compatibility with the existing frontend.
    """
    try:
        # Ensure the workflowId in the path matches the message data if provided
        if message.workflowId and message.workflowId != workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow ID in path and body do not match"
            )
        
        # Assign workflowId from path if not provided in body
        if not message.workflowId:
            message.workflowId = workflow_id
        
        new_message = await storage.create_chat_message(message)
        return new_message
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error creating message for workflow %s: %s", workflow_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat message: {str(e)}"
        )