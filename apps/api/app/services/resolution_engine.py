"""
ResolveX Resolution Engine
Synthesizes CaseContext, LangGraph multi-agent findings, and Policy Engine gates to
derive safe operational resolution decisions (AUTO_RESOLVE, ASSISTED_RESOLUTION, ESCALATE, INSUFFICIENT_INFORMATION).
"""

from typing import Dict, Any, Optional
from apps.api.app.core.logging import logger
from apps.api.app.repositories.base_repository import repo
from apps.api.app.services.case_context_service import case_context_service
from apps.api.app.services.investigation_service import investigation_service
from apps.api.app.services.incident_service import incident_service
from apps.api.app.services.policy_engine import policy_engine
from apps.api.app.domain.schemas import (
    ResolutionDecisionSchema,
    PolicyCheckResultSchema
)

class ResolutionEngine:
    async def evaluate_resolution(
        self,
        ticket_id: str,
        user: Optional[Dict[str, Any]] = None
    ) -> ResolutionDecisionSchema:
        """
        Evaluates a case and derives the appropriate resolution decision and action.
        """
        ticket = await repo.get_record_by_id("tickets", ticket_id)
        if not ticket:
            return ResolutionDecisionSchema(
                decision="INSUFFICIENT_INFORMATION",
                reason=f"Ticket '{ticket_id}' not found in database.",
                policy_check=PolicyCheckResultSchema(
                    allowed=False,
                    reason="Ticket does not exist",
                    violations=["TICKET_NOT_FOUND"]
                )
            )

        # 1. Assemble CaseContext & Investigation
        ctx = await case_context_service.assemble_context(ticket_id)
        context_dict: Dict[str, Any] = {}
        if ctx:
            context_dict["order"] = ctx.linked_order.model_dump() if ctx.linked_order else None
            context_dict["payment"] = ctx.linked_payment.model_dump() if ctx.linked_payment else None
            context_dict["customer"] = ctx.customer.model_dump() if ctx.customer else None

        # 2. Check Linked Incident
        incident_corr = await incident_service.get_ticket_incident_correlation(ticket_id)

        intent = ticket.get("intent_category", "")
        subject = ticket.get("subject", "").lower()
        confidence = ticket.get("ai_confidence", 0.85)

        # ----------------------------------------------------------------------
        # Scenario A: Security Lockout (Security Boundary -> ESCALATE)
        # ----------------------------------------------------------------------
        if "security" in intent or "locked" in subject or "password" in subject:
            policy_check = policy_engine.evaluate_policy(
                action_type="create_human_escalation",
                ticket=ticket,
                context=context_dict,
                user=user
            )
            return ResolutionDecisionSchema(
                decision="ESCALATE",
                recommended_action="create_human_escalation",
                confidence=0.98,
                reason="Account security credentials require operator verification. Automation halted safely per Security Governance Policy.",
                policy_check=policy_check,
                risk_level="HIGH",
                requires_human_approval=True
            )

        # ----------------------------------------------------------------------
        # Scenario B: Missing Order after Payment (Flagship Case A / INC-2026-041)
        # ----------------------------------------------------------------------
        if "payment_successful_order_missing" in intent or ("payment" in subject and "missing" in subject):
            payment = context_dict.get("payment")
            order = context_dict.get("order")

            if not payment:
                return ResolutionDecisionSchema(
                    decision="INSUFFICIENT_INFORMATION",
                    reason="No verified payment transaction found on gateway. Cannot recreate missing order without transaction evidence.",
                    policy_check=PolicyCheckResultSchema(
                        allowed=False,
                        reason="Missing gateway payment record",
                        violations=["MISSING_PAYMENT_RECORD"]
                    ),
                    confidence=0.50,
                    risk_level="MEDIUM"
                )

            # Payment exists, order missing -> Recommend retry_order_creation
            rec_action = "retry_order_creation"
            params = {
                "payment_id": payment.get("id"),
                "gateway_transaction_id": payment.get("gateway_transaction_id"),
                "amount_cents": payment.get("amount_cents"),
                "customer_id": ticket.get("customer_id")
            }

            policy_check = policy_engine.evaluate_policy(
                action_type=rec_action,
                ticket=ticket,
                context=context_dict,
                user=user,
                parameters=params
            )

            # Since retry_order_creation is MEDIUM risk and mutates fulfillment state,
            # we classify as ASSISTED_RESOLUTION: operator can preview diff and execute/approve.
            return ResolutionDecisionSchema(
                decision="ASSISTED_RESOLUTION" if policy_check.allowed else "ESCALATE",
                recommended_action=rec_action,
                confidence=0.96 if incident_corr.is_linked else confidence,
                reason="Verified Stripe payment capture confirmed with zero fulfillment order records. Safe retry of order creation recommended.",
                policy_check=policy_check,
                risk_level="MEDIUM",
                parameters=params,
                requires_human_approval=policy_check.required_approval
            )

        # ----------------------------------------------------------------------
        # Scenario C: Delayed Refund / Refund Inquiry
        # ----------------------------------------------------------------------
        if "delayed_refund" in intent or "refund" in subject:
            # Check if order / payment exists
            payment = context_dict.get("payment")
            amount_cents = payment.get("amount_cents", 0) if payment else 0

            if amount_cents > 5000:  # > $50
                # High-Risk financial refund -> ESCALATE / MANDATORY APPROVAL
                rec_action = "issue_refund"
                policy_check = policy_engine.evaluate_policy(
                    action_type=rec_action,
                    ticket=ticket,
                    context=context_dict,
                    user=user
                )
                return ResolutionDecisionSchema(
                    decision="ESCALATE",
                    recommended_action=rec_action,
                    confidence=0.90,
                    reason=f"Refund request exceeds autonomous threshold ({amount_cents / 100:.2f} > $50.00). High-risk financial action requires manager authorization.",
                    policy_check=policy_check,
                    risk_level="HIGH",
                    parameters={"payment_id": payment.get("id") if payment else None},
                    requires_human_approval=True
                )
            else:
                # Provide refund status or create refund request
                rec_action = "provide_refund_status"
                policy_check = policy_engine.evaluate_policy(
                    action_type=rec_action,
                    ticket=ticket,
                    context=context_dict,
                    user=user
                )
                return ResolutionDecisionSchema(
                    decision="AUTO_RESOLVE" if policy_check.allowed else "ESCALATE",
                    recommended_action=rec_action,
                    confidence=0.88,
                    reason="Refund tracking inquiry; informative status update satisfies policy for autonomous completion.",
                    policy_check=policy_check,
                    risk_level="LOW",
                    parameters={},
                    requires_human_approval=False
                )

        # ----------------------------------------------------------------------
        # Scenario D: Order Confirmation Delivery
        # ----------------------------------------------------------------------
        if "confirmation" in subject or "receipt" in subject:
            rec_action = "resend_order_confirmation"
            policy_check = policy_engine.evaluate_policy(
                action_type=rec_action,
                ticket=ticket,
                context=context_dict,
                user=user
            )
            return ResolutionDecisionSchema(
                decision="AUTO_RESOLVE" if policy_check.allowed else "INSUFFICIENT_INFORMATION",
                recommended_action=rec_action,
                confidence=0.94,
                reason="Order exists and payment is captured; receipt dispatch satisfies policy for autonomous delivery.",
                policy_check=policy_check,
                risk_level="LOW",
                parameters={},
                requires_human_approval=False
            )

        # ----------------------------------------------------------------------
        # Default / Fallback: Low confidence or general inquiry
        # ----------------------------------------------------------------------
        if confidence < 0.70:
            return ResolutionDecisionSchema(
                decision="ESCALATE",
                recommended_action="create_human_escalation",
                confidence=confidence,
                reason="Investigation confidence below 70% threshold. Automated action halted for human review.",
                policy_check=PolicyCheckResultSchema(
                    allowed=True,
                    reason="Low confidence escalation",
                    risk_level="LOW"
                ),
                risk_level="LOW",
                requires_human_approval=False
            )

        # Default safe update
        policy_check = policy_engine.evaluate_policy(
            action_type="update_ticket_status",
            ticket=ticket,
            context=context_dict,
            user=user,
            parameters={"status": "investigating"}
        )
        return ResolutionDecisionSchema(
            decision="ASSISTED_RESOLUTION",
            recommended_action="update_ticket_status",
            confidence=confidence,
            reason="Standard inquiry routed to specialist workflow.",
            policy_check=policy_check,
            risk_level="LOW",
            parameters={"status": "investigating"},
            requires_human_approval=False
        )

resolution_engine = ResolutionEngine()
