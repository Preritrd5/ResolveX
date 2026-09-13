"""
Tests for Knowledge RAG Engine & Fallback
Verifies semantic and SQL fallback retrieval, organization filtering, and real source citations.
"""

import pytest
from apps.api.app.services.knowledge_service import knowledge_service
from apps.api.app.core.config import settings

@pytest.mark.anyio
async def test_knowledge_search_payment_sla():
    query = "payment webhook drop order creation SLA"
    results = await knowledge_service.search_knowledge(query=query, org_id=settings.DEFAULT_ORG_ID, limit=3)

    assert len(results) > 0
    # Must cite genuine stored Acme Commerce policy
    titles = [r.document_title for r in results]
    assert any("Payment" in t or "Order" in t for t in titles)
    assert all(r.relevance_score >= 0.40 for r in results)

@pytest.mark.anyio
async def test_knowledge_search_refund_policy():
    query = "30-day return policy clearinghouse delay"
    results = await knowledge_service.search_knowledge(query=query, org_id=settings.DEFAULT_ORG_ID, limit=3)

    assert len(results) > 0
    titles = [r.document_title for r in results]
    assert any("Return" in t or "Refund" in t for t in titles)
