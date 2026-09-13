"""
ResolveX Health & Diagnostics Endpoints
"""

from fastapi import APIRouter
from apps.api.app.core.supabase_client import check_supabase_health
from apps.api.app.domain.schemas import ApiResponse

router = APIRouter(tags=["Health & Version"])

@router.get("/health", response_model=ApiResponse[dict])
async def get_health():
    return ApiResponse(
        data={
            "status": "healthy",
            "service": "ResolveX Backend API",
            "timestamp": "2026-09-13T14:25:00Z"
        }
    )

@router.get("/health/db", response_model=ApiResponse[dict])
async def get_db_health():
    db_status = await check_supabase_health()
    return ApiResponse(data=db_status)

@router.get("/api/version", response_model=ApiResponse[dict])
async def get_version():
    return ApiResponse(
        data={
            "version": "1.0.0-phase1",
            "environment": "development",
            "platform": "ResolveX Autonomous Customer Incident Intelligence",
            "hackathon": "Hack Briven - Build Bengaluru 2026"
        }
    )
