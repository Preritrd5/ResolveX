"""
ResolveX Single-Case Investigation Engine
Orchestrates context assembly, intent classification, specialist investigations,
evidence persistence, knowledge grounding, intelligent routing, and response synthesis.
"""

import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import (
    InvestigationResult,
    SpecialistFinding,
    EvidenceItem,
    AIResponse,
    RoutingDecision
)
from apps.api.app.services.case_context_service import case_context_service
from apps.api.app.services.ai.intent_service import intent_service
from apps.api.app.services.ai.router_service import router_service
from apps.api.app.services.ai.response_service import response_service
from apps.api.app.services.knowledge_service import knowledge_service
from apps.api.app.services.specialists.billing_investigator import billing_investigator
from apps.api.app.services.specialists.order_investigator import order_investigator
from apps.api.app.services.specialists.refund_investigator import refund_investigator
from apps.api.app.services.specialists.account_investigator import account_investigator
from apps.api.app.services.specialists.technical_investigator import technical_investigator
from apps.api.app.services.specialists.policy_investigator import policy_investigator
from apps.api.app.core.logging import logger

class InvestigationService:
    async def run_investigation(self, ticket_id: str) -> Optional[InvestigationResult]:
        """
        Executes an end-to-end single-case investigation pipeline for a ticket.
        """
        start_time = datetime.now(timezone.utc).isoformat()

        # Step 1: Assemble CaseContext from Supabase
        context = await case_context_service.assemble_context(ticket_id)
        if not context:
            logger.warning(f"Could not assemble CaseContext for ticket_id {ticket_id}")
            return None

        # Step 2: Understand Intent & Sentiment
        messages_text = [m.content for m in context.conversation]
        intent = await intent_service.classify_ticket_intent(
            subject=context.ticket.subject,
            messages=messages_text,
            customer_context=context.customer_history
        )
        sentiment = intent_service.analyze_sentiment(" ".join(messages_text))
        context.intent = intent
        context.sentiment = sentiment

        # Step 3: Retrieve Authoritative Acme Commerce Policies
        policies = await knowledge_service.get_relevant_policies_for_case(context)
        context.relevant_policies = policies

        # Step 4: Dispatch Relevant Specialists & Collect Evidence
        findings: List[SpecialistFinding] = []
        evidence_list: List[EvidenceItem] = []

        # Account verification
        f_acc, e_acc = account_investigator.investigate(context)
        findings.append(f_acc)
        if e_acc:
            evidence_list.append(e_acc)

        # Billing and Order investigations
        intent_cat = intent.intent.lower()
        if any(k in intent_cat for k in ["payment", "order", "billing", "refund", "subscription"]):
            f_bill, e_bill = billing_investigator.investigate(context)
            findings.append(f_bill)
            if e_bill:
                evidence_list.append(e_bill)

            f_ord, e_ord = order_investigator.investigate(context)
            findings.append(f_ord)
            if e_ord:
                evidence_list.append(e_ord)

        # Refund investigation
        if "refund" in intent_cat:
            f_ref, e_ref = refund_investigator.investigate(context)
            findings.append(f_ref)
            if e_ref:
                evidence_list.append(e_ref)

        # Technical / Telemetry inspection
        f_tech, e_tech = technical_investigator.investigate(context)
        findings.append(f_tech)
        if e_tech:
            evidence_list.append(e_tech)

        # Policy & Compliance inspection
        f_pol, e_pol = policy_investigator.investigate(context)
        findings.append(f_pol)
        if e_pol:
            evidence_list.append(e_pol)

        # Step 5: Determine Routing Decision
        routing = router_service.determine_route(
            intent=intent,
            sentiment=sentiment,
            customer_status=context.customer.status,
            loyalty_tier=context.customer_profile.loyalty_tier if context.customer_profile else "bronze"
        )
        context.routing = routing

        # Step 6: Generate Grounded AI Support Response
        ai_resp = await response_service.generate_response(
            case_context=context,
            findings=findings,
            evidence=evidence_list,
            policies=policies
        )
        context.suggested_response = ai_resp

        # Step 7: Persist Investigation and Evidence Records
        inv_id = str(uuid.uuid4())
        overall_confidence = round(
            sum([f.confidence for f in findings]) / max(len(findings), 1),
            2
        )

        # Save investigation record
        inv_record = {
            "id": inv_id,
            "org_id": context.ticket.org_id,
            "ticket_id": ticket_id,
            "incident_id": None,
            "status": "completed",
            "summary": ai_resp.reasoning_summary,
            "overall_confidence": overall_confidence,
            "started_at": start_time,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }
        await repo.insert_record("investigations", inv_record)

        # Save evidence records
        for ev in evidence_list:
            ev_record = {
                "id": ev.id,
                "org_id": context.ticket.org_id,
                "investigation_id": inv_id,
                "evidence_type": ev.type,
                "source_entity_id": ev.source_entity_id,
                "summary": ev.description,
                "raw_data": ev.raw_data,
                "relevance_score": ev.relevance_score,
                "sha256_hash": ev.sha256_hash
            }
            await repo.insert_record("evidence", ev_record)

        # Update ticket attributes with AI results
        await repo.update_record("tickets", ticket_id, {
            "ai_confidence": overall_confidence,
            "recommended_team": routing.recommended_team,
            "ai_resolvable": routing.ai_resolvable,
            "intent_category": intent.intent,
            "priority": routing.priority
        })

        return InvestigationResult(
            investigation_id=inv_id,
            ticket_id=ticket_id,
            status="completed",
            summary=ai_resp.reasoning_summary,
            overall_confidence=overall_confidence,
            intent=intent,
            routing=routing,
            findings=findings,
            evidence=evidence_list,
            relevant_policies=policies,
            ai_response=ai_resp,
            recommended_next_step=ai_resp.recommended_next_step,
            started_at=start_time,
            completed_at=datetime.now(timezone.utc).isoformat()
        )

    async def get_case_evidence(self, ticket_id: str) -> List[EvidenceItem]:
        """Retrieves verified evidence stored for a ticket's investigations"""
        invs, _ = await repo.list_records("investigations", filters={"ticket_id": ticket_id}, limit=1)
        if not invs:
            # If no stored investigation yet, run analysis on the fly
            res = await self.run_investigation(ticket_id)
            return res.evidence if res else []

        inv_id = invs[0]["id"]
        evidence_records, _ = await repo.list_records("evidence", filters={"investigation_id": inv_id}, limit=20)
        return [
            EvidenceItem(
                id=r["id"],
                type=r["evidence_type"],
                source_entity_id=r["source_entity_id"],
                description=r["summary"],
                relevance_score=r["relevance_score"],
                raw_data=r.get("raw_data", {}),
                sha256_hash=r.get("sha256_hash")
            )
            for r in evidence_records
        ]

investigation_service = InvestigationService()
