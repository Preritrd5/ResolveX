"""
ResolveX Escalation & Human Approval Endpoints
"""

from typing import Optional, List
from fastapi import APIRouter, Query
from apps.api.app.services.incident_service import incident_service
from apps.api.app.domain.schemas import ApiResponse, EscalationSchema

router = APIRouter(prefix="/escalations", tags=["Escalations"])

@router.get("", response_model=ApiResponse[List[EscalationSchema]])
async def list_escalations(
    status: Optional[str] = Query(None, description="pending, in_review, resolved"),
    urgency: Optional[str] = Query(None, description="normal, urgent, critical"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    escalations, total = await incident_service.list_escalations(status=status, urgency=urgency, page=page, limit=limit)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=escalations,
        meta={"page": page, "limit": limit, "total": total, "total_pages": total_pages}
    )
