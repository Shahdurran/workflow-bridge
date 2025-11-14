import os
from supabase import create_client, Client
from typing import Optional

# Global Supabase client instance
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    """Get or create Supabase client instance"""
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if supabase_url and supabase_key:
            try:
                _supabase_client = create_client(supabase_url, supabase_key)
            except Exception as e:
                print(f"Failed to initialize Supabase client: {e}")
                return None
        else:
            print("Supabase credentials not found in environment variables")
            return None
    
    return _supabase_client

def reset_supabase_client():
    """Reset the Supabase client (useful for testing)"""
    global _supabase_client
    _supabase_client = None
