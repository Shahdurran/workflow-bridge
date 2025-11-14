"""
Authentication middleware and utilities using Supabase Auth.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.services.supabase_client import get_supabase_client
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

class AuthUser:
    """Authenticated user model."""
    def __init__(self, user_id: str, email: str, metadata: dict = None):
        self.id = user_id
        self.email = email
        self.metadata = metadata or {}
        self.subscription_tier = metadata.get('subscription_tier', 'free')
        self.role = metadata.get('role', 'user')

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthUser:
    """
    Verify JWT token and return current user.
    Raises HTTPException if token is invalid.
    """
    try:
        token = credentials.credentials
        
        # Get Supabase client and verify token
        supabase = get_supabase_client()
        if not supabase:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unavailable"
            )
        response = supabase.auth.get_user(token)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        user = response.user
        return AuthUser(
            user_id=user.id,
            email=user.email,
            metadata=user.user_metadata
        )
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthUser | None:
    """
    Get current user if authenticated, None otherwise.
    Does not raise exception if not authenticated.
    """
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

def require_subscription(min_tier: str = "free"):
    """
    Dependency to check if user has required subscription tier.
    Tiers: free, pro, enterprise
    """
    async def check_subscription(user: AuthUser = Depends(get_current_user)):
        tiers = ["free", "pro", "enterprise"]
        user_tier_index = tiers.index(user.subscription_tier.lower())
        required_tier_index = tiers.index(min_tier.lower())
        
        if user_tier_index < required_tier_index:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This feature requires {min_tier} subscription"
            )
        
        return user
    
    return check_subscription

async def require_admin(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    """
    Dependency to require admin privileges.
    Checks if user has admin role in metadata.
    """
    # Check if user has admin role
    user_role = user.metadata.get('role', 'user')
    
    if user_role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this operation"
        )
    
    return user


