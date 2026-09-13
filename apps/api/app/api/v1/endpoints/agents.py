"""
ResolveX AI Agent Registry Endpoints
Read-only registry of the 12 planned specialist reasoning agents
"""

from typing import List
from fastapi import APIRouter
from apps.api.app.services.agent_service import agent_service
from apps.api.app.domain.schemas import ApiResponse, AgentWithStatsSchema

router = APIRouter(prefix="/agents", tags=["AI Agent Registry"])

@router.get("", response_model=ApiResponse[List[AgentWithStatsSchema]])
async def list_agents():
    """Returns the agent registry decorated with real runtime execution statistics"""
    agents = await agent_service.list_agents_with_stats()
    return ApiResponse(
        data=agents,
        meta={"total": len(agents)}
    )

