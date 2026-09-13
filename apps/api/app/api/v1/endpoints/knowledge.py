"""
ResolveX Knowledge & Policy Endpoints
Supports RAG search with ChromaDB and PostgreSQL text fallback
"""

from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from apps.api.app.repositories.base_repository import repo
from apps.api.app.services.knowledge_service import knowledge_service
from apps.api.app.domain.schemas import ApiResponse, PolicyDocumentSchema, KnowledgeSnippet, ApiErrorResponse
from apps.api.app.core.config import settings

router = APIRouter(prefix="/knowledge", tags=["Knowledge & Policies"])

@router.get("", response_model=ApiResponse[List[PolicyDocumentSchema]])
async def list_policies():
    records, total = await repo.list_records("policy_documents", limit=50)
    policies = [PolicyDocumentSchema.model_validate(r) for r in records]
    return ApiResponse(
        data=policies,
        meta={"total": len(policies), "rag_engine": "ChromaDB + PostgreSQL RAG"}
    )

@router.get("/search", response_model=ApiResponse[List[KnowledgeSnippet]])
async def search_knowledge(
    q: str = Query(..., min_length=2, description="Search query string"),
    org_id: Optional[str] = Query(None, description="Organization UUID"),
    limit: int = Query(5, ge=1, le=20)
):
    target_org = org_id or settings.DEFAULT_ORG_ID
    snippets = await knowledge_service.search_knowledge(query=q, org_id=target_org, limit=limit)
    return ApiResponse(
        data=snippets,
        meta={"query": q, "total": len(snippets), "org_id": target_org}
    )

@router.get("/{policy_id}", response_model=ApiResponse[PolicyDocumentSchema], responses={404: {"model": ApiErrorResponse}})
async def get_policy(policy_id: str):
    record = await repo.get_record_by_id("policy_documents", policy_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "POLICY_NOT_FOUND", "message": f"Policy document '{policy_id}' not found."}
        )
    return ApiResponse(data=PolicyDocumentSchema.model_validate(record))
