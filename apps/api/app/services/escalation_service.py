"""
ResolveX Escalation Intelligence & Complete Human Handoff Service
Assembles rich contextual handoff packages when automation halts safely,
ensuring human operators never have to investigate a case from scratch.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid

from apps.api.app.core.logging import logger
from apps.api.app.repositories.base_repository import repo
from apps.api.app.services.case_context_service import case_context_service
from apps.api.app.services.investigation_service import investigation_service
from apps.api.app.services.incident_service import incident_service
from apps.api.app.domain.schemas import HumanHandoffPackageSchema

class EscalationService:
    async def generate_handoff_package(
        self,
        ticket_id: str,
        escalation_reason: Optional[str] = None,
        escalation_id: Optional[str] = None
    ) -> HumanHandoffPackageSchema:
        return await self.assemble_handoff_package(
            ticket_id=ticket_id,
            escalation_id=escalation_id,
            reason_override=escalation_reason
        )

    async def assemble_handoff_package(
        self,
        ticket_id: str,
        escalation_id: Optional[str] = None,
        reason_override: Optional[str] = None
    ) -> HumanHandoffPackageSchema:

        """
        Synthesizes a comprehensive human handoff package across customer, investigation,
        telemetry, cryptographic evidence, and attempted actions.
        """
        ticket = await repo.get_record_by_id("tickets", ticket_id)
        if not ticket:
            raise ValueError(f"Ticket {ticket_id} not found")

        org_id = ticket.get("org_id", "00000000-0000-0000-0000-000000000001")
        now = datetime.now(timezone.utc).isoformat()
        esc_id = escalation_id or str(uuid.uuid4())

        # 1. Customer Context
        ctx = await case_context_service.assemble_context(ticket_id)
        customer_summary = {}
        if ctx and ctx.customer:
            customer_summary = {
                "id": ctx.customer.id,
                "full_name": ctx.customer.full_name,
                "email": ctx.customer.email,
                "loyalty_tier": ctx.customer_profile.loyalty_tier if ctx.customer_profile else "Standard",
                "lifetime_value_cents": ctx.customer_profile.lifetime_value_cents if ctx.customer_profile else 0,
                "churn_risk_score": ctx.customer_profile.churn_risk_score if ctx.customer_profile else 0.1,
                "total_orders": ctx.customer_profile.total_orders_count if ctx.customer_profile else 0
            }

        # 2. Multi-Agent Investigation Findings & Timeline
        inv = await investigation_service.get_investigation_for_ticket(ticket_id)
        if not inv:
            inv = await investigation_service.run_investigation(ticket_id)

        investigation_timeline = []
        agent_findings = []
        evidence_items = []
        if inv:
            for step in (inv.investigation_steps or []):
                investigation_timeline.append({
                    "step_number": step.step_number,
                    "agent": step.agent_name,
                    "action": step.action_type,
                    "thought": step.thought_process,
                    "timestamp": step.started_at
                })

            for finding in (inv.findings or []):
                agent_findings.append({
                    "agent": finding.specialist_name,
                    "finding_type": finding.finding_type,
                    "conclusion": finding.conclusion,
                    "confidence": finding.confidence
                })
            for ev in (inv.evidence or []):
                evidence_items.append({
                    "evidence_id": ev.id,
                    "type": ev.type,
                    "summary": ev.description,
                    "source_id": ev.source_entity_id,
                    "evidence_hash": ev.sha256_hash or hashlib.sha256(f"{ev.id}:{ev.type}:{ev.source_entity_id}".encode()).hexdigest(),
                    "relevance_score": ev.relevance_score
                })


        # 3. Orders & Payments
        orders = [ctx.linked_order.model_dump()] if ctx and ctx.linked_order else []
        payments = [ctx.linked_payment.model_dump()] if ctx and ctx.linked_payment else []

        # 4. Incident Context
        incident_corr = await incident_service.get_ticket_incident_correlation(ticket_id)
        linked_incident = None
        if incident_corr.is_linked:
            linked_incident = {
                "incident_id": incident_corr.incident_id,
                "incident_number": incident_corr.incident_number,
                "title": incident_corr.incident_title,
                "correlation_score": incident_corr.correlation_score,
                "status": incident_corr.incident_status,
                "severity": incident_corr.incident_severity,
                "co_affected_count": incident_corr.co_affected_count,
                "root_cause_summary": incident_corr.root_cause_summary
            }

        # 5. Actions Attempted History
        action_execs, _ = await repo.list_records("action_executions", filters={"ticket_id": ticket_id}, limit=10)
        actions_attempted = [
            {
                "action_type": a.get("action_type"),
                "status": a.get("execution_status"),
                "executed_at": a.get("executed_at"),
                "message": a.get("response_received", {}).get("verification_message")
            }
            for a in action_execs
        ]

        # 6. Escalation Scoring & Reasons
        score = 0.50
        reasons: List[str] = []

        if reason_override:
            reasons.append(reason_override)
            score = 0.90
        else:
            if ctx and ctx.customer_profile and ctx.customer_profile.churn_risk_score > 0.4:
                score += 0.20
                reasons.append("High customer churn risk / sentiment distress")
            if any(a.get("status") == "failed" for a in actions_attempted):
                score += 0.30
                reasons.append("Prior automated execution failed verification")
            if "security" in ticket.get("intent_category", ""):
                score += 0.35
                reasons.append("Security-sensitive account inquiry")
            if not reasons:
                reasons.append("Operator authorization required for high-risk action")

        score = min(1.0, score)

        # 7. Root Cause & Recommendation
        inv_summary = getattr(inv, "summary", None) or "Multi-agent diagnostic review required."
        root_cause = (
            incident_corr.root_cause_summary or
            inv_summary
        )
        recommendation = (
            "Verify customer identity and approve order creation retry in warehouse fulfillment pipeline."
            if "missing" in ticket.get("subject", "").lower()
            else "Review customer account notes and issue authorized resolution."
        )

        package = HumanHandoffPackageSchema(
            escalation_id=esc_id,
            ticket_id=ticket_id,
            customer_summary=customer_summary,
            issue_summary=ticket.get("subject", "Customer Inquiry"),
            detected_intent=ticket.get("intent_category", "general_inquiry"),
            investigation_timeline=investigation_timeline,
            evidence=evidence_items,
            orders=orders,
            payments=payments,
            linked_incident=linked_incident,
            agent_findings=agent_findings,
            actions_attempted=actions_attempted,
            policy_checks=[{"policy": "financial_risk_gate", "result": "operator_approval_required"}],
            root_cause_assessment=root_cause,
            recommendation=recommendation,
            escalation_score=round(score, 2),
            escalation_reasons=reasons
        )

        # Save or update in escalations table
        existing_esc, _ = await repo.list_records("escalations", filters={"ticket_id": ticket_id}, limit=1)
        if not existing_esc:
            esc_record = {
                "id": esc_id,
                "org_id": org_id,
                "ticket_id": ticket_id,
                "escalation_reason": reasons[0] if reasons else "High-risk action",
                "executive_summary": root_cause,
                "recommended_resolution": recommendation,
                "urgency": "urgent" if score > 0.8 else "normal",
                "status": "pending",
                "created_at": now
            }
            await repo.insert_record("escalations", esc_record)

        return package

    async def get_escalation_detail(self, escalation_id: str) -> Optional[HumanHandoffPackageSchema]:
        """Retrieves complete handoff package for an escalation ID."""
        esc = await repo.get_record_by_id("escalations", escalation_id)
        if not esc:
            # Fallback: check if escalation_id is a ticket_id
            return await self.assemble_handoff_package(escalation_id)
        return await self.assemble_handoff_package(esc.get("ticket_id"), escalation_id=escalation_id)

    async def resolve_escalation(
        self,
        escalation_id: str,
        resolution_note: str,
        user_id: Optional[str] = None
    ) -> bool:
        """Marks an escalation as resolved with operator audit notes."""
        now = datetime.now(timezone.utc).isoformat()
        updated = await repo.update_record("escalations", escalation_id, {
            "status": "resolved",
            "updated_at": now
        })
        if updated:
            # Also record event
            await repo.insert_record("escalation_events", {
                "id": str(uuid.uuid4()),
                "org_id": updated.get("org_id"),
                "escalation_id": escalation_id,
                "user_id": user_id or "00000000-0000-0000-0000-000000000002",
                "event_type": "resolved",
                "note": resolution_note,
                "created_at": now
            })
            return True
        return False

escalation_service = EscalationService()
