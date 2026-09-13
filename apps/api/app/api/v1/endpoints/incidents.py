"""
ResolveX Incident Intelligence Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Query
from apps.api.app.services.incident_service import incident_service
from apps.api.app.domain.schemas import ApiResponse, IncidentSchema

router = APIRouter(prefix="/incidents", tags=["Incident Intelligence"])

@router.get("", response_model=ApiResponse[List[IncidentSchema]])
async def list_incidents(
    status: Optional[str] = Query(None, description="suspected, emerging, confirmed, resolved, dismissed"),
    severity: Optional[str] = Query(None, description="low, medium, high, critical"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    incidents, total = await incident_service.list_incidents(status=status, severity=severity, page=page, limit=limit)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=incidents,
        meta={"page": page, "limit": limit, "total": total, "total_pages": total_pages}
    )
