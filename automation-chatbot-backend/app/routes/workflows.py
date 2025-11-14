"""
Workflow API routes for managing and generating workflows.
"""

import logging
from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status, Query

from app.models.schema import (
    Workflow, 
    WorkflowCreate, 
    WorkflowUpdate,
    WorkflowGenerateRequest,
    WorkflowGenerationResponse,
    WorkflowValidationRequest,
    WorkflowValidationResponse,
    WorkflowExportRequest,
    WorkflowExportResponse,
    WorkflowIntent,
    PlatformCapabilities,
    WorkflowGenerationStats
)
from app.services.workflow_generator import WorkflowGenerator, WorkflowGenerationError
from app.services.storage import get_storage_service
from app.api.dependencies import get_workflow_generator
from app.utils.constants import PLATFORMS, PLATFORM_LIMITATIONS, COMMON_TRIGGERS, COMMON_ACTIONS

logger = logging.getLogger(__name__)

router = APIRouter()

# Legacy workflow CRUD endpoints (maintained for compatibility)
@router.get("/", response_model=List[Workflow])
async def get_workflows(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    platform: str = Query(None, description="Filter by platform"),
    storage = Depends(get_storage_service)
):
    """Get all workflows with optional filtering."""
    try:
        workflows = await storage.get_all_workflows()
        
        # Apply platform filter if specified
        if platform:
            workflows = [w for w in workflows if w.platform.lower() == platform.lower()]
        
        # Apply pagination
        total = len(workflows)
        workflows = workflows[offset:offset + limit]
        
        logger.info("Retrieved %d workflows (total: %d)", len(workflows), total)
        return workflows
        
    except Exception as e:
        logger.error("Failed to fetch workflows: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch workflows: {str(e)}"
        )

@router.post("/", response_model=Workflow)
async def create_workflow(
    workflow: WorkflowCreate,
    storage = Depends(get_storage_service)
):
    """Create a new workflow."""
    try:
        new_workflow = await storage.create_workflow(workflow)
        logger.info("Created workflow: %s", new_workflow.id)
        return new_workflow
        
    except Exception as e:
        logger.error("Failed to create workflow: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create workflow: {str(e)}"
        )

@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(
    workflow_id: str,
    storage = Depends(get_storage_service)
):
    """Get a specific workflow by ID."""
    try:
        workflow = await storage.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        return workflow
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to fetch workflow %s: %s", workflow_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch workflow: {str(e)}"
        )

@router.put("/{workflow_id}", response_model=Workflow)
async def update_workflow(
    workflow_id: str,
    workflow: WorkflowUpdate,
    storage = Depends(get_storage_service)
):
    """Update a workflow."""
    try:
        updated_workflow = await storage.update_workflow(workflow_id, workflow)
        if not updated_workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        logger.info("Updated workflow: %s", workflow_id)
        return updated_workflow
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update workflow %s: %s", workflow_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update workflow: {str(e)}"
        )

@router.delete("/{workflow_id}")
async def delete_workflow(
    workflow_id: str,
    storage = Depends(get_storage_service)
):
    """Delete a workflow."""
    try:
        success = await storage.delete_workflow(workflow_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        logger.info("Deleted workflow: %s", workflow_id)
        return {"message": "Workflow deleted successfully", "workflow_id": workflow_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete workflow %s: %s", workflow_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete workflow: {str(e)}"
        )

# New workflow generation endpoints
@router.post("/generate", response_model=WorkflowGenerationResponse)
async def generate_workflow(
    request: WorkflowGenerateRequest,
    generator: WorkflowGenerator = Depends(get_workflow_generator),
    storage = Depends(get_storage_service)
):
    """
    Generate platform-specific workflow JSON from extracted intent.
    
    This endpoint takes the extracted intent from a conversation and generates
    a complete workflow JSON for the specified platform.
    """
    try:
        logger.info("Generating %s workflow from intent", request.platform)
        
        # Validate intent has required information
        if not request.intent.trigger and not request.intent.actions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Intent must contain at least a trigger or actions"
            )
        
        # Generate workflow based on platform
        start_time = datetime.utcnow()
        
        if request.platform == "n8n":
            workflow_json = await generator.generate_n8n_workflow(
                intent=request.intent.dict(),
                parameters=request.parameters
            )
        elif request.platform == "make":
            workflow_json = await generator.generate_make_workflow(
                intent=request.intent.dict(),
                parameters=request.parameters
            )
        elif request.platform == "zapier":
            workflow_json = await generator.generate_zapier_workflow(
                intent=request.intent.dict(),
                parameters=request.parameters
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported platform: {request.platform}"
            )
        
        generation_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        # Determine workflow name
        workflow_name = (
            request.workflow_name or 
            workflow_json.get("name") or 
            workflow_json.get("title") or
            "Generated Workflow"
        )
        
        # TODO: Save generated workflow to database
        # This could be implemented to save successful generations
        # saved_workflow = await storage.create_workflow(...)
        
        logger.info("Successfully generated %s workflow in %.2fms", 
                   request.platform, generation_time)
        
        return WorkflowGenerationResponse(
            success=True,
            workflow=workflow_json,
            platform=request.platform,
            workflow_name=workflow_name,
            validation_status="valid",
            warnings=[],
            metadata={
                "generation_time_ms": generation_time,
                "intent_confidence": request.intent.confidence,
                "node_count": len(workflow_json.get("nodes", workflow_json.get("flow", workflow_json.get("steps", [])))),
                "generated_at": datetime.utcnow().isoformat(),
                "generator_stats": generator.get_generation_stats()
            },
            message=f"Successfully generated {request.platform} workflow"
        )
        
    except WorkflowGenerationError as e:
        logger.error("Workflow generation error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
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

@router.post("/validate", response_model=WorkflowValidationResponse)
async def validate_workflow(
    request: WorkflowValidationRequest,
    generator: WorkflowGenerator = Depends(get_workflow_generator)
):
    """
    Validate a workflow JSON against platform-specific requirements.
    
    This endpoint checks if a workflow JSON is valid for the specified platform
    and provides detailed feedback on any issues.
    """
    try:
        logger.info("Validating %s workflow", request.platform)
        
        errors = []
        warnings = []
        suggestions = []
        
        # Basic structure validation
        if request.platform == "n8n":
            generator._validate_n8n_workflow(request.workflow_json)
        elif request.platform == "make":
            generator._validate_make_workflow(request.workflow_json)
        elif request.platform == "zapier":
            generator._validate_zapier_workflow(request.workflow_json)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported platform: {request.platform}"
            )
        
        # Additional validation checks
        node_count = len(request.workflow_json.get("nodes", 
                         request.workflow_json.get("flow", 
                         request.workflow_json.get("steps", []))))
        
        platform_limits = PLATFORM_LIMITATIONS.get(request.platform, {})
        max_nodes = platform_limits.get("max_nodes")
        
        if max_nodes and node_count > max_nodes:
            if request.strict:
                errors.append(f"Too many nodes ({node_count}). Maximum for {request.platform}: {max_nodes}")
            else:
                warnings.append(f"Node count ({node_count}) exceeds recommended limit ({max_nodes})")
        
        # Platform-specific suggestions
        if request.platform == "zapier" and node_count > 2:
            suggestions.append("Consider using Make.com or n8n for complex workflows with multiple steps")
        
        is_valid = len(errors) == 0
        
        logger.info("Workflow validation completed. Valid: %s, Errors: %d, Warnings: %d", 
                   is_valid, len(errors), len(warnings))
        
        return WorkflowValidationResponse(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            platform_specific={
                "node_count": node_count,
                "platform_limits": platform_limits,
                "validation_timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except WorkflowGenerationError as e:
        logger.error("Workflow validation error: %s", str(e))
        return WorkflowValidationResponse(
            is_valid=False,
            errors=[str(e)],
            warnings=[],
            suggestions=["Check the workflow structure and try again"]
        )
    except Exception as e:
        logger.error("Unexpected error validating workflow: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate workflow"
        )

@router.post("/{workflow_id}/export", response_model=WorkflowExportResponse)
async def export_workflow(
    workflow_id: str,
    request: WorkflowExportRequest,
    generator: WorkflowGenerator = Depends(get_workflow_generator),
    storage = Depends(get_storage_service)
):
    """
    Export an existing workflow to a different platform format.
    
    This endpoint takes a stored workflow and converts it to the specified
    platform format for import into that platform.
    """
    try:
        logger.info("Exporting workflow %s to %s format", workflow_id, request.platform)
        
        # Get the existing workflow
        workflow = await storage.get_workflow(workflow_id)
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        # Convert workflow to intent format for regeneration
        intent = {
            "trigger": {"app": workflow.nodes[0].app, "event": workflow.nodes[0].action} if workflow.nodes else None,
            "actions": [{"app": node.app, "event": node.action} for node in workflow.nodes[1:]]
        }
        
        # Generate workflow in target platform format
        if request.platform == "n8n":
            exported_data = await generator.generate_n8n_workflow(intent, {})
        elif request.platform == "make":
            exported_data = await generator.generate_make_workflow(intent, {})
        elif request.platform == "zapier":
            exported_data = await generator.generate_zapier_workflow(intent, {})
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported export platform: {request.platform}"
            )
        
        # Add metadata if requested
        if request.include_metadata:
            exported_data["export_metadata"] = {
                "original_workflow_id": workflow_id,
                "original_platform": workflow.platform,
                "exported_to": request.platform,
                "exported_at": datetime.utcnow().isoformat(),
                "exported_by": "WorkflowBridge"
            }
        
        logger.info("Successfully exported workflow %s to %s", workflow_id, request.platform)
        
        return WorkflowExportResponse(
            workflow_id=workflow_id,
            platform=request.platform,
            format=request.format,
            exported_at=datetime.utcnow(),
            data=exported_data,
            download_url=None  # TODO: Implement file download if needed
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to export workflow %s: %s", workflow_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export workflow: {str(e)}"
        )

# Platform information endpoints
@router.get("/platforms/capabilities", response_model=List[PlatformCapabilities])
async def get_platform_capabilities():
    """Get capabilities and limitations for all supported platforms."""
    try:
        capabilities = []
        
        for platform in PLATFORMS:
            limits = PLATFORM_LIMITATIONS.get(platform, {})
            
            # Get supported apps for this platform
            supported_apps = []
            for app_data in {**COMMON_TRIGGERS, **COMMON_ACTIONS}.values():
                platform_key = f"{platform}_{'type' if platform == 'n8n' else 'module' if platform == 'make' else 'app'}"
                if platform_key in app_data:
                    supported_apps.append(app_data["name"])
            
            capabilities.append(PlatformCapabilities(
                platform_id=platform,
                max_nodes=limits.get("max_nodes"),
                max_connections=limits.get("max_connections"),
                supports_conditional_logic=limits.get("supports_conditional_logic", False),
                supports_loops=limits.get("supports_loops", False),
                supports_error_handling=limits.get("supports_error_handling", False),
                supported_apps=list(set(supported_apps)),
                limitations=limits
            ))
        
        return capabilities
        
    except Exception as e:
        logger.error("Failed to get platform capabilities: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get platform capabilities"
        )

@router.get("/stats", response_model=WorkflowGenerationStats)
async def get_generation_stats(
    generator: WorkflowGenerator = Depends(get_workflow_generator)
):
    """Get workflow generation statistics."""
    try:
        stats = generator.get_generation_stats()
        
        return WorkflowGenerationStats(
            total_generated=stats.get("total_generated", 0),
            platforms=stats.get("platforms", {}),
            success_rate=1.0,  # TODO: Calculate actual success rate
            average_nodes=0.0,  # TODO: Calculate average nodes
            most_common_apps=[],  # TODO: Track most common apps
            generation_time_ms=None
        )
        
    except Exception as e:
        logger.error("Failed to get generation stats: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get generation statistics"
        )

# Legacy export endpoint (maintained for compatibility)
@router.post("/{workflow_id}/export/{platform}")
async def legacy_export_workflow(
    workflow_id: str, 
    platform: str,
    storage = Depends(get_storage_service)
):
    """
    Legacy export endpoint for backward compatibility.
    
    This maintains compatibility with the existing frontend.
    """
    try:
        if platform not in PLATFORMS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid platform. Must be one of: {', '.join(PLATFORMS)}"
            )
        
        # Use the storage service export method for now
        export_data = await storage.export_workflow(workflow_id, platform)
        if not export_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        return export_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to export workflow %s to %s: %s", workflow_id, platform, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export workflow: {str(e)}"
        )