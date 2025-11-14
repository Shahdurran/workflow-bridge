"""
Database operations for Supabase integration.

This module provides CRUD operations for workflows, conversations, and templates
using the Supabase client.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from supabase import create_client, Client
from postgrest.exceptions import APIError

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Initialize Supabase client
settings = get_settings()
supabase: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client.
    
    Returns:
        Client: Supabase client instance
        
    Raises:
        ValueError: If Supabase credentials are not configured
    """
    global supabase
    
    if supabase is None:
        if not settings.supabase_url or not settings.supabase_key:
            raise ValueError(
                "Supabase credentials not configured. "
                "Please set SUPABASE_URL and SUPABASE_KEY environment variables."
            )
        
        try:
            supabase = create_client(settings.supabase_url, settings.supabase_key)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise ValueError(f"Failed to connect to Supabase: {str(e)}")
    
    return supabase


# =====================================================================
# WORKFLOW CRUD OPERATIONS
# =====================================================================

async def create_workflow(workflow_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create new workflow in database.
    
    Args:
        workflow_data: Workflow data including name, platform, workflow_json, etc.
        
    Returns:
        dict: Created workflow with id and timestamps
        
    Raises:
        ValueError: If required fields are missing
        APIError: If database operation fails
    """
    try:
        client = get_supabase_client()
        
        # Validate required fields
        required_fields = ["name", "platform", "workflow_json"]
        missing_fields = [field for field in required_fields if field not in workflow_data]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Validate platform
        valid_platforms = ["n8n", "make", "zapier"]
        if workflow_data["platform"] not in valid_platforms:
            raise ValueError(f"Invalid platform. Must be one of: {', '.join(valid_platforms)}")
        
        # Ensure defaults
        workflow_data.setdefault("status", "draft")
        workflow_data.setdefault("tags", [])
        workflow_data.setdefault("metadata", {})
        
        # Insert into database
        response = client.table("workflows").insert(workflow_data).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Created workflow: {response.data[0]['id']}")
            return response.data[0]
        else:
            raise APIError("Failed to create workflow: No data returned")
    
    except APIError as e:
        logger.error(f"Database error creating workflow: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error creating workflow: {str(e)}")
        raise ValueError(f"Failed to create workflow: {str(e)}")


async def get_workflow(workflow_id: str) -> Optional[Dict[str, Any]]:
    """
    Get workflow by ID.
    
    Args:
        workflow_id: UUID of the workflow
        
    Returns:
        dict | None: Workflow data or None if not found
    """
    try:
        client = get_supabase_client()
        
        response = client.table("workflows").select("*").eq("id", workflow_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            logger.info(f"Workflow not found: {workflow_id}")
            return None
    
    except Exception as e:
        logger.error(f"Error retrieving workflow {workflow_id}: {str(e)}")
        raise ValueError(f"Failed to retrieve workflow: {str(e)}")


async def update_workflow(workflow_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update existing workflow.
    
    Args:
        workflow_id: UUID of the workflow
        updates: Dictionary of fields to update
        
    Returns:
        dict | None: Updated workflow or None if not found
    """
    try:
        client = get_supabase_client()
        
        # Remove fields that shouldn't be updated
        updates.pop("id", None)
        updates.pop("created_at", None)
        updates.pop("updated_at", None)  # Handled by database trigger
        
        if not updates:
            raise ValueError("No fields to update")
        
        # Validate platform if being updated
        if "platform" in updates:
            valid_platforms = ["n8n", "make", "zapier"]
            if updates["platform"] not in valid_platforms:
                raise ValueError(f"Invalid platform. Must be one of: {', '.join(valid_platforms)}")
        
        # Update workflow
        response = client.table("workflows").update(updates).eq("id", workflow_id).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Updated workflow: {workflow_id}")
            return response.data[0]
        else:
            logger.info(f"Workflow not found for update: {workflow_id}")
            return None
    
    except APIError as e:
        logger.error(f"Database error updating workflow {workflow_id}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error updating workflow {workflow_id}: {str(e)}")
        raise ValueError(f"Failed to update workflow: {str(e)}")


async def delete_workflow(workflow_id: str) -> bool:
    """
    Delete workflow by ID.
    
    Args:
        workflow_id: UUID of the workflow
        
    Returns:
        bool: True if deleted, False if not found
    """
    try:
        client = get_supabase_client()
        
        # Check if workflow exists
        existing = await get_workflow(workflow_id)
        if not existing:
            return False
        
        # Delete workflow
        response = client.table("workflows").delete().eq("id", workflow_id).execute()
        
        logger.info(f"Deleted workflow: {workflow_id}")
        return True
    
    except Exception as e:
        logger.error(f"Error deleting workflow {workflow_id}: {str(e)}")
        raise ValueError(f"Failed to delete workflow: {str(e)}")


async def list_workflows(
    user_id: Optional[str] = None,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    List workflows with optional filtering.
    
    Args:
        user_id: Filter by user ID (created_by)
        platform: Filter by platform (n8n, make, zapier)
        status: Filter by status (draft, active, archived)
        limit: Maximum number of results (default: 50)
        offset: Number of results to skip (default: 0)
        
    Returns:
        list[dict]: List of workflows
    """
    try:
        client = get_supabase_client()
        
        # Build query
        query = client.table("workflows").select("*")
        
        # Apply filters
        if user_id:
            query = query.eq("created_by", user_id)
        
        if platform:
            query = query.eq("platform", platform)
        
        if status:
            query = query.eq("status", status)
        
        # Apply pagination and ordering
        query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
        
        response = query.execute()
        
        logger.info(f"Retrieved {len(response.data)} workflows")
        return response.data
    
    except Exception as e:
        logger.error(f"Error listing workflows: {str(e)}")
        raise ValueError(f"Failed to list workflows: {str(e)}")


async def search_workflows(search_query: str, limit: int = 20) -> List[Dict[str, Any]]:
    """
    Search workflows by name or description.
    
    Args:
        search_query: Search query string
        limit: Maximum number of results
        
    Returns:
        list[dict]: List of matching workflows
    """
    try:
        client = get_supabase_client()
        
        # Use the database search function
        response = client.rpc("search_workflows", {"search_query": search_query}).limit(limit).execute()
        
        logger.info(f"Search found {len(response.data)} workflows")
        return response.data
    
    except Exception as e:
        logger.error(f"Error searching workflows: {str(e)}")
        # Fallback to simple ilike search
        response = client.table("workflows").select("*").ilike("name", f"%{search_query}%").limit(limit).execute()
        return response.data


# =====================================================================
# CONVERSATION CRUD OPERATIONS
# =====================================================================

async def create_conversation(conversation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create new conversation session.
    
    Args:
        conversation_data: Conversation data including session_id
        
    Returns:
        dict: Created conversation with id and timestamps
    """
    try:
        client = get_supabase_client()
        
        # Validate required fields
        if "session_id" not in conversation_data:
            raise ValueError("session_id is required")
        
        # Ensure defaults
        conversation_data.setdefault("messages", [])
        conversation_data.setdefault("status", "active")
        conversation_data.setdefault("metadata", {})
        
        # Insert into database
        response = client.table("conversations").insert(conversation_data).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Created conversation: {response.data[0]['session_id']}")
            return response.data[0]
        else:
            raise APIError("Failed to create conversation: No data returned")
    
    except APIError as e:
        # Handle duplicate session_id
        if "duplicate key" in str(e).lower():
            logger.warning(f"Conversation already exists: {conversation_data['session_id']}")
            return await get_conversation(conversation_data["session_id"])
        logger.error(f"Database error creating conversation: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise ValueError(f"Failed to create conversation: {str(e)}")


async def get_conversation(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get conversation by session ID.
    
    Args:
        session_id: Session identifier
        
    Returns:
        dict | None: Conversation data or None if not found
    """
    try:
        client = get_supabase_client()
        
        response = client.table("conversations").select("*").eq("session_id", session_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            logger.info(f"Conversation not found: {session_id}")
            return None
    
    except Exception as e:
        logger.error(f"Error retrieving conversation {session_id}: {str(e)}")
        raise ValueError(f"Failed to retrieve conversation: {str(e)}")


async def add_message_to_conversation(session_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add message to conversation history.
    
    Args:
        session_id: Session identifier
        message: Message data with role, content, timestamp
        
    Returns:
        dict: Updated conversation
    """
    try:
        client = get_supabase_client()
        
        # Get current conversation
        conversation = await get_conversation(session_id)
        if not conversation:
            raise ValueError(f"Conversation not found: {session_id}")
        
        # Add timestamp if not present
        if "timestamp" not in message:
            message["timestamp"] = datetime.now().isoformat()
        
        # Append message to messages array
        messages = conversation.get("messages", [])
        messages.append(message)
        
        # Update conversation
        response = client.table("conversations").update({"messages": messages}).eq("session_id", session_id).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Added message to conversation: {session_id}")
            return response.data[0]
        else:
            raise APIError("Failed to add message: No data returned")
    
    except Exception as e:
        logger.error(f"Error adding message to conversation {session_id}: {str(e)}")
        raise ValueError(f"Failed to add message: {str(e)}")


async def update_conversation_status(session_id: str, status: str) -> Optional[Dict[str, Any]]:
    """
    Update conversation status.
    
    Args:
        session_id: Session identifier
        status: New status (active, completed, abandoned)
        
    Returns:
        dict | None: Updated conversation or None if not found
    """
    try:
        client = get_supabase_client()
        
        valid_statuses = ["active", "completed", "abandoned"]
        if status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        response = client.table("conversations").update({"status": status}).eq("session_id", session_id).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Updated conversation status: {session_id} -> {status}")
            return response.data[0]
        else:
            return None
    
    except Exception as e:
        logger.error(f"Error updating conversation status {session_id}: {str(e)}")
        raise ValueError(f"Failed to update conversation status: {str(e)}")


async def link_workflow_to_conversation(session_id: str, workflow_id: str) -> Optional[Dict[str, Any]]:
    """
    Link a workflow to a conversation.
    
    Args:
        session_id: Session identifier
        workflow_id: Workflow UUID
        
    Returns:
        dict | None: Updated conversation or None if not found
    """
    try:
        client = get_supabase_client()
        
        response = client.table("conversations").update({"workflow_id": workflow_id}).eq("session_id", session_id).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Linked workflow {workflow_id} to conversation {session_id}")
            return response.data[0]
        else:
            return None
    
    except Exception as e:
        logger.error(f"Error linking workflow to conversation: {str(e)}")
        raise ValueError(f"Failed to link workflow: {str(e)}")


# =====================================================================
# WORKFLOW TEMPLATE CRUD OPERATIONS
# =====================================================================

async def save_workflow_template(template_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save reusable workflow template.
    
    Args:
        template_data: Template data including name, platform, json_template, etc.
        
    Returns:
        dict: Created template with id and timestamps
    """
    try:
        client = get_supabase_client()
        
        # Validate required fields
        required_fields = ["name", "platform", "trigger_type", "action_types", "json_template"]
        missing_fields = [field for field in required_fields if field not in template_data]
        if missing_fields:
            raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
        
        # Ensure defaults
        template_data.setdefault("usage_count", 0)
        template_data.setdefault("is_public", True)
        template_data.setdefault("tags", [])
        
        # Insert into database
        response = client.table("workflow_templates").insert(template_data).execute()
        
        if response.data and len(response.data) > 0:
            logger.info(f"Created template: {response.data[0]['id']}")
            return response.data[0]
        else:
            raise APIError("Failed to create template: No data returned")
    
    except Exception as e:
        logger.error(f"Error creating template: {str(e)}")
        raise ValueError(f"Failed to create template: {str(e)}")


async def get_workflow_templates(
    platform: Optional[str] = None,
    trigger_type: Optional[str] = None,
    category: Optional[str] = None,
    is_public: bool = True,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get workflow templates with optional filtering.
    
    Args:
        platform: Filter by platform (n8n, make, zapier)
        trigger_type: Filter by trigger type
        category: Filter by category
        is_public: Filter by public/private templates
        limit: Maximum number of results
        
    Returns:
        list[dict]: List of templates
    """
    try:
        client = get_supabase_client()
        
        # Build query
        query = client.table("workflow_templates").select("*")
        
        # Apply filters
        if platform:
            query = query.eq("platform", platform)
        
        if trigger_type:
            query = query.eq("trigger_type", trigger_type)
        
        if category:
            query = query.eq("category", category)
        
        query = query.eq("is_public", is_public)
        
        # Order by usage count and limit
        query = query.order("usage_count", desc=True).limit(limit)
        
        response = query.execute()
        
        logger.info(f"Retrieved {len(response.data)} templates")
        return response.data
    
    except Exception as e:
        logger.error(f"Error retrieving templates: {str(e)}")
        raise ValueError(f"Failed to retrieve templates: {str(e)}")


async def get_template_by_id(template_id: str) -> Optional[Dict[str, Any]]:
    """
    Get template by ID.
    
    Args:
        template_id: UUID of the template
        
    Returns:
        dict | None: Template data or None if not found
    """
    try:
        client = get_supabase_client()
        
        response = client.table("workflow_templates").select("*").eq("id", template_id).execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            return None
    
    except Exception as e:
        logger.error(f"Error retrieving template {template_id}: {str(e)}")
        raise ValueError(f"Failed to retrieve template: {str(e)}")


async def increment_template_usage(template_id: str) -> None:
    """
    Increment usage count for a template.
    
    Args:
        template_id: UUID of the template
    """
    try:
        client = get_supabase_client()
        
        # Get current usage count
        template = await get_template_by_id(template_id)
        if template:
            new_count = template.get("usage_count", 0) + 1
            client.table("workflow_templates").update({"usage_count": new_count}).eq("id", template_id).execute()
            logger.info(f"Incremented usage count for template {template_id} to {new_count}")
    
    except Exception as e:
        logger.error(f"Error incrementing template usage: {str(e)}")
        # Don't raise - this is not critical


# =====================================================================
# UTILITY FUNCTIONS
# =====================================================================

async def get_database_stats() -> Dict[str, Any]:
    """
    Get database statistics.
    
    Returns:
        dict: Statistics including counts and recent activity
    """
    try:
        client = get_supabase_client()
        
        # Get counts
        workflows_count = client.table("workflows").select("*", count="exact").execute().count
        conversations_count = client.table("conversations").select("*", count="exact").execute().count
        templates_count = client.table("workflow_templates").select("*", count="exact").execute().count
        
        return {
            "workflows_count": workflows_count,
            "conversations_count": conversations_count,
            "templates_count": templates_count,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error getting database stats: {str(e)}")
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


async def cleanup_old_conversations(days: int = 30) -> int:
    """
    Cleanup abandoned conversations older than specified days.
    
    Args:
        days: Number of days to keep abandoned conversations
        
    Returns:
        int: Number of conversations deleted
    """
    try:
        client = get_supabase_client()
        
        cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
        
        response = client.table("conversations").delete().eq("status", "abandoned").lt("updated_at", cutoff_date).execute()
        
        deleted_count = len(response.data) if response.data else 0
        logger.info(f"Cleaned up {deleted_count} old conversations")
        
        return deleted_count
    
    except Exception as e:
        logger.error(f"Error cleaning up conversations: {str(e)}")
        return 0
