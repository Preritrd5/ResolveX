"""
ResolveX Escalation & Human Approval Endpoints
Provides human escalation queues, complete diagnostic handoff packages, and operator resolution workflows.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status, Body
from apps.api.app.services.incident_service import incident_service
from apps.api.app.services.escalation_service import escalation_service
from apps.api.app.domain.schemas import (
    ApiResponse,
    ApiErrorResponse,
    EscalationSchema,
    HumanHandoffPackageSchema
)

router = APIRouter(prefix="/escalations", tags=["Escalations"])

@router.get("", response_model=ApiResponse[List[EscalationSchema]])
async def list_escalations(
    status: Optional[str] = Query(None, description="pending, in_review, resolved"),
    urgency: Optional[str] = Query(None, description="normal, urgent, critical"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Lists human escalation queue records with status and urgency filters"""
    escalations, total = await incident_service.list_escalations(status=status, urgency=urgency, page=page, limit=limit)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=escalations,
        meta={"page": page, "limit": limit, "total": total, "total_pages": total_pages}
    )

@router.get("/{escalation_id}", response_model=ApiResponse[HumanHandoffPackageSchema], responses={404: {"model": ApiErrorResponse}})
async def get_escalation_handoff(escalation_id: str):
    """Retrieves the complete contextual human handoff package for an escalated case"""
    package = await escalation_service.get_escalation_detail(escalation_id)
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ESCALATION_NOT_FOUND", "message": f"Escalation '{escalation_id}' not found."}
        )
    return ApiResponse(data=package)

@router.post("/{escalation_id}/resolve", response_model=ApiResponse[Dict[str, Any]], responses={404: {"model": ApiErrorResponse}})
async def resolve_escalation_endpoint(
    escalation_id: str,
    note: str = Body(..., embed=True)
):
    """Marks an escalation resolved by a human operator with resolution notes"""
    success = await escalation_service.resolve_escalation(escalation_id, note)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ESCALATION_NOT_FOUND", "message": f"Escalation '{escalation_id}' not found."}
        )
    return ApiResponse(data={"escalation_id": escalation_id, "status": "resolved", "note": note})
