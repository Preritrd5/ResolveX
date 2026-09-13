"""
ResolveX Investigations REST Endpoints
Provides deep access to multi-agent investigation results, audit steps, agent runs, and evidence.
"""

from typing import List
from fastapi import APIRouter, HTTPException
from apps.api.app.domain.schemas import (
    ApiResponse,
    InvestigationResult,
    InvestigationStepSchema,
    AgentRunSchema,
    EvidenceItem
)
from apps.api.app.services.investigation_service import investigation_service

router = APIRouter(prefix="/investigations", tags=["Multi-Agent Investigations"])

@router.get("/{id}", response_model=ApiResponse[InvestigationResult])
async def get_investigation_detail(id: str):
    """Retrieves full investigation result by ID"""
    inv = await investigation_service.get_investigation_by_id(id)
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return ApiResponse(data=inv)

@router.get("/{id}/steps", response_model=ApiResponse[List[InvestigationStepSchema]])
async def get_investigation_steps(id: str):
    """Retrieves chronological investigation trace steps"""
    steps = await investigation_service.get_investigation_steps(id)
    return ApiResponse(data=steps, meta={"total": len(steps)})

@router.get("/{id}/agents", response_model=ApiResponse[List[AgentRunSchema]])
async def get_investigation_agents(id: str):
    """Retrieves agent runs for this investigation"""
    agents = await investigation_service.get_investigation_agents(id)
    return ApiResponse(data=agents, meta={"total": len(agents)})

@router.get("/{id}/evidence", response_model=ApiResponse[List[EvidenceItem]])
async def get_investigation_evidence(id: str):
    """Retrieves verified evidence items attached to this investigation"""
    evidence = await investigation_service.get_investigation_evidence(id)
    return ApiResponse(data=evidence, meta={"total": len(evidence)})
