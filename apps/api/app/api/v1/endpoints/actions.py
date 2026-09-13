"""
ResolveX Action Governance & Execution Endpoints
Manages the controlled action catalog, operator approval queues, and immutable audit inspection.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Body
from datetime import datetime, timezone

from apps.api.app.repositories.base_repository import repo
from apps.api.app.services.action_registry import action_registry
from apps.api.app.services.action_executor import action_executor
from apps.api.app.domain.schemas import (
    ApiResponse,
    ApiErrorResponse,
    ActionRegistryItemSchema,
    ActionExecutionResultSchema,
    ActionApprovalRequestSchema
)

router = APIRouter(prefix="/actions", tags=["Action Governance & Execution"])

@router.get("", response_model=ApiResponse[List[ActionRegistryItemSchema]])
async def list_action_catalog():
    """Retrieves the full controlled action registry catalog with risk classifications and requirements"""
    actions = action_registry.list_actions()
    return ApiResponse(data=actions, meta={"total": len(actions)})

@router.get("/executions", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_action_executions(limit: int = 20):
    """Retrieves recent action execution audit records across the organization"""
    records, total = await repo.list_records("action_executions", limit=limit)
    return ApiResponse(data=records, meta={"total": total})

@router.get("/approvals/pending", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_pending_approvals():
    """Retrieves actions pending human operator authorization"""
    records, total = await repo.list_records("action_approvals", filters={"status": "pending"}, limit=50)
    return ApiResponse(data=records, meta={"total": total})

@router.post("/{approval_id}/approve", response_model=ApiResponse[ActionExecutionResultSchema], responses={404: {"model": ApiErrorResponse}})
async def approve_action_endpoint(
    approval_id: str,
    payload: ActionApprovalRequestSchema = Body(...)
):
    """Authorizes and immediately executes a pending high-risk action with post-execution verification"""
    approval = await repo.get_record_by_id("action_approvals", approval_id)
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "APPROVAL_NOT_FOUND", "message": f"Approval request '{approval_id}' not found."}
        )

    if approval.get("status") != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "APPROVAL_ALREADY_DECIDED", "message": f"Approval is already in '{approval.get('status')}' state."}
        )

    now = datetime.now(timezone.utc).isoformat()
    await repo.update_record("action_approvals", approval_id, {
        "status": "approved",
        "decided_at": now,
        "note": payload.note
    })

    # Execute the action with manager authorization bypass
    res = await action_executor.execute_action(
        ticket_id=approval["ticket_id"],
        action_type=approval["action_type"],
        parameters=approval.get("parameters", {}),
        user={"role": "SUPPORT_MANAGER", "email": "operator_approved@resolvex.ai"},
        dry_run=False
    )
    return ApiResponse(data=res)

@router.post("/{approval_id}/reject", response_model=ApiResponse[Dict[str, Any]], responses={404: {"model": ApiErrorResponse}})
async def reject_action_endpoint(
    approval_id: str,
    payload: ActionApprovalRequestSchema = Body(...)
):
    """Rejects a pending action and records operator rationale in audit log"""
    approval = await repo.get_record_by_id("action_approvals", approval_id)
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "APPROVAL_NOT_FOUND", "message": f"Approval request '{approval_id}' not found."}
        )

    now = datetime.now(timezone.utc).isoformat()
    await repo.update_record("action_approvals", approval_id, {
        "status": "rejected",
        "decided_at": now,
        "note": payload.note or "Operator rejected proposed action."
    })
    return ApiResponse(data={"approval_id": approval_id, "status": "rejected", "decided_at": now})

@router.get("/{action_id}/audit", response_model=ApiResponse[Dict[str, Any]], responses={404: {"model": ApiErrorResponse}})
async def get_action_audit_record(action_id: str):
    """Retrieves immutable audit record and before/after verification state for an executed action"""
    record = await repo.get_record_by_id("action_executions", action_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ACTION_AUDIT_NOT_FOUND", "message": f"Action execution '{action_id}' not found."}
        )
    return ApiResponse(data=record)
