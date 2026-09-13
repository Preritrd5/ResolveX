"""
ResolveX Global Search Endpoint
"""

from fastapi import APIRouter, Query
from apps.api.app.services.search_service import search_service
from apps.api.app.domain.schemas import ApiResponse, GlobalSearchResultSchema

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("", response_model=ApiResponse[GlobalSearchResultSchema])
async def search(
    q: str = Query(..., min_length=1, description="Search term for customers, tickets, incidents, orders, payments"),
    limit: int = Query(5, ge=1, le=20, description="Max results per entity type")
):
    results = await search_service.global_search(query=q, limit_per_entity=limit)
    return ApiResponse(data=results)
