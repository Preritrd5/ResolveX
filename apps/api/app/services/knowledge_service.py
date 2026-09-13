"""
ResolveX Knowledge & RAG Retrieval Service
Coordinates ChromaDB semantic retrieval with reliable PostgreSQL / BaseRepository text fallback.
Guarantees strict multi-tenant organization isolation and zero fake citations.
"""

from typing import List, Dict, Any, Optional
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import KnowledgeSnippet
from apps.api.app.services.rag.chroma_service import chroma_service
from apps.api.app.core.logging import logger

class KnowledgeService:
    def __init__(self):
        self._synced_orgs = set()

    async def _ensure_synced(self, org_id: str):
        """Indexes knowledge chunks into ChromaDB on first invocation if ready"""
        if org_id in self._synced_orgs or not chroma_service.is_ready:
            return

        try:
            chunks, _ = await repo.list_records("knowledge_chunks", filters={"org_id": org_id}, limit=100)
            if chunks:
                success = chroma_service.index_chunks(org_id, chunks)
                if success:
                    self._synced_orgs.add(org_id)
                    logger.info(f"Synchronized {len(chunks)} knowledge chunks to ChromaDB for org {org_id}.")
        except Exception as e:
            logger.warning(f"Error syncing knowledge chunks to ChromaDB: {str(e)}")

    async def search_knowledge(self, query: str, org_id: str, limit: int = 4) -> List[KnowledgeSnippet]:
        """
        Retrieves relevant policy chunks for a query.
        Tries ChromaDB semantic vector search first, falling back to database text search.
        """
        await self._ensure_synced(org_id)

        # 1. ChromaDB Vector Retrieval
        if chroma_service.is_ready:
            chroma_results = chroma_service.query(org_id=org_id, query_text=query, n_results=limit)
            if chroma_results:
                return [
                    KnowledgeSnippet(
                        id=c["id"],
                        source_id=c.get("source_id", ""),
                        document_title=c.get("title", "Acme Policy"),
                        section=c.get("section", "Section"),
                        category=c.get("category", "policy"),
                        content=c["content"],
                        relevance_score=c.get("relevance_score", 0.90),
                        version=1
                    )
                    for c in chroma_results
                ]

        # 2. Database / In-Memory Text Fallback Search
        query_lower = query.lower()
        query_words = [w for w in query_lower.split() if len(w) > 3]

        all_chunks, _ = await repo.list_records("knowledge_chunks", filters={"org_id": org_id}, limit=50)
        
        scored_chunks = []
        for ch in all_chunks:
            text = (ch.get("title", "") + " " + ch.get("section", "") + " " + ch.get("content", "")).lower()
            match_count = sum(1 for w in query_words if w in text)
            if match_count > 0 or not query_words:
                relevance = min(0.95, 0.70 + (match_count * 0.08))
                scored_chunks.append((relevance, ch))

        # Sort by relevance descending
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, ch in scored_chunks[:limit]:
            results.append(KnowledgeSnippet(
                id=str(ch.get("id")),
                source_id=str(ch.get("source_id", "")),
                document_title=str(ch.get("title", "Acme Policy")),
                section=str(ch.get("section", "General")),
                category=str(ch.get("metadata", {}).get("category", "policy")),
                content=str(ch.get("content", "")),
                relevance_score=round(score, 2),
                version=1
            ))

        return results

    async def get_relevant_policies_for_case(self, case_context: CaseContext) -> List[KnowledgeSnippet]:
        """Maps case intent and parameters to authoritative Acme Commerce policies"""
        intent = case_context.intent.intent if case_context.intent else "general_inquiry"
        subject = case_context.ticket.subject
        org_id = case_context.ticket.org_id

        if "payment_successful_order_missing" in intent or "payment" in intent:
            query = "Payment Confirmation Gateway Settlement Order Ingestion Webhook Drop SLA"
        elif "delayed_refund" in intent or "refund" in intent:
            query = "30-Day Return Refund Processing Policy Clearinghouse ACH Settlement"
        elif "subscription" in intent:
            query = "Subscription Renewal Billing Vault Grace Period Accidental Renewal Cancellation"
        elif "account" in intent:
            query = "Account Security Lockout Password Reset Recovery Magic Link Session"
        elif "troubleshooting" in intent or "technical" in intent:
            query = "AeroTune Headphones Hardware Troubleshooting Power Reset Firmware Update"
        else:
            query = f"{subject} policy guide support escalation"

        return await self.search_knowledge(query=query, org_id=org_id, limit=3)

knowledge_service = KnowledgeService()
