"""
ResolveX Ticket & Case Endpoints
Includes Case Context retrieval, evidence inspection, routing, and AI filters
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status, Body
from apps.api.app.services.ticket_service import ticket_service
from apps.api.app.services.case_context_service import case_context_service
from apps.api.app.services.investigation_service import investigation_service
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import (
    ApiResponse,
    TicketSchema,
    TicketDetailSchema,
    ApiErrorResponse,
    EvidenceItem,
    RoutingDecision,
    InvestigationResult,
    TicketIncidentCorrelationSchema,
    ResolutionDecisionSchema,
    ActionExecutionRequestSchema,
    ActionExecutionResultSchema,
    HumanHandoffPackageSchema
)

router = APIRouter(prefix="/tickets", tags=["Tickets & Cases"])

@router.get("", response_model=ApiResponse[List[TicketSchema]])
async def list_tickets(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    category: Optional[str] = Query(None, description="Filter by intent category"),
    intent: Optional[str] = Query(None, description="Filter by AI intent"),
    customer_id: Optional[str] = Query(None, description="Filter by customer UUID"),
    ai_resolvable: Optional[bool] = Query(None, description="Filter by AI resolvable flag"),
    team: Optional[str] = Query(None, description="Filter by recommended team"),
    query: Optional[str] = Query(None, description="Search by subject or ticket number"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    tickets, total = await ticket_service.list_tickets(
        status=status,
        priority=priority,
        category=category,
        intent=intent,
        customer_id=customer_id,
        ai_resolvable=ai_resolvable,
        team=team,
        query=query,
        page=page,
        limit=limit
    )
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    return ApiResponse(
        data=tickets,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    )

@router.get("/{ticket_id}", response_model=ApiResponse[TicketDetailSchema], responses={404: {"model": ApiErrorResponse}})
async def get_ticket(ticket_id: str):
    detail = await ticket_service.get_ticket_detail(ticket_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TICKET_NOT_FOUND", "message": f"Ticket '{ticket_id}' not found in organization."}
        )
    return ApiResponse(data=detail)

@router.get("/{ticket_id}/context", response_model=ApiResponse[CaseContext], responses={404: {"model": ApiErrorResponse}})
async def get_ticket_context(ticket_id: str):
    """Retrieves the normalized, strongly typed CaseContext for a ticket"""
    ctx = await case_context_service.assemble_context(ticket_id)
    if not ctx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CONTEXT_NOT_FOUND", "message": f"Unable to assemble CaseContext for ticket '{ticket_id}'."}
        )
    return ApiResponse(data=ctx)

@router.get("/{ticket_id}/evidence", response_model=ApiResponse[List[EvidenceItem]])
async def get_ticket_evidence(ticket_id: str):
    """Retrieves verified evidence items discovered during investigation"""
    evidence = await investigation_service.get_case_evidence(ticket_id)
    return ApiResponse(data=evidence, meta={"total": len(evidence)})

@router.post("/{ticket_id}/route", response_model=ApiResponse[RoutingDecision])
async def route_ticket_endpoint(ticket_id: str):
    """Executes single-case routing determination and persists recommended team"""
    inv = await investigation_service.run_investigation(ticket_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ROUTING_FAILED", "message": f"Failed to compute routing for ticket '{ticket_id}'."}
        )
    return ApiResponse(data=inv.routing)

@router.get("/{ticket_id}/routing", response_model=ApiResponse[RoutingDecision])
async def get_ticket_routing(ticket_id: str):
    """Retrieves existing routing decision or runs analysis if pending"""
    inv = await investigation_service.run_investigation(ticket_id)
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ROUTING_NOT_FOUND", "message": f"Routing record not found for ticket '{ticket_id}'."}
        )
    return ApiResponse(data=inv.routing)

@router.get("/{ticket_id}/investigation", response_model=ApiResponse[InvestigationResult])
async def get_ticket_investigation(ticket_id: str):
    """Retrieves latest multi-agent investigation result, trace steps, and evidence for ticket"""
    inv = await investigation_service.get_investigation_for_ticket(ticket_id)
    if not inv:
        inv = await investigation_service.run_investigation(ticket_id)
        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "INVESTIGATION_NOT_FOUND", "message": f"No investigation found for ticket '{ticket_id}'."}
            )
    return ApiResponse(data=inv)

@router.get("/{ticket_id}/incident", response_model=ApiResponse[TicketIncidentCorrelationSchema])
async def get_ticket_incident_link(ticket_id: str):
    """Retrieves correlation link between ticket and operational incidents"""
    from apps.api.app.services.incident_service import incident_service
    correlation = await incident_service.get_ticket_incident_correlation(ticket_id)
    return ApiResponse(data=correlation)

@router.get("/{ticket_id}/resolve", response_model=ApiResponse[ResolutionDecisionSchema])
@router.post("/{ticket_id}/resolve", response_model=ApiResponse[ResolutionDecisionSchema])
async def evaluate_ticket_resolution(ticket_id: str):
    """Evaluates case evidence, policy gates, and risk to derive a safe resolution decision"""
    from apps.api.app.services.resolution_engine import resolution_engine
    decision = await resolution_engine.evaluate_resolution(ticket_id)
    return ApiResponse(data=decision)


@router.post("/{ticket_id}/actions/preview", response_model=ApiResponse[ActionExecutionResultSchema])
async def preview_ticket_action(
    ticket_id: str,
    payload: ActionExecutionRequestSchema = Body(...)
):
    """Executes dry-run preview of an action without mutating the database"""
    from apps.api.app.services.action_executor import action_executor
    result = await action_executor.execute_action(
        ticket_id=ticket_id,
        action_type=payload.action_type,
        parameters=payload.parameters,
        dry_run=True
    )
    return ApiResponse(data=result)

@router.post("/{ticket_id}/actions/execute", response_model=ApiResponse[ActionExecutionResultSchema])
async def execute_ticket_action(
    ticket_id: str,
    payload: ActionExecutionRequestSchema = Body(...)
):
    """Executes a controlled action with policy gate, verification, and audit logging"""
    from apps.api.app.services.action_executor import action_executor
    result = await action_executor.execute_action(
        ticket_id=ticket_id,
        action_type=payload.action_type,
        parameters=payload.parameters,
        dry_run=payload.dry_run
    )
    return ApiResponse(data=result)

@router.get("/{ticket_id}/actions", response_model=ApiResponse[List[Dict[str, Any]]])
async def list_ticket_actions_history(ticket_id: str):
    """Retrieves immutable audit history of all actions executed for a ticket"""
    from apps.api.app.repositories.base_repository import repo
    records, total = await repo.list_records("action_executions", filters={"ticket_id": ticket_id}, limit=20)
    return ApiResponse(data=records, meta={"total": total})

@router.post("/{ticket_id}/escalate", response_model=ApiResponse[HumanHandoffPackageSchema])
async def escalate_ticket_endpoint(
    ticket_id: str,
    reason: Optional[str] = Query(None, description="Optional custom escalation reason")
):
    """Safely halts automation and generates a complete human handoff package for operator transfer"""
    from apps.api.app.services.escalation_service import escalation_service
    package = await escalation_service.assemble_handoff_package(ticket_id, reason_override=reason)
    return ApiResponse(data=package)


