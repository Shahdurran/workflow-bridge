"""
Feedback API routes for collecting user feedback and managing training data.

This module provides endpoints for:
- Submitting user feedback on workflows
- Viewing storage statistics
- Manually triggering data archiving (admin)
- Exporting training datasets
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from datetime import datetime
import logging
import io

from app.api.dependencies import get_db
from app.core.auth import get_current_user, AuthUser, require_admin
from app.services.data_collector import DataCollector
from app.services.supabase_client import get_supabase_client
from app.core.config import settings
from supabase import Client

router = APIRouter()
logger = logging.getLogger(__name__)


class FeedbackSubmitRequest(BaseModel):
    """Request model for submitting feedback."""
    interaction_id: str = Field(..., description="Interaction ID to provide feedback on")
    feedback_type: str = Field(..., description="Type of feedback: thumbs_up, thumbs_down, edit, report")
    feedback_text: Optional[str] = Field(None, description="Optional feedback text")
    sentiment_score: Optional[int] = Field(None, ge=1, le=5, description="Sentiment score 1-5")
    corrected_workflow: Optional[Dict[str, Any]] = Field(None, description="User's corrected workflow")
    correction_notes: Optional[str] = Field(None, description="Notes about corrections")
    issue_category: Optional[str] = Field(None, description="Issue category if reporting: incorrect_workflow, missing_steps, wrong_platform, other")
    session_id: Optional[str] = Field(None, description="Session ID for tracking")


class FeedbackSubmitResponse(BaseModel):
    """Response model for feedback submission."""
    success: bool = Field(..., description="Whether feedback was submitted successfully")
    feedback_id: Optional[str] = Field(None, description="Feedback record ID")
    message: str = Field(..., description="Success or error message")


class StorageStatsResponse(BaseModel):
    """Response model for storage statistics."""
    overview: Dict[str, Any] = Field(..., description="Overview statistics")
    storage: Dict[str, Any] = Field(..., description="Storage usage details")
    costs: Dict[str, Any] = Field(..., description="Cost estimates")
    by_platform: Dict[str, Any] = Field(..., description="Platform-specific statistics")
    training_readiness: Dict[str, Any] = Field(..., description="Training readiness per platform")
    recommendations: list = Field(..., description="Recommendations for improvement")


class ArchiveRequest(BaseModel):
    """Request model for manual archiving."""
    days_old: int = Field(default=30, ge=1, le=365, description="Archive data older than this many days")
    dry_run: bool = Field(default=False, description="Preview what would be archived without actually archiving")


class ArchiveResponse(BaseModel):
    """Response model for archiving operation."""
    success: bool = Field(..., description="Whether archiving succeeded")
    archived_count: int = Field(..., description="Number of records archived")
    archives: Optional[list] = Field(None, description="List of archives created")
    message: str = Field(..., description="Success or error message")


class ExportRequest(BaseModel):
    """Request model for exporting training data."""
    success_only: bool = Field(default=True, description="Only export successful interactions")
    with_feedback_only: bool = Field(default=False, description="Only export interactions with user feedback")
    output_format: str = Field(default="openai", description="Export format: openai")


@router.post("/submit", response_model=FeedbackSubmitResponse)
async def submit_feedback(
    request: FeedbackSubmitRequest,
    user: AuthUser = Depends(get_current_user),
    db: Client = Depends(get_db)
) -> FeedbackSubmitResponse:
    """
    Submit user feedback on a workflow interaction.
    
    This endpoint allows users to provide valuable feedback on AI-generated workflows,
    which is used to improve the model's performance.
    
    Args:
        request: Feedback submission request
        user: Authenticated user
        db: Database client dependency
        
    Returns:
        FeedbackSubmitResponse: Feedback submission result
        
    Raises:
        HTTPException: If submission fails or interaction not found
    """
    if not settings.enable_data_collection:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Data collection is currently disabled"
        )
    
    # Validate feedback type
    valid_feedback_types = ['thumbs_up', 'thumbs_down', 'edit', 'report']
    if request.feedback_type not in valid_feedback_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid feedback type. Must be one of: {valid_feedback_types}"
        )
    
    # Validate issue category if reporting
    if request.feedback_type == 'report' and request.issue_category:
        valid_categories = ['incorrect_workflow', 'missing_steps', 'wrong_platform', 'other']
        if request.issue_category not in valid_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid issue category. Must be one of: {valid_categories}"
            )
    
    try:
        # Initialize data collector
        supabase_client = get_supabase_client()
        data_collector = DataCollector(supabase_client)
        
        # Submit feedback
        feedback_id = await data_collector.log_user_feedback(
            interaction_id=request.interaction_id,
            feedback_type=request.feedback_type,
            user_id=user.id,
            feedback_text=request.feedback_text,
            sentiment_score=request.sentiment_score,
            corrected_workflow=request.corrected_workflow,
            correction_notes=request.correction_notes,
            issue_category=request.issue_category,
            session_id=request.session_id,
        )
        
        if feedback_id:
            logger.info(f"User {user.id} submitted {request.feedback_type} feedback for interaction {request.interaction_id}")
            return FeedbackSubmitResponse(
                success=True,
                feedback_id=feedback_id,
                message="Thank you for your feedback! It helps us improve."
            )
        else:
            return FeedbackSubmitResponse(
                success=False,
                message="Failed to submit feedback. Interaction may not exist."
            )
            
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}"
        )


@router.get("/stats", response_model=StorageStatsResponse)
async def get_storage_statistics(
    user: AuthUser = Depends(get_current_user),
    db: Client = Depends(get_db)
) -> StorageStatsResponse:
    """
    Get comprehensive storage statistics and cost estimates.
    
    This endpoint provides detailed information about:
    - Storage usage (active and archived data)
    - Cost estimates and potential savings
    - Platform-specific statistics
    - Training readiness for each platform
    - Recommendations for optimization
    
    Args:
        user: Authenticated user
        db: Database client dependency
        
    Returns:
        StorageStatsResponse: Detailed storage statistics
        
    Raises:
        HTTPException: If statistics retrieval fails
    """
    try:
        # Initialize data collector
        supabase_client = get_supabase_client()
        data_collector = DataCollector(supabase_client)
        
        # Get statistics
        stats = await data_collector.get_storage_stats()
        
        logger.info(f"User {user.id} retrieved storage statistics")
        
        return StorageStatsResponse(
            overview=stats.get('overview', {}),
            storage=stats.get('storage', {}),
            costs=stats.get('costs', {}),
            by_platform=stats.get('by_platform', {}),
            training_readiness=stats.get('training_readiness', {}),
            recommendations=stats.get('recommendations', [])
        )
        
    except Exception as e:
        logger.error(f"Failed to get storage statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )


@router.post("/archive", response_model=ArchiveResponse)
async def archive_training_data(
    request: ArchiveRequest,
    user: AuthUser = Depends(require_admin),
    db: Client = Depends(get_db)
) -> ArchiveResponse:
    """
    Manually trigger archiving of old training data.
    
    This endpoint moves old data from Supabase to S3/R2 storage for cost optimization.
    Requires admin privileges.
    
    Args:
        request: Archive request with age threshold
        user: Authenticated admin user
        db: Database client dependency
        
    Returns:
        ArchiveResponse: Archiving operation result
        
    Raises:
        HTTPException: If archiving fails or user is not admin
    """
    if not settings.archiving_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Data archiving is not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, and S3_SECRET_KEY."
        )
    
    try:
        # Initialize data collector
        supabase_client = get_supabase_client()
        data_collector = DataCollector(supabase_client)
        
        if request.dry_run:
            # Get count of records that would be archived
            from datetime import timedelta
            cutoff_date = datetime.utcnow() - timedelta(days=request.days_old)
            
            result = db.table('training_data').select('id', count='exact').lt(
                'created_at', cutoff_date.isoformat()
            ).is_('archived_at', 'null').execute()
            
            count = result.count if hasattr(result, 'count') else 0
            
            logger.info(f"Admin {user.id} performed dry-run archive check: {count} records would be archived")
            
            return ArchiveResponse(
                success=True,
                archived_count=count,
                message=f"Dry run: {count} records would be archived (older than {request.days_old} days)"
            )
        
        # Perform actual archiving
        archive_result = await data_collector.archive_old_data(days_old=request.days_old)
        
        logger.info(f"Admin {user.id} triggered manual archiving: {archive_result.get('archived_count', 0)} records archived")
        
        return ArchiveResponse(
            success=archive_result.get('success', False),
            archived_count=archive_result.get('archived_count', 0),
            archives=archive_result.get('archives'),
            message=archive_result.get('error') or f"Successfully archived {archive_result.get('archived_count', 0)} records"
        )
        
    except Exception as e:
        logger.error(f"Failed to archive data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive data: {str(e)}"
        )


@router.get("/export/{platform}")
async def export_training_data(
    platform: str,
    success_only: bool = True,
    with_feedback_only: bool = False,
    output_format: str = "openai",
    user: AuthUser = Depends(require_admin),
    db: Client = Depends(get_db)
):
    """
    Export training data as downloadable JSONL file.
    
    This endpoint exports training data in OpenAI fine-tuning format.
    The exported data can be used to train custom models.
    Requires admin privileges.
    
    Args:
        platform: Platform to export data for (n8n, make, zapier)
        success_only: Only export successful interactions
        with_feedback_only: Only export interactions with user feedback
        output_format: Export format (currently only 'openai' supported)
        user: Authenticated admin user
        db: Database client dependency
        
    Returns:
        StreamingResponse: JSONL file for download
        
    Raises:
        HTTPException: If export fails or user is not admin
    """
    # Validate platform
    valid_platforms = ['n8n', 'make', 'zapier']
    if platform not in valid_platforms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid platform. Must be one of: {valid_platforms}"
        )
    
    # Validate format
    if output_format != "openai":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only 'openai' format is currently supported"
        )
    
    try:
        # Initialize data collector
        supabase_client = get_supabase_client()
        data_collector = DataCollector(supabase_client)
        
        # Export data
        jsonl_content = await data_collector.export_training_data(
            platform=platform,
            output_format=output_format,
            success_only=success_only,
            with_feedback_only=with_feedback_only,
        )
        
        if not jsonl_content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No training data available for platform {platform}"
            )
        
        # Create file stream
        file_stream = io.BytesIO(jsonl_content.encode('utf-8'))
        
        # Generate filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"training_data_{platform}_{timestamp}.jsonl"
        
        logger.info(f"Admin {user.id} exported training data for {platform} "
                   f"(success_only: {success_only}, with_feedback: {with_feedback_only})")
        
        return StreamingResponse(
            file_stream,
            media_type="application/x-ndjson",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": "application/x-ndjson"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to export training data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export training data: {str(e)}"
        )


@router.get("/readiness/{platform}")
async def get_training_readiness(
    platform: str,
    user: AuthUser = Depends(get_current_user),
    db: Client = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get training readiness status for a specific platform.
    
    This endpoint checks if there's enough quality data to train a custom model
    for the specified platform.
    
    Args:
        platform: Platform to check (n8n, make, zapier, or 'all')
        user: Authenticated user
        db: Database client dependency
        
    Returns:
        Dict with readiness information and recommendations
        
    Raises:
        HTTPException: If check fails
    """
    # Validate platform
    valid_platforms = ['n8n', 'make', 'zapier', 'all']
    if platform not in valid_platforms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid platform. Must be one of: {valid_platforms}"
        )
    
    try:
        # Get readiness from database function
        supabase_client = get_supabase_client()
        
        result = supabase_client.rpc('get_training_readiness', {
            'p_platform': platform
        }).execute()
        
        if not result.data:
            return {
                'platform': platform,
                'is_ready': False,
                'total_examples': 0,
                'message': 'No training data available yet'
            }
        
        readiness_data = result.data[0] if isinstance(result.data, list) else result.data
        
        logger.info(f"User {user.id} checked training readiness for {platform}")
        
        return readiness_data
        
    except Exception as e:
        logger.error(f"Failed to get training readiness: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check training readiness: {str(e)}"
        )


@router.delete("/data/{interaction_id}")
async def delete_interaction_data(
    interaction_id: str,
    user: AuthUser = Depends(get_current_user),
    db: Client = Depends(get_db)
) -> Dict[str, str]:
    """
    Delete a user's interaction data (GDPR compliance).
    
    Users can delete their own interaction data. Admins can delete any data.
    
    Args:
        interaction_id: Interaction ID to delete
        user: Authenticated user
        db: Database client dependency
        
    Returns:
        Dict with success message
        
    Raises:
        HTTPException: If deletion fails or user doesn't have permission
    """
    try:
        supabase_client = get_supabase_client()
        
        # Check if interaction belongs to user (or user is admin)
        result = supabase_client.table('training_data').select('user_id').eq(
            'interaction_id', interaction_id
        ).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interaction not found"
            )
        
        interaction_user_id = result.data[0].get('user_id')
        
        # Check permission
        if interaction_user_id != user.id and user.role != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this data"
            )
        
        # Delete the interaction and related data (cascade will handle related records)
        supabase_client.table('training_data').delete().eq(
            'interaction_id', interaction_id
        ).execute()
        
        logger.info(f"User {user.id} deleted interaction {interaction_id}")
        
        return {
            'message': 'Interaction data deleted successfully',
            'interaction_id': interaction_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete interaction data: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete interaction data: {str(e)}"
        )

