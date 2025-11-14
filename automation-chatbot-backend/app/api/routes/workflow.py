"""
Workflow API routes for generating and validating workflow JSON.

This module provides endpoints for generating platform-specific workflow JSON
from conversation context and validating workflow configurations.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, Field
from datetime import datetime
import json
import logging

from app.api.dependencies import get_db, get_workflow_validator
from app.services.workflow_generator import WorkflowGenerator
from app.services.validator import WorkflowValidator
from app.models.schema import Workflow, WorkflowCreate
from app.core.auth import get_current_user, AuthUser, require_subscription
from app.services.supabase_client import get_supabase_client
from app.core.config import settings
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)


class WorkflowGenerationRequest(BaseModel):
    """Request model for workflow generation."""
    session_id: str = Field(..., description="Conversation session ID")
    platform: str = Field(..., description="Target platform (n8n, make, zapier)")
    requirements: Optional[Dict[str, Any]] = Field(None, description="Additional requirements")
    template_id: Optional[str] = Field(None, description="Base template to use")


class WorkflowGenerationResponse(BaseModel):
    """Response model for workflow generation."""
    workflow_json: Dict[str, Any] = Field(..., description="Generated workflow JSON")
    platform: str = Field(..., description="Target platform")
    validation_status: str = Field(..., description="Validation result")
    warnings: Optional[list] = Field(None, description="Validation warnings")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class WorkflowValidationRequest(BaseModel):
    """Request model for workflow validation."""
    workflow_json: Dict[str, Any] = Field(..., description="Workflow JSON to validate")
    platform: str = Field(..., description="Target platform")
    strict: bool = Field(False, description="Enable strict validation mode")
    interaction_id: Optional[str] = Field(None, description="Associated interaction ID for tracking")
    original_workflow: Optional[Dict[str, Any]] = Field(None, description="Original workflow before user edits")
    user_edited: bool = Field(False, description="Whether the workflow was edited by user")


class WorkflowValidationResponse(BaseModel):
    """Response model for workflow validation."""
    is_valid: bool = Field(..., description="Whether workflow is valid")
    errors: list = Field(default_factory=list, description="Validation errors")
    warnings: list = Field(default_factory=list, description="Validation warnings")
    suggestions: list = Field(default_factory=list, description="Improvement suggestions")
    platform_specific: Optional[Dict[str, Any]] = Field(None, description="Platform-specific validation results")


@router.post("/generate", response_model=WorkflowGenerationResponse)
async def generate_workflow(
    request: WorkflowGenerationRequest,
    user: AuthUser = Depends(get_current_user),
    db: Client = Depends(get_db)
) -> WorkflowGenerationResponse:
    """
    Generate platform-specific workflow JSON from conversation context.
    
    Requires authentication. Free tier limited to 5 workflows.
    
    This endpoint analyzes the conversation history to extract workflow requirements
    and generates appropriate JSON configuration for the specified platform.
    
    Args:
        request: Workflow generation request with session and platform info
        user: Authenticated user
        db: Database client dependency
        
    Returns:
        WorkflowGenerationResponse: Generated workflow JSON with validation status
        
    Raises:
        HTTPException: If generation fails or session not found
        
    TODO: Implement conversation analysis
    TODO: Add platform-specific generation logic
    TODO: Integrate with AI service for intelligent generation
    TODO: Add template-based generation
    TODO: Implement workflow optimization
    """
    try:
        # Check usage limits based on subscription tier
        if user.subscription_tier == 'free':
            # Check if user has reached free tier limit (5 workflows)
            result = db.table("workflows") \
                .select("id", count="exact") \
                .eq("created_by", user.id) \
                .execute()
            
            workflows_count = result.count if hasattr(result, 'count') else 0
            if workflows_count >= 5:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Free tier limit reached (5 workflows). Upgrade to Pro for unlimited workflows."
                )
        
        # Validate platform
        supported_platforms = ["n8n", "make", "zapier"]
        if request.platform not in supported_platforms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported platform. Supported: {supported_platforms}"
            )
        
        # Initialize services
        generator = WorkflowGenerator()
        validator = WorkflowValidator()
        
        # TODO: Load conversation context from database
        # TODO: Extract workflow requirements from conversation
        # TODO: Apply template if specified
        # TODO: Generate platform-specific JSON
        # TODO: Validate generated workflow
        # TODO: Apply optimizations
        # TODO: Save generated workflow to database
        
        # Placeholder workflow generation
        if request.platform == "n8n":
            workflow_json = await generator.generate_n8n_workflow(
                session_id=request.session_id,
                requirements=request.requirements
            )
        elif request.platform == "make":
            workflow_json = await generator.generate_make_workflow(
                session_id=request.session_id,
                requirements=request.requirements
            )
        elif request.platform == "zapier":
            workflow_json = await generator.generate_zapier_workflow(
                session_id=request.session_id,
                requirements=request.requirements
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid platform specified"
            )
        
        # Validate generated workflow
        validation_result = await validator.validate_workflow(
            workflow_json=workflow_json,
            platform=request.platform
        )
        
        return WorkflowGenerationResponse(
            workflow_json=workflow_json,
            platform=request.platform,
            validation_status="valid" if validation_result.is_valid else "invalid",
            warnings=validation_result.warnings,
            metadata={
                "generated_at": "2024-01-01T00:00:00Z",
                "session_id": request.session_id,
                "template_used": request.template_id
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate workflow: {str(e)}"
        )


@router.post("/validate", response_model=WorkflowValidationResponse)
async def validate_workflow_endpoint(
    request: WorkflowValidationRequest,
    validator: WorkflowValidator = Depends(get_workflow_validator),
    user: Optional[AuthUser] = Depends(get_current_user)
) -> WorkflowValidationResponse:
    """
    Validate workflow JSON against platform schema.
    
    This endpoint validates workflow JSON configuration against the specified
    platform's schema and requirements, providing detailed feedback.
    
    Args:
        request: Workflow validation request with JSON and platform
        validator: Workflow validator dependency
        user: Optional authenticated user
        
    Returns:
        WorkflowValidationResponse: Detailed validation results
        
    Raises:
        HTTPException: If validation service fails
    """
    start_time = datetime.utcnow()
    
    try:
        # Validate platform
        supported_platforms = ["n8n", "make", "zapier"]
        if request.platform not in supported_platforms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported platform. Supported: {supported_platforms}"
            )
        
        logger.info(f"Validating workflow for platform: {request.platform}")
        
        # Perform validation
        validation_result = await validator.validate_workflow(
            workflow_json=request.workflow_json,
            platform=request.platform,
            strict=request.strict
        )
        
        # Calculate validation score (0-100)
        validation_score = 100.0
        if validation_result.errors:
            validation_score -= len(validation_result.errors) * 20
        if validation_result.warnings:
            validation_score -= len(validation_result.warnings) * 5
        validation_score = max(0.0, validation_score)
        
        # Calculate validation time
        validation_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Log validation results for training data
        if settings.enable_data_collection:
            try:
                from app.services.data_collector import DataCollector
                supabase_client = get_supabase_client()
                data_collector = DataCollector(supabase_client)
                
                # Get training_data_id from interaction_id if provided
                training_data_id = None
                if request.interaction_id:
                    result = supabase_client.table('training_data').select('id').eq(
                        'interaction_id', request.interaction_id
                    ).execute()
                    if result.data:
                        training_data_id = result.data[0]['id']
                
                # Calculate edit diff if user edited
                edit_diff = None
                if request.user_edited and request.original_workflow:
                    try:
                        # Simple diff - compare keys and values
                        edit_diff = {
                            'added_fields': [],
                            'removed_fields': [],
                            'modified_fields': []
                        }
                        
                        original_keys = set(request.original_workflow.keys())
                        edited_keys = set(request.workflow_json.keys())
                        
                        edit_diff['added_fields'] = list(edited_keys - original_keys)
                        edit_diff['removed_fields'] = list(original_keys - edited_keys)
                        
                        for key in original_keys & edited_keys:
                            if request.original_workflow[key] != request.workflow_json[key]:
                                edit_diff['modified_fields'].append(key)
                    except Exception as e:
                        logger.warning(f"Failed to calculate edit diff: {e}")
                
                # Log validation
                await data_collector.log_workflow_validation(
                    training_data_id=training_data_id,
                    workflow_id=request.workflow_json.get('id', 'unknown'),
                    platform=request.platform,
                    validation_passed=validation_result.is_valid,
                    validation_score=validation_score,
                    errors=[{'message': err} for err in validation_result.errors] if validation_result.errors else [],
                    warnings=[{'message': warn} for warn in validation_result.warnings] if validation_result.warnings else [],
                    user_edited=request.user_edited,
                    original_workflow=request.original_workflow,
                    edited_workflow=request.workflow_json if request.user_edited else None,
                    edit_diff=edit_diff,
                    validator_version='1.0',
                    validation_time_ms=validation_time_ms,
                )
                
                logger.info(f"Logged validation results for platform {request.platform} "
                           f"(passed: {validation_result.is_valid}, edited: {request.user_edited})")
                
            except Exception as e:
                logger.error(f"Failed to log validation results: {e}")
        
        # Convert dataclass to response model
        return WorkflowValidationResponse(
            is_valid=validation_result.is_valid,
            errors=validation_result.errors,
            warnings=validation_result.warnings,
            suggestions=validation_result.suggestions,
            platform_specific=validation_result.platform_specific
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate workflow: {str(e)}"
        )


@router.get("/templates")
async def list_workflow_templates(
    platform: Optional[str] = None,
    category: Optional[str] = None,
    db: Client = Depends(get_db)
) -> dict:
    """
    List available workflow templates.
    
    This endpoint returns available workflow templates, optionally filtered
    by platform and category.
    
    Args:
        platform: Filter by platform (n8n, make, zapier)
        category: Filter by category (marketing, productivity, etc.)
        db: Database client dependency
        
    Returns:
        dict: List of available templates with metadata
        
    TODO: Implement template database queries
    TODO: Add template categorization
    TODO: Include template metadata and previews
    TODO: Add template popularity metrics
    """
    try:
        # TODO: Query templates from database
        # TODO: Apply platform and category filters
        # TODO: Include template metadata
        # TODO: Add usage statistics
        
        return {
            "templates": [],
            "total": 0,
            "platforms": ["n8n", "make", "zapier"],
            "categories": ["marketing", "productivity", "e-commerce", "communication"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list templates: {str(e)}"
        )


@router.post("/{workflow_id}/export")
async def export_workflow_endpoint(
    workflow_id: str,
    platform: str,
    user: AuthUser = Depends(get_current_user),
    format: str = "json",
    validator: WorkflowValidator = Depends(get_workflow_validator),
    db: Client = Depends(get_db)
):
    """
    Export workflow as downloadable file.
    
    This endpoint exports a workflow in the format required by the
    specified platform, ready for import as a downloadable file.
    
    Args:
        workflow_id: ID of workflow to export
        platform: Target platform for export (n8n, make, zapier)
        format: Export format (json, yaml)
        validator: Workflow validator dependency
        db: Database client dependency
        
    Returns:
        Response: Downloadable file with workflow JSON
        
    Raises:
        HTTPException: If export fails or workflow not found
    """
    try:
        # Validate platform
        supported_platforms = ["n8n", "make", "zapier"]
        if platform not in supported_platforms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported platform. Supported: {supported_platforms}"
            )
        
        logger.info(f"Exporting workflow {workflow_id} for platform: {platform}")
        
        # TODO: Load workflow from database
        # For now, create a mock workflow based on platform
        if platform == "n8n":
            workflow_json = {
                "name": f"Exported n8n Workflow - {workflow_id[:8]}",
                "nodes": [
                    {
                        "id": "trigger-1",
                        "name": "Trigger",
                        "type": "n8n-nodes-base.webhook",
                        "typeVersion": 1,
                        "position": [250, 300],
                        "parameters": {}
                    },
                    {
                        "id": "action-1",
                        "name": "Action",
                        "type": "n8n-nodes-base.httpRequest",
                        "typeVersion": 1,
                        "position": [450, 300],
                        "parameters": {}
                    }
                ],
                "connections": {
                    "Trigger": {
                        "main": [[{"node": "Action", "type": "main", "index": 0}]]
                    }
                },
                "active": False,
                "settings": {},
                "tags": []
            }
        elif platform == "make":
            workflow_json = {
                "name": f"Exported Make Scenario - {workflow_id[:8]}",
                "flow": [
                    {
                        "id": 1,
                        "module": "webhook:webhook",
                        "version": 1,
                        "parameters": {},
                        "metadata": {}
                    },
                    {
                        "id": 2,
                        "module": "http:request",
                        "version": 1,
                        "parameters": {},
                        "mapper": {},
                        "metadata": {}
                    }
                ],
                "metadata": {
                    "version": 1
                }
            }
        elif platform == "zapier":
            workflow_json = {
                "title": f"Exported Zap - {workflow_id[:8]}",
                "steps": [
                    {
                        "id": "trigger-1",
                        "type": "trigger",
                        "app": "webhook",
                        "event": "catch_hook",
                        "parameters": {}
                    },
                    {
                        "id": "action-1",
                        "type": "action",
                        "app": "webhook",
                        "event": "post",
                        "parameters": {}
                    }
                ],
                "status": "draft"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid platform specified"
            )
        
        # Validate workflow before export
        validation_result = await validator.validate_workflow(
            workflow_json=workflow_json,
            platform=platform
        )
        
        # Log warnings but don't block export
        if validation_result.warnings:
            logger.warning(f"Export warnings: {validation_result.warnings}")
        
        # Only block on errors
        if not validation_result.is_valid:
            logger.error(f"Export blocked due to validation errors: {validation_result.errors}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Workflow validation failed: {', '.join(validation_result.errors)}"
            )
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{platform}_workflow_{workflow_id[:8]}_{timestamp}.json"
        
        # Format content
        if format == "json":
            content = json.dumps(workflow_json, indent=2)
            media_type = "application/json"
        elif format == "yaml":
            try:
                import yaml
                content = yaml.dump(workflow_json, default_flow_style=False)
                media_type = "application/x-yaml"
                filename = filename.replace(".json", ".yaml")
            except ImportError:
                logger.warning("YAML export requested but pyyaml not installed, falling back to JSON")
                content = json.dumps(workflow_json, indent=2)
                media_type = "application/json"
        else:
            content = json.dumps(workflow_json, indent=2)
            media_type = "application/json"
        
        logger.info(f"Successfully exported workflow {workflow_id} as {filename}")
        
        # Return as downloadable file
        return Response(
            content=content,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "X-Workflow-ID": workflow_id,
                "X-Platform": platform,
                "X-Validation-Status": "valid" if validation_result.is_valid else "invalid"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export workflow: {str(e)}"
        )
