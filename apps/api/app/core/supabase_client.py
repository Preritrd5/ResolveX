"""
ResolveX Supabase Client Manager
Manages server-side connection to Supabase PostgreSQL using service credentials
"""

from typing import Optional
from supabase import create_client, Client
from apps.api.app.core.config import settings
from apps.api.app.core.logging import logger

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        try:
            logger.info("Initializing Supabase client connection...")
            _supabase_client = create_client(
                supabase_url=settings.SUPABASE_URL,
                supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase client initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise e
    return _supabase_client

async def check_supabase_health() -> dict:
    """Verifies connection to Supabase endpoint"""
    try:
        client = get_supabase_client()
        # Ping health or query lightweight table
        res = client.table("organizations").select("id").limit(1).execute()
        return {"status": "connected", "database": "supabase_postgresql", "accessible": True}
    except Exception as e:
        logger.warning(f"Supabase remote check warning: {str(e)}")
        return {"status": "degraded_or_uninitialized", "error": str(e), "accessible": False}
