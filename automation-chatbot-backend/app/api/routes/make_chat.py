"""
Make.com Chat API Routes with Claude AI and make-mcp Integration

This module provides streaming chat endpoints for Make.com scenario automation
using Claude AI with make-mcp tool integration.
"""

import json
import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.claude_service import get_claude_service, ClaudeService, MAKE_SYSTEM_PROMPT
from app.services.make_mcp_client import get_make_mcp_client, MakeMcpClient
from app.services.supabase_client import get_supabase_client
from app.api.dependencies import get_current_user
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)


class MakeChatRequest(BaseModel):
    """Request model for Make chat messages."""
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for history")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "I want to create a scenario that sends me a Slack message when someone fills out my Google Form",
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
async def chat_with_claude_make(
    request: MakeChatRequest,
    claude_service: ClaudeService = Depends(get_claude_service),
    make_client: MakeMcpClient = Depends(get_make_mcp_client),
    db: Client = Depends(get_supabase_client),
    current_user: Dict = Depends(get_current_user)
):
    """
    Stream chat responses from Claude AI with make-mcp integration.
    
    This endpoint:
    1. Loads conversation history if conversation_id provided
    2. Streams Claude's responses in real-time
    3. Handles tool use for make-mcp operations
    4. Extracts and validates scenarios
    5. Saves conversation history to Supabase
    
    Args:
        request: Chat request with message and optional conversation_id
        claude_service: Claude AI service instance
        make_client: Make MCP client
        db: Supabase client
        current_user: Current authenticated user
        
    Returns:
        StreamingResponse with Server-Sent Events
    """
    try:
        # Check if Make MCP is configured
        if not make_client.is_configured():
            raise HTTPException(
                status_code=503,
                detail="Make.com integration is not configured. Please configure MAKE_MCP_URL."
            )
        
        conversation_id = request.conversation_id or str(uuid.uuid4())
        user_id = current_user.get("user_id", "anonymous")
        
        logger.info(f"Make chat request from user {user_id}, conversation {conversation_id}")
        
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
            scenario_data = None
            message_id = str(uuid.uuid4())
            
            try:
                # Send start event
                yield await format_sse_message("start", {
                    "conversation_id": conversation_id,
                    "message_id": message_id,
                    "platform": "make"
                })
                
                # Stream from Claude with Make-specific system prompt
                async for chunk in claude_service.chat(
                    user_message=request.message,
                    conversation_history=conversation_history,
                    system_prompt=MAKE_SYSTEM_PROMPT
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
                        # Clear canvas before streaming new scenario
                        yield await format_sse_message("workflow_clear", {})
                    
                    elif chunk_type == "workflow_node":
                        # Individual module for incremental rendering
                        # Convert to workflow_node format for frontend compatibility
                        node_data = chunk.get("content", {})
                        yield await format_sse_message("workflow_node", node_data)
                    
                    elif chunk_type == "workflow":
                        # Scenario extracted - store it
                        scenario_data = chunk.get("content")
                        logger.info(f"📦 Scenario data stored, will send after stream completes")
                    
                    elif chunk_type == "error":
                        # Error occurred
                        yield await format_sse_message("error", {
                            "message": chunk.get("content", "An error occurred")
                        })
                
                # Send scenario event AFTER all text is streamed (if we have scenario data)
                if scenario_data:
                    logger.info(f"📤 Sending scenario event with {len(scenario_data.get('flow', []))} modules")
                    yield await format_sse_message("workflow", {
                        "workflow": scenario_data,
                        "platform": "make"
                    })
                    # Small delay to ensure frontend processes it
                    import asyncio
                    await asyncio.sleep(0.1)
                
                # Save conversation to database
                try:
                    try:
                        # Ensure conversation exists
                        conversation_result = db.table("conversations") \
                            .select("id") \
                            .eq("id", conversation_id) \
                            .execute()
                        
                        if not conversation_result.data:
                            # Create new conversation
                            db.table("conversations").insert({
                                "id": conversation_id,
                                "session_id": str(uuid.uuid4()),
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
                            "workflow_json": scenario_data,
                            "created_at": datetime.utcnow().isoformat()
                        }).execute()
                        
                        logger.info(f"Saved conversation messages to database")
                    except Exception as db_error:
                        logger.warning(f"Could not save to database: {str(db_error)}")
                        logger.info("Chat will still work - conversation just won't be saved")
                    
                except Exception as e:
                    logger.error(f"Error in database save attempt: {str(e)}")
                
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
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in Make chat endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )


@router.post("/validate-scenario")
async def validate_scenario(
    request: Dict[str, Any],
    make_client: MakeMcpClient = Depends(get_make_mcp_client)
):
    """
    Validate a Make scenario structure.
    
    Args:
        request: Validation request with scenario and profile
        make_client: Make MCP client instance
        
    Returns:
        Validation results with errors and warnings
    """
    try:
        logger.info("Validating Make scenario")
        
        result = await make_client.validate_scenario(
            scenario=request.get("scenario", {}),
            profile=request.get("profile", "balanced")
        )
        
        logger.info(f"Validation complete: {result.get('valid', False)}")
        
        return {
            "valid": result.get("valid", False),
            "errors": result.get("errors", []),
            "warnings": result.get("warnings", []),
            "profile": request.get("profile", "balanced")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating scenario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation error: {str(e)}"
        )

