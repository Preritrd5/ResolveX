"""
ResolveX Deterministic Policy Engine
Authoritative gatekeeper enforcing business rules, financial limits,
risk classifications, permission boundaries, and eligibility constraints before any action.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone


from apps.api.app.core.logging import logger
from apps.api.app.domain.schemas import PolicyCheckResultSchema
from apps.api.app.services.action_registry import action_registry

# Role to permission mapping
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "SUPPORT_AGENT": [
        "ticket.update",
        "ticket.assign",
        "order.resend",
        "payment.view",
        "escalation.create"
    ],
    "SENIOR_AGENT": [
        "ticket.update",
        "ticket.assign",
        "order.resend",
        "payment.view",
        "escalation.create",
        "order.create",
        "order.retry",
        "refund.request"
    ],
    "SUPPORT_MANAGER": [
        "ticket.update",
        "ticket.assign",
        "order.resend",
        "payment.view",
        "escalation.create",
        "order.create",
        "order.retry",
        "refund.request",
        "refund.execute",
        "order.cancel",
        "manager_role"
    ],
    "ADMIN": [
        "ticket.update",
        "ticket.assign",
        "order.resend",
        "payment.view",
        "escalation.create",
        "order.create",
        "order.retry",
        "refund.request",
        "refund.execute",
        "order.cancel",
        "manager_role"
    ]
}

class PolicyEngine:
    def check_permissions(self, user_role: str, required_permissions: List[str]) -> Tuple[bool, List[str]]:
        """Verifies if the user's role grants all required action permissions."""

        user_perms = set(ROLE_PERMISSIONS.get(user_role.upper(), []))
        missing = [p for p in required_permissions if p not in user_perms]
        return len(missing) == 0, missing

    def evaluate_policy(
        self,
        action_type: str,
        ticket: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        user: Optional[Dict[str, Any]] = None,
        parameters: Optional[Dict[str, Any]] = None,
        ticket_id: Optional[str] = None
    ) -> PolicyCheckResultSchema:
        """
        Authoritatively evaluates all safety and policy constraints for an action.
        Returns a structured PolicyCheckResultSchema.
        """
        ticket = ticket or {"id": ticket_id or "unknown"}
        context = context or {}
        parameters = parameters or {}
        violations: List[str] = []
        policy_sources: List[str] = []


        # 1. Action Registry Check
        action_def = action_registry.get_action(action_type)
        if not action_def or not action_def.enabled:
            return PolicyCheckResultSchema(
                allowed=False,
                reason=f"Action '{action_type}' is not registered or is currently disabled in the Action Registry.",
                policy_sources=["action_registry"],
                required_approval=True,
                risk_level="HIGH",
                violations=["ACTION_NOT_REGISTERED"]
            )

        policy_sources.append("action_registry")
        risk_level = action_def.risk_level
        requires_approval = action_def.requires_human_approval

        # 2. Permission Check
        user_role = (user.get("role") if user else "SENIOR_AGENT") or "SENIOR_AGENT"
        has_perm, missing_perms = self.check_permissions(user_role, action_def.required_permissions)
        if not has_perm:
            violations.append(f"INSUFFICIENT_PERMISSIONS: Role '{user_role}' lacks permissions {missing_perms}")
            policy_sources.append("rbac_policy")

        # 3. Security Boundary Check
        intent = ticket.get("intent_category", "")
        subject = ticket.get("subject", "").lower()
        if "account_security" in intent or "locked" in subject or "password reset" in subject:
            if action_type in ["issue_refund", "retry_order_creation", "cancel_order"]:
                violations.append("SECURITY_LOCKOUT_POLICY: Account is in security review; automated actions restricted.")
                policy_sources.append("security_governance_policy")
                requires_approval = True

        # 4. Action-Specific Eligibility & Business Rule Checks
        if action_type == "resend_order_confirmation":
            # Order must exist and customer email must be present
            order = context.get("order")
            customer = context.get("customer")
            if not order and not ticket.get("order_id"):
                violations.append("ELIGIBILITY_FAILED: No order record linked to ticket to resend confirmation.")
            if not customer and not ticket.get("customer_email"):
                violations.append("ELIGIBILITY_FAILED: Missing customer destination email address.")
            policy_sources.append("order_delivery_policy")

        elif action_type == "retry_order_creation":
            # Must have verified captured payment and no existing completed order
            payment = context.get("payment")
            order = context.get("order")

            if not payment:
                violations.append("ELIGIBILITY_FAILED: Missing verified payment transaction to recreate order from.")
            elif payment.get("status") not in ["captured", "succeeded"]:
                violations.append(f"ELIGIBILITY_FAILED: Payment status is '{payment.get('status')}', not captured.")

            order_blocks = False
            if payment and payment.get("order_id"):
                order_blocks = True
            elif order:
                st = order.get("status", "")
                if st in ["created", "processing"]:
                    order_blocks = True
                elif st in ["shipped", "delivered"] and payment and payment.get("order_id") == order.get("id"):
                    order_blocks = True

            if order_blocks:
                violations.append("ELIGIBILITY_FAILED: An active order record already exists; retry would cause duplicate order.")


            policy_sources.append("payment_reconciliation_policy")

        elif action_type in ["create_refund_request", "issue_refund"]:
            payment = context.get("payment")
            if not payment:
                violations.append("ELIGIBILITY_FAILED: No payment record found to refund.")
            elif payment.get("status") not in ["captured", "succeeded"]:
                violations.append(f"ELIGIBILITY_FAILED: Cannot refund payment with status '{payment.get('status')}'.")

            # Check 30-day refund window policy
            order = context.get("order") or {}
            created_at = (payment.get("created_at") if payment and payment.get("created_at") else None) or order.get("created_at") or ticket.get("created_at")
            if created_at:

                try:
                    clean_ts = str(created_at).replace("Z", "+00:00")
                    dt = datetime.fromisoformat(clean_ts)
                    days_elapsed = (datetime.now(timezone.utc) - dt).days
                    if days_elapsed > 30:
                        violations.append(f"POLICY_LIMIT_EXCEEDED: Transaction is {days_elapsed} days old; exceeds 30-day refund policy window.")
                except Exception:
                    pass

            # Direct refund has financial limits
            if action_type == "issue_refund":
                requires_approval = True  # Mandatory human approval
                amount_cents = payment.get("amount_cents", 0) if payment else 0
                if amount_cents > 5000:  # > $50
                    if user_role not in ["SUPPORT_MANAGER", "ADMIN"]:
                        violations.append("FINANCIAL_LIMIT_EXCEEDED: Refund amount exceeds $50.00 threshold; requires Support Manager approval.")
            policy_sources.append("refund_and_return_policy")

        elif action_type == "cancel_order":
            order = context.get("order")
            if not order:
                violations.append("ELIGIBILITY_FAILED: No order record linked to cancel.")
            elif order.get("status") in ["shipped", "delivered"]:
                violations.append(f"POLICY_VIOLATION: Cannot cancel order in '{order.get('status')}' status; warehouse fulfillment completed.")
            requires_approval = True
            policy_sources.append("order_cancellation_policy")

        elif action_type == "update_ticket_status":
            valid_statuses = ["open", "investigating", "waiting_customer", "escalated", "resolved", "closed"]
            target_status = parameters.get("status")
            if target_status and target_status not in valid_statuses:
                violations.append(f"INVALID_STATUS_TRANSITION: Target status '{target_status}' is not valid.")
            policy_sources.append("ticket_lifecycle_policy")

        # 5. Final Decision Synthesis
        allowed = len(violations) == 0
        if not allowed:
            reason = f"Action '{action_def.name}' is blocked by policy: {'; '.join(violations)}"
        elif requires_approval:
            reason = f"Action '{action_def.name}' meets eligibility criteria but requires operator authorization (Risk: {risk_level})."
        else:
            reason = f"Action '{action_def.name}' satisfies all policy and eligibility checks for autonomous execution (Risk: {risk_level})."

        return PolicyCheckResultSchema(
            allowed=allowed,
            reason=reason,
            policy_sources=policy_sources,
            required_approval=requires_approval,
            risk_level=risk_level,
            violations=violations
        )

policy_engine = PolicyEngine()
