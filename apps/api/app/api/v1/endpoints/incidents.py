"""
ResolveX Incident Intelligence Endpoints
Provides multi-signal incident detection, graph topologies, state management, and root-cause reconstruction
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status, Body
from apps.api.app.services.incident_service import incident_service
from apps.api.app.services.incident_investigation_service import incident_investigation_service
from apps.api.app.domain.schemas import (
    ApiResponse,
    ApiErrorResponse,
    IncidentSchema,
    IncidentDetailSchema,
    IncidentGraphSchema,
    TimelineEventSchema,
    IncidentStatusUpdateSchema,
    IncidentDetectionResponseSchema,
    BulkActionTargetSchema,
    BulkActionEvaluationSchema,
    BulkActionExecutionRequestSchema,
    BulkActionExecutionResultSchema
)




router = APIRouter(prefix="/incidents", tags=["Incident Intelligence"])

@router.get("", response_model=ApiResponse[List[IncidentSchema]])
async def list_incidents(
    status: Optional[str] = Query(None, description="suspected, emerging, confirmed, resolved, dismissed"),
    severity: Optional[str] = Query(None, description="low, medium, high, critical"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Lists operational incidents with optional filtering by status and severity"""
    incidents, total = await incident_service.list_incidents(status=status, severity=severity, page=page, limit=limit)
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=incidents,
        meta={"page": page, "limit": limit, "total": total, "total_pages": total_pages}
    )

@router.get("/detect", response_model=ApiResponse[IncidentDetectionResponseSchema])
async def detect_incidents_endpoint():
    """Triggers autonomous multi-signal cross-customer correlation scan across tickets and telemetry"""
    results = await incident_service.detect_incidents()
    return ApiResponse(
        data=IncidentDetectionResponseSchema.model_validate(results)
    )

@router.get("/{incident_id}", response_model=ApiResponse[IncidentDetailSchema], responses={404: {"model": ApiErrorResponse}})
async def get_incident_detail(incident_id: str):
    """Retrieves full incident details, blast radius breakdown, explainability, and linked tickets"""
    detail = await incident_service.get_incident(incident_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )
    return ApiResponse(data=detail)

@router.patch("/{incident_id}/status", response_model=ApiResponse[IncidentSchema], responses={400: {"model": ApiErrorResponse}, 404: {"model": ApiErrorResponse}})
async def update_incident_status_endpoint(
    incident_id: str,
    payload: IncidentStatusUpdateSchema = Body(...)
):
    """Updates incident state following state-machine rules (suspected -> emerging -> confirmed -> resolved/dismissed)"""
    success, message, updated_inc = await incident_service.update_incident_status(
        incident_id=incident_id,
        new_status=payload.status,
        note=payload.note
    )
    if not success:
        if "not found" in message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "INCIDENT_NOT_FOUND", "message": message}
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_STATE_TRANSITION", "message": message}
        )
    return ApiResponse(data=updated_inc, meta={"message": message})

@router.get("/{incident_id}/graph", response_model=ApiResponse[IncidentGraphSchema], responses={404: {"model": ApiErrorResponse}})
async def get_incident_graph_endpoint(incident_id: str):
    """Retrieves React Flow nodes and edges for the Incident Customer Impact & Root Cause Graph"""
    detail = await incident_service.get_incident(incident_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )
    graph = await incident_service.get_incident_graph(incident_id)
    return ApiResponse(data=graph)

@router.get("/{incident_id}/timeline", response_model=ApiResponse[List[TimelineEventSchema]], responses={404: {"model": ApiErrorResponse}})
async def get_incident_timeline_endpoint(incident_id: str):
    """Retrieves the chronological audit timeline reconstructing the incident from root error to customer tickets"""
    detail = await incident_service.get_incident(incident_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )
    timeline = await incident_service.get_incident_timeline(incident_id)
    return ApiResponse(data=timeline, meta={"total_events": len(timeline)})

@router.post("/{incident_id}/investigate", response_model=ApiResponse[Dict[str, Any]], responses={404: {"model": ApiErrorResponse}})
async def investigate_incident_endpoint(incident_id: str):
    """Executes AI incident-level root-cause analysis and derivation of safe remediation strategy"""
    try:
        result = await incident_investigation_service.investigate_incident(incident_id)
        return ApiResponse(data=result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": str(e)}
        )

@router.post("/{incident_id}/actions/preview", response_model=ApiResponse[BulkActionEvaluationSchema], responses={404: {"model": ApiErrorResponse}})
async def preview_incident_bulk_action(
    incident_id: str,
    payload: BulkActionExecutionRequestSchema = Body(...)
):
    """Evaluates all linked tickets in an incident for bulk-action safety, identifying eligible vs excluded targets"""
    detail = await incident_service.get_incident(incident_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )

    action_type = payload.action_type
    targets = []
    eligible_count = 0
    excluded_count = 0

    from apps.api.app.services.policy_engine import policy_engine
    from apps.api.app.services.case_context_service import case_context_service

    for t in detail.linked_tickets:
        ctx = await case_context_service.assemble_context(t.id)
        context_dict = {}
        if ctx:
            context_dict["order"] = ctx.linked_order.model_dump() if ctx.linked_order else None
            context_dict["payment"] = ctx.linked_payment.model_dump() if ctx.linked_payment else None
            context_dict["customer"] = ctx.customer.model_dump() if ctx.customer else None

        policy_check = policy_engine.evaluate_policy(
            action_type=action_type,
            ticket=t.model_dump(),
            context=context_dict
        )

        is_eligible = policy_check.allowed
        exclusion_reason = None if is_eligible else policy_check.reason

        if is_eligible:
            eligible_count += 1
        else:
            excluded_count += 1

        targets.append(BulkActionTargetSchema(
            ticket_id=t.id,
            ticket_number=t.ticket_number,
            customer_name=t.customer_name or "Customer",
            is_eligible=is_eligible,
            exclusion_reason=exclusion_reason,
            policy_allowed=policy_check.allowed,
            risk_level=policy_check.risk_level,
            requires_approval=policy_check.required_approval
        ))

    return ApiResponse(data=BulkActionEvaluationSchema(
        incident_id=incident_id,
        action_type=action_type,
        total_targets=len(targets),
        eligible_count=eligible_count,
        excluded_count=excluded_count,
        targets=targets
    ))

@router.post("/{incident_id}/actions/execute", response_model=ApiResponse[BulkActionExecutionResultSchema], responses={404: {"model": ApiErrorResponse}})
async def execute_incident_bulk_action(
    incident_id: str,
    payload: BulkActionExecutionRequestSchema = Body(...)
):
    """Executes safe remediation across verified eligible targets with individual verification and audit logging"""
    detail = await incident_service.get_incident(incident_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INCIDENT_NOT_FOUND", "message": f"Incident '{incident_id}' not found."}
        )

    from apps.api.app.services.action_executor import action_executor
    target_ids = payload.target_ticket_ids or [t.id for t in detail.linked_tickets]
    results = []
    successful_count = 0
    failed_count = 0

    for t_id in target_ids:
        res = await action_executor.execute_action(
            ticket_id=t_id,
            action_type=payload.action_type,
            parameters={"incident_id": incident_id},
            dry_run=False
        )
        if res.verified and res.execution_status == "success":
            successful_count += 1
        else:
            failed_count += 1
        results.append(res)

    return ApiResponse(data=BulkActionExecutionResultSchema(
        incident_id=incident_id,
        action_type=payload.action_type,
        total_executed=len(results),
        successful_count=successful_count,
        failed_count=failed_count,
        results=results
    ))

