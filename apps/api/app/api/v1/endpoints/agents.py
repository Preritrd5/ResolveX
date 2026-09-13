"""
ResolveX AI Agent Registry Endpoints
Read-only registry of the 12 planned specialist reasoning agents
"""

from typing import List
from fastapi import APIRouter
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import ApiResponse, AgentSchema

router = APIRouter(prefix="/agents", tags=["AI Agent Registry"])

@router.get("", response_model=ApiResponse[List[AgentSchema]])
async def list_agents():
    records, total = await repo.list_records("agents", limit=50)
    agents = [AgentSchema.model_validate(r) for r in records]
    return ApiResponse(
        data=agents,
        meta={"total": len(agents)}
    )
