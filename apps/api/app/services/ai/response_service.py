"""
ResolveX AI Grounded Support Response Service
Generates evidence-backed responses using Gemini 2.0 Flash or DeterministicFallbackEngine.
Strict Zero-Mutation-Claim guarantee: never hallucinate actions executed.
"""

from typing import List, Optional
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import (
    AIResponse,
    SpecialistFinding,
    EvidenceItem,
    KnowledgeSnippet
)
from apps.api.app.services.ai.gemini_client import gemini_client
from apps.api.app.services.ai.fallback_engine import fallback_engine
from apps.api.app.core.logging import logger

class ResponseService:
    async def generate_response(
        self,
        case_context: CaseContext,
        findings: List[SpecialistFinding],
        evidence: List[EvidenceItem],
        policies: List[KnowledgeSnippet]
    ) -> AIResponse:
        """
        Generates a context-aware, grounded response citing verified evidence and policy sources.
        """
        customer_name = case_context.customer.full_name
        intent_category = case_context.intent.intent if case_context.intent else "general_inquiry"

        if gemini_client.is_available:
            evidence_summaries = "\n".join([f"- [{e.type}] {e.description} (Source ID: {e.source_entity_id})" for e in evidence])
            policy_summaries = "\n".join([f"- {p.document_title} (Section: {p.section}): {p.content[:200]}..." for p in policies])

            prompt = f"""
You are an enterprise AI Support Copilot for Acme Commerce.
Draft a professional, helpful, empathetic, and grounded response to the customer.

Customer Name: {customer_name}
Subject: {case_context.ticket.subject}
Customer Messages:
{chr(10).join(f"- {m.content}" for m in case_context.conversation)}

Verified Investigation Findings:
{chr(10).join(f"- [{f.specialist_name}] {f.conclusion}" for f in findings)}

Verified Evidence Records:
{evidence_summaries or "None recorded"}

Applicable Company Policies:
{policy_summaries or "Standard support policy"}

CRITICAL SAFETY RULES:
1. NEVER claim that an order was recreated, refund was sent, or action was executed. You are recommending next steps, NOT executing database mutations.
2. Clearly explain what the investigation revealed using the verified evidence.
3. Reference relevant policy and provide a concrete recommended next step.
"""
            try:
                res = await gemini_client.generate_structured(
                    prompt=prompt,
                    response_model=AIResponse,
                    system_instruction="You are ResolveX Response Copilot. Ground all statements in verified evidence. Never claim irreversible actions occurred."
                )
                if res:
                    res.provider = "gemini"
                    return res
            except Exception as e:
                logger.warning(f"Gemini response generation error: {str(e)}. Utilizing fallback response.")

        # Fallback response generator
        return fallback_engine.generate_grounded_response(
            customer_name=customer_name,
            intent=intent_category,
            findings=findings,
            evidence=evidence,
            policies=policies
        )

response_service = ResponseService()
