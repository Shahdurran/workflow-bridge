"""
Authentication routes - delegates to Supabase Auth.
Frontend handles auth UI, backend just validates tokens.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.core.auth import get_current_user, AuthUser
from app.services.supabase_client import supabase
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class UserProfile(BaseModel):
    id: str
    email: str
    subscription_tier: str
    workflows_count: int
    created_at: str

@router.get("/me", response_model=UserProfile)
async def get_user_profile(user: AuthUser = Depends(get_current_user)):
    """Get current user profile."""
    try:
        # Get user's workflow count
        result = supabase.table("workflows") \
            .select("id", count="exact") \
            .eq("created_by", user.id) \
            .execute()
        
        workflows_count = result.count if hasattr(result, 'count') else 0
        
        return UserProfile(
            id=user.id,
            email=user.email,
            subscription_tier=user.subscription_tier,
            workflows_count=workflows_count,
            created_at=user.metadata.get('created_at', '')
        )
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile"
        )

@router.post("/refresh")
async def refresh_token(user: AuthUser = Depends(get_current_user)):
    """
    Refresh authentication token.
    Frontend should call Supabase directly for this.
    """
    return {"message": "Token is valid", "user_id": user.id}


