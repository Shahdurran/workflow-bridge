"""
n8n Chat API Routes with Claude AI and n8n-mcp Integration

This module provides streaming chat endpoints for n8n workflow automation
using Claude AI with n8n-mcp tool integration.
"""

import json
import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.claude_service import get_claude_service, ClaudeService
from app.services.n8n_mcp_client import get_mcp_client, N8nMcpClient
from app.services.supabase_client import get_supabase_client
from app.api.dependencies import get_current_user
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    """Request model for chat messages."""
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for history")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "I want to create a workflow that sends me an email when someone fills out my contact form",
                "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class ValidateWorkflowRequest(BaseModel):
    """Request model for workflow validation."""
    workflow: Dict[str, Any] = Field(..., description="Workflow JSON to validate")
    profile: str = Field(default="balanced", description="Validation profile: strict, balanced, or permissive")
    
    class Config:
        json_schema_extra = {
            "example": {
                "workflow": {
                    "name": "My Workflow",
                    "nodes": [],
                    "connections": {}
                },
                "profile": "balanced"
            }
        }


class DeployWorkflowRequest(BaseModel):
    """Request model for workflow deployment."""
    workflow: Dict[str, Any] = Field(..., description="Workflow JSON to deploy")
    conversation_id: Optional[str] = Field(None, description="Associated conversation ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "workflow": {
                    "name": "Email Notification Workflow",
                    "nodes": [],
                    "connections": {}
                },
                "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


async def format_sse_message(event: str, data: Any) -> str:
    """
    Format a Server-Sent Events message.
    
    Args:
        event: Event type
        data: Data to send (will be JSON-encoded)
        
    Returns:
        Formatted SSE message string
    """
    json_data = json.dumps(data) if not isinstance(data, str) else data
    return f"event: {event}\ndata: {json_data}\n\n"


@router.post("/chat")
async def chat_with_claude(
    request: ChatRequest,
    claude_service: ClaudeService = Depends(get_claude_service),
    db: Client = Depends(get_supabase_client),
    current_user: Dict = Depends(get_current_user)
):
    """
    Stream chat responses from Claude AI with n8n-mcp integration.
    
    This endpoint:
    1. Loads conversation history if conversation_id provided
    2. Streams Claude's responses in real-time
    3. Handles tool use for n8n-mcp operations
    4. Extracts and validates workflows
    5. Saves conversation history to Supabase
    
    Args:
        request: Chat request with message and optional conversation_id
        claude_service: Claude AI service instance
        db: Supabase client
        current_user: Current authenticated user
        
    Returns:
        StreamingResponse with Server-Sent Events
    """
    try:
        conversation_id = request.conversation_id or str(uuid.uuid4())
        user_id = current_user.get("user_id", "anonymous")
        
        logger.info(f"Chat request from user {user_id}, conversation {conversation_id}")
        
        # Load conversation history from Supabase
        conversation_history = []
        
        if request.conversation_id:
            try:
                # Fetch existing conversation
                result = db.table("conversations") \
                    .select("*, messages(*)") \
                    .eq("id", conversation_id) \
                    .eq("user_id", user_id) \
                    .single() \
                    .execute()
                
                if result.data:
                    # Convert messages to Claude format
                    messages = result.data.get("messages", [])
                    for msg in sorted(messages, key=lambda x: x["created_at"]):
                        conversation_history.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })
                        
                    logger.info(f"Loaded {len(conversation_history)} messages from history")
                    
            except Exception as e:
                logger.warning(f"Could not load conversation history: {str(e)}")
                # Continue with empty history
        
        # Stream generator
        async def event_generator():
            accumulated_text = ""
            workflow_data = None
            message_id = str(uuid.uuid4())
            
            try:
                # Send start event
                yield await format_sse_message("start", {
                    "conversation_id": conversation_id,
                    "message_id": message_id
                })
                
                # Stream from Claude
                async for chunk in claude_service.chat(
                    user_message=request.message,
                    conversation_history=conversation_history
                ):
                    chunk_type = chunk.get("type")
                    
                    if chunk_type == "message":
                        # Text message chunk
                        text = chunk.get("content", "")
                        accumulated_text += text
                        
                        yield await format_sse_message("message", {
                            "text": text
                        })
                    
                    elif chunk_type == "tool_use":
                        # Tool being called
                        yield await format_sse_message("tool_use", {
                            "tool_name": chunk.get("tool_name"),
                            "tool_input": chunk.get("tool_input")
                        })
                    
                    elif chunk_type == "tool_result":
                        # Tool completed
                        yield await format_sse_message("tool_result", {
                            "tool_name": chunk.get("tool_name"),
                            "success": True
                        })
                    
                    elif chunk_type == "workflow_clear":
                        # Clear canvas before streaming new workflow
                        yield await format_sse_message("workflow_clear", {})
                    
                    elif chunk_type == "workflow_node":
                        # Individual node for incremental rendering
                        node_data = chunk.get("content", {})
                        yield await format_sse_message("workflow_node", node_data)
                    
                    elif chunk_type == "workflow":
                        # Workflow extracted - store it but don't send yet
                        workflow_data = chunk.get("content")
                        logger.info(f"📦 Workflow data stored, will send after stream completes")
                    
                    elif chunk_type == "error":
                        # Error occurred
                        yield await format_sse_message("error", {
                            "message": chunk.get("content", "An error occurred")
                        })
                
                # Send workflow event AFTER all text is streamed (if we have workflow data)
                if workflow_data:
                    logger.info(f"📤 Sending workflow event with {len(workflow_data.get('nodes', []))} nodes")
                    yield await format_sse_message("workflow", {
                        "workflow": workflow_data
                    })
                    # Small delay to ensure frontend processes it
                    import asyncio
                    await asyncio.sleep(0.1)
                
                # Save conversation to database
                try:
                    # Try to save to database (skip if tables don't exist)
                    try:
                        # Ensure conversation exists
                        conversation_result = db.table("conversations") \
                            .select("id") \
                            .eq("id", conversation_id) \
                            .execute()
                        
                        if not conversation_result.data:
                            # Create new conversation with session_id
                            db.table("conversations").insert({
                                "id": conversation_id,
                                "session_id": str(uuid.uuid4()),  # Generate session ID
                                "user_id": user_id,
                                "created_at": datetime.utcnow().isoformat(),
                                "updated_at": datetime.utcnow().isoformat()
                            }).execute()
                            
                            logger.info(f"Created new conversation: {conversation_id}")
                        else:
                            # Update existing conversation
                            db.table("conversations").update({
                                "updated_at": datetime.utcnow().isoformat()
                            }).eq("id", conversation_id).execute()
                        
                        # Save user message
                        db.table("messages").insert({
                            "id": str(uuid.uuid4()),
                            "conversation_id": conversation_id,
                            "role": "user",
                            "content": request.message,
                            "created_at": datetime.utcnow().isoformat()
                        }).execute()
                        
                        # Save assistant message
                        db.table("messages").insert({
                            "id": message_id,
                            "conversation_id": conversation_id,
                            "role": "assistant",
                            "content": accumulated_text,
                            "workflow_json": workflow_data,
                            "created_at": datetime.utcnow().isoformat()
                        }).execute()
                        
                        logger.info(f"Saved conversation messages to database")
                    except Exception as db_error:
                        # Database tables don't exist yet - that's OK for MVP
                        logger.warning(f"Could not save to database (tables may not exist): {str(db_error)}")
                        logger.info("Chat will still work - conversation just won't be saved")
                    
                except Exception as e:
                    logger.error(f"Error in database save attempt: {str(e)}")
                    # Don't fail the request if database save fails
                
                # Send completion event
                yield await format_sse_message("done", {
                    "conversation_id": conversation_id,
                    "message_id": message_id
                })
                
            except Exception as e:
                logger.error(f"Error in event generator: {str(e)}")
                yield await format_sse_message("error", {
                    "message": f"Stream error: {str(e)}"
                })
        
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
                "Connection": "keep-alive"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )


@router.post("/validate-workflow")
async def validate_workflow(
    request: ValidateWorkflowRequest,
    mcp_client: N8nMcpClient = Depends(get_mcp_client)
):
    """
    Validate a workflow structure using n8n-mcp.
    
    This endpoint validates workflow JSON for:
    - Structural correctness
    - Node configurations
    - Connection validity
    - Required parameters
    
    Args:
        request: Workflow validation request
        mcp_client: n8n-mcp client instance
        
    Returns:
        Validation results with errors and warnings
    """
    try:
        logger.info("Validating workflow")
        
        result = await mcp_client.validate_workflow(
            workflow=request.workflow,
            profile=request.profile
        )
        
        logger.info(f"Validation complete: {result.get('valid', False)}")
        
        return {
            "valid": result.get("valid", False),
            "errors": result.get("errors", []),
            "warnings": result.get("warnings", []),
            "profile": request.profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating workflow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation error: {str(e)}"
        )


@router.post("/deploy-workflow")
async def deploy_workflow(
    request: DeployWorkflowRequest,
    mcp_client: N8nMcpClient = Depends(get_mcp_client),
    db: Client = Depends(get_supabase_client),
    current_user: Dict = Depends(get_current_user)
):
    """
    Deploy a workflow to n8n instance.
    
    This endpoint:
    1. Validates the workflow first
    2. Deploys to n8n if valid
    3. Saves workflow metadata to Supabase
    4. Returns deployment details
    
    Args:
        request: Workflow deployment request
        mcp_client: n8n-mcp client instance
        db: Supabase client
        current_user: Current authenticated user
        
    Returns:
        Deployment result with workflow ID and URL
    """
    try:
        user_id = current_user.get("user_id", "anonymous")
        
        logger.info(f"Deploying workflow for user {user_id}")
        
        # Step 1: Validate workflow
        validation_result = await mcp_client.validate_workflow(
            workflow=request.workflow,
            profile="balanced"
        )
        
        if not validation_result.get("valid", False):
            errors = validation_result.get("errors", [])
            logger.warning(f"Workflow validation failed: {errors}")
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Workflow validation failed",
                    "errors": errors,
                    "warnings": validation_result.get("warnings", [])
                }
            )
        
        # Step 2: Deploy to n8n
        logger.info("Deploying workflow to n8n...")
        
        deployment_result = await mcp_client.create_workflow(
            workflow=request.workflow
        )
        
        n8n_workflow_id = deployment_result.get("id")
        n8n_workflow_url = deployment_result.get("url")
        
        logger.info(f"Workflow deployed: {n8n_workflow_id}")
        
        # Step 3: Save to Supabase
        try:
            workflow_record = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "conversation_id": request.conversation_id,
                "workflow_data": request.workflow,
                "n8n_workflow_id": n8n_workflow_id,
                "n8n_workflow_url": n8n_workflow_url,
                "deployed_at": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }
            
            db.table("n8n_workflows").insert(workflow_record).execute()
            
            logger.info("Workflow metadata saved to database")
            
        except Exception as e:
            logger.error(f"Error saving workflow metadata: {str(e)}")
            # Don't fail deployment if database save fails
        
        return {
            "success": True,
            "workflow_id": n8n_workflow_id,
            "workflow_url": n8n_workflow_url,
            "message": "Workflow deployed successfully to n8n"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deploying workflow: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Deployment error: {str(e)}"
        )


@router.get("/conversations")
async def list_conversations(
    db: Client = Depends(get_supabase_client),
    current_user: Dict = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """
    List user's conversation history.
    
    Args:
        db: Supabase client
        current_user: Current authenticated user
        limit: Maximum number of conversations to return
        offset: Offset for pagination
        
    Returns:
        List of conversations with metadata
    """
    try:
        user_id = current_user.get("user_id", "anonymous")
        
        result = db.table("conversations") \
            .select("id, created_at, updated_at") \
            .eq("user_id", user_id) \
            .order("updated_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        conversations = result.data or []
        
        # Get message counts
        for conv in conversations:
            count_result = db.table("messages") \
                .select("id", count="exact") \
                .eq("conversation_id", conv["id"]) \
                .execute()
            
            conv["message_count"] = count_result.count or 0
        
        return {
            "conversations": conversations,
            "total": len(conversations),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversations: {str(e)}"
        )


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    db: Client = Depends(get_supabase_client),
    current_user: Dict = Depends(get_current_user)
):
    """
    Get a specific conversation with all messages.
    
    Args:
        conversation_id: Conversation ID
        db: Supabase client
        current_user: Current authenticated user
        
    Returns:
        Conversation with messages
    """
    try:
        user_id = current_user.get("user_id", "anonymous")
        
        result = db.table("conversations") \
            .select("*, messages(*)") \
            .eq("id", conversation_id) \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        return result.data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving conversation: {str(e)}"
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: Client = Depends(get_supabase_client),
    current_user: Dict = Depends(get_current_user)
):
    """
    Delete a conversation and all its messages.
    
    Args:
        conversation_id: Conversation ID
        db: Supabase client
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    try:
        user_id = current_user.get("user_id", "anonymous")
        
        # Verify ownership
        result = db.table("conversations") \
            .select("id") \
            .eq("id", conversation_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
        
        # Delete messages (cascade should handle this, but explicit is safer)
        db.table("messages") \
            .delete() \
            .eq("conversation_id", conversation_id) \
            .execute()
        
        # Delete conversation
        db.table("conversations") \
            .delete() \
            .eq("id", conversation_id) \
            .execute()
        
        logger.info(f"Deleted conversation: {conversation_id}")
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting conversation: {str(e)}"
        )

