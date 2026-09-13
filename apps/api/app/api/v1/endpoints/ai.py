"""
ResolveX AI Copilot Endpoints
Handles real-time single-case investigation and grounded response generation
"""

from fastapi import APIRouter, HTTPException, status
from apps.api.app.services.investigation_service import investigation_service
from apps.api.app.domain.schemas import (
    ApiResponse,
    InvestigationResult,
    AIResponse,
    ApiErrorResponse
)

router = APIRouter(prefix="/ai", tags=["AI Copilot & Investigation"])

@router.post("/tickets/{ticket_id}/investigate", response_model=ApiResponse[InvestigationResult], responses={404: {"model": ApiErrorResponse}})
async def investigate_ticket(ticket_id: str, force_rerun: bool = False):
    """
    Executes real multi-agent orchestration via LangGraph DAG:
    Supervisor -> Specialist Agents (parallel) -> Evidence Aggregation -> Synthesis
    Supports idempotent cached return unless force_rerun=True.
    """
    result = await investigation_service.run_investigation(ticket_id, force_rerun=force_rerun)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INVESTIGATION_FAILED", "message": f"Could not orchestrate investigation for ticket '{ticket_id}'."}
        )
    return ApiResponse(
        data=result,
        meta={
            "investigation_id": result.investigation_id,
            "steps_count": len(result.investigation_steps),
            "agents_count": len(result.agent_runs),
            "orchestrator": "LangGraph"
        }
    )

@router.post("/tickets/{ticket_id}/analyze", response_model=ApiResponse[InvestigationResult], responses={404: {"model": ApiErrorResponse}})
async def analyze_ticket(ticket_id: str):
    """
    Executes or returns multi-agent investigation (Phase 2 backward-compatible alias).
    """
    result = await investigation_service.run_investigation(ticket_id, force_rerun=False)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "INVESTIGATION_FAILED", "message": f"Could not analyze ticket '{ticket_id}'."}
        )
    return ApiResponse(
        data=result,
        meta={"investigation_id": result.investigation_id, "provider": result.intent.provider}
    )

@router.post("/tickets/{ticket_id}/response", response_model=ApiResponse[AIResponse], responses={404: {"model": ApiErrorResponse}})
async def generate_response_endpoint(ticket_id: str):
    """
    Generates or regenerates a grounded AI customer support response.
    Never claims actions or database mutations have been executed.
    """
    result = await investigation_service.run_investigation(ticket_id)
    if not result or not result.ai_response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "RESPONSE_GENERATION_FAILED", "message": f"Could not generate response for ticket '{ticket_id}'."}
        )
    return ApiResponse(
        data=result.ai_response,
        meta={"confidence": result.ai_response.confidence, "provider": result.ai_response.provider}
    )
