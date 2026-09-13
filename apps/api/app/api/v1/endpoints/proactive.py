"""
ResolveX Proactive Support & Communication Endpoints
Provides the global proactive support queue, recommendation generation,
human operator approval workflows, and controlled demo dispatch.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Query, Body

from apps.api.app.domain.schemas import (
    ApiResponse,
    ApiErrorResponse,
    ProactiveRecommendationSchema
)
from apps.api.app.services.proactive_service import proactive_service
from apps.api.app.services.incident_service import PRIMARY_INCIDENT_ID

router = APIRouter(prefix="/proactive", tags=["Proactive Support"])

@router.get("", response_model=ApiResponse[List[ProactiveRecommendationSchema]])
async def list_proactive_queue(
    status: Optional[str] = Query(None, description="DRAFTED, APPROVED, SENT, FAILED, CANCELLED")
):
    """Retrieves all proactive support recommendations in the global queue"""
    items = await proactive_service.list_proactive_queue(status=status)
    return ApiResponse(data=items, meta={"total": len(items)})

@router.post("/recommend", response_model=ApiResponse[List[ProactiveRecommendationSchema]])
async def generate_proactive_recommendations(
    incident_id: Optional[str] = Body(None, embed=True)
):
    """Generates proactive recommendations for affected customers based on active incident telemetry"""
    inc_id = incident_id or PRIMARY_INCIDENT_ID
    recs = await proactive_service.get_recommendations_for_incident(inc_id)
    return ApiResponse(data=recs, meta={"generated_count": len(recs), "incident_id": inc_id})

@router.post("/{recommendation_id}/approve", response_model=ApiResponse[ProactiveRecommendationSchema], responses={400: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}})
async def approve_proactive_recommendation(
    recommendation_id: str,
    operator: Optional[str] = Body("support_lead", embed=True)
):
    """Authorizes a pending high-risk or VIP proactive recommendation for dispatch"""
    success, message, rec = await proactive_service.approve_recommendation(
        recommendation_id=recommendation_id,
        operator=operator or "support_lead"
    )
    if not success:
        if "not found" in message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "RECOMMENDATION_NOT_FOUND", "message": message}
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "APPROVAL_FAILED", "message": message}
        )
    return ApiResponse(data=rec, meta={"message": message})

@router.post("/{recommendation_id}/send", response_model=ApiResponse[Dict[str, Any]], responses={400: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}})
async def send_proactive_notification_endpoint(recommendation_id: str):
    """Executes policy-gated controlled demo dispatch of a proactive notification"""
    success, message, receipt = await proactive_service.send_proactive_notification(recommendation_id)
    if not success:
        if "not found" in message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "RECOMMENDATION_NOT_FOUND", "message": message}
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "DISPATCH_FAILED", "message": message}
        )
    return ApiResponse(data=receipt or {}, meta={"message": message})
