"""
ResolveX Controlled Action Registry
Central catalog of permissible system actions with risk classification,
required permissions, preconditions, approval requirements, and rollback strategies.
"""

from typing import Dict, List, Optional
from apps.api.app.domain.schemas import ActionRegistryItemSchema

ACTIONS: Dict[str, ActionRegistryItemSchema] = {
    "resend_order_confirmation": ActionRegistryItemSchema(
        action_type="resend_order_confirmation",
        name="Resend Order Confirmation",
        description="Re-triggers delivery of order confirmation receipt to customer email.",
        required_permissions=["ticket.update", "order.resend"],
        risk_level="LOW",
        allowed_conditions=["order_exists", "payment_verified"],
        required_evidence=["order_record", "payment_record"],
        requires_human_approval=False,
        rollback_strategy="Notification event log can be marked void; non-destructive.",
        verification_strategy="Verify notification event created and order confirmation status is true.",
        idempotency_strategy="Unique key on org:ticket:resend_order_confirmation:order_id",
        enabled=True
    ),
    "retry_order_creation": ActionRegistryItemSchema(
        action_type="retry_order_creation",
        name="Retry Order Creation",
        description="Re-injects dropped order into warehouse fulfillment pipeline from verified payment transaction.",
        required_permissions=["order.create", "order.retry"],
        risk_level="MEDIUM",
        allowed_conditions=["payment_captured", "order_missing", "no_duplicate_order"],
        required_evidence=["payment_record", "service_event"],
        requires_human_approval=True,
        rollback_strategy="Cancel created order in fulfillment pipeline if unfulfilled.",
        verification_strategy="Verify new order record exists in database with matching payment_id.",
        idempotency_strategy="Unique key on org:payment:gateway_transaction_id",
        enabled=True
    ),
    "resend_payment_receipt": ActionRegistryItemSchema(
        action_type="resend_payment_receipt",
        name="Resend Payment Receipt",
        description="Dispatches PDF gateway transaction receipt to verified customer email.",
        required_permissions=["payment.view", "ticket.update"],
        risk_level="LOW",
        allowed_conditions=["payment_captured"],
        required_evidence=["payment_record"],
        requires_human_approval=False,
        rollback_strategy="Logged in immutable audit table; non-destructive email dispatch.",
        verification_strategy="Verify receipt event dispatch in notifications table.",
        idempotency_strategy="Unique key on org:ticket:resend_receipt:payment_id",
        enabled=True
    ),
    "provide_refund_status": ActionRegistryItemSchema(
        action_type="provide_refund_status",
        name="Provide Refund Status",
        description="Retrieves clearinghouse settlement state and posts definitive refund tracking update.",
        required_permissions=["ticket.update"],
        risk_level="LOW",
        allowed_conditions=["refund_exists"],
        required_evidence=["refund_record"],
        requires_human_approval=False,
        rollback_strategy="Read-only informative update; state unchanged.",
        verification_strategy="Verify ticket conversation message appended with settlement details.",
        idempotency_strategy="Unique key on org:ticket:provide_refund_status:refund_id",
        enabled=True
    ),
    "create_refund_request": ActionRegistryItemSchema(
        action_type="create_refund_request",
        name="Create Refund Request",
        description="Creates a formal refund request in pending_review state for finance operator sign-off.",
        required_permissions=["refund.request"],
        risk_level="MEDIUM",
        allowed_conditions=["payment_captured", "within_return_window"],
        required_evidence=["payment_record", "customer_profile"],
        requires_human_approval=True,
        rollback_strategy="Reject or delete pending refund request record.",
        verification_strategy="Verify refund record exists in database with status pending_review.",
        idempotency_strategy="Unique key on org:payment:create_refund_request",
        enabled=True
    ),
    "issue_refund": ActionRegistryItemSchema(
        action_type="issue_refund",
        name="Issue Direct Refund",
        description="Directly issues financial refund to original payment method. Mandatory human approval.",
        required_permissions=["refund.execute", "manager_role"],
        risk_level="HIGH",
        allowed_conditions=["payment_captured", "amount_lte_5000_cents", "within_return_window"],
        required_evidence=["payment_record", "policy_rule"],
        requires_human_approval=True,
        rollback_strategy="Irreversible financial transaction; escalation required on failure.",
        verification_strategy="Verify refund record status is completed and payment status is refunded.",
        idempotency_strategy="Unique key on org:payment:gateway_transaction_id:refund",
        enabled=True
    ),
    "cancel_order": ActionRegistryItemSchema(
        action_type="cancel_order",
        name="Cancel Order",
        description="Halts fulfillment pipeline and marks order as cancelled. Mandatory human approval.",
        required_permissions=["order.cancel", "manager_role"],
        risk_level="HIGH",
        allowed_conditions=["order_exists", "status_in_processing_or_unfulfilled"],
        required_evidence=["order_record"],
        requires_human_approval=True,
        rollback_strategy="Re-inject order into fulfillment pipeline.",
        verification_strategy="Verify order status in database is updated to cancelled.",
        idempotency_strategy="Unique key on org:order:cancel_order:order_id",
        enabled=True
    ),
    "update_ticket_status": ActionRegistryItemSchema(
        action_type="update_ticket_status",
        name="Update Ticket Status",
        description="Updates ticket lifecycle status (open, investigating, resolved).",
        required_permissions=["ticket.update"],
        risk_level="LOW",
        allowed_conditions=["ticket_exists", "valid_status_transition"],
        required_evidence=["ticket_record"],
        requires_human_approval=False,
        rollback_strategy="Revert ticket status to previous value in database.",
        verification_strategy="Verify ticket record status matches requested value.",
        idempotency_strategy="Unique key on org:ticket:update_status:target_status",
        enabled=True
    ),
    "assign_ticket": ActionRegistryItemSchema(
        action_type="assign_ticket",
        name="Assign Ticket",
        description="Routes ticket to designated support queue or specialist agent.",
        required_permissions=["ticket.assign"],
        risk_level="LOW",
        allowed_conditions=["ticket_exists", "valid_team"],
        required_evidence=["routing_decision"],
        requires_human_approval=False,
        rollback_strategy="Reassign ticket to original owner.",
        verification_strategy="Verify ticket recommended_team updated.",
        idempotency_strategy="Unique key on org:ticket:assign_ticket:team",
        enabled=True
    ),
    "create_human_escalation": ActionRegistryItemSchema(
        action_type="create_human_escalation",
        name="Escalate to Human Operator",
        description="Transfers case to senior human operator queue with complete contextual handoff package.",
        required_permissions=["ticket.update", "escalation.create"],
        risk_level="LOW",
        allowed_conditions=["ticket_exists"],
        required_evidence=["investigation_summary"],
        requires_human_approval=False,
        rollback_strategy="De-escalate ticket back to standard queue.",
        verification_strategy="Verify escalation record created in escalations table with complete handoff.",
        idempotency_strategy="Unique key on org:ticket:escalate",
        enabled=True
    )
}

class ActionRegistry:
    def get_action(self, action_type: str) -> Optional[ActionRegistryItemSchema]:
        """Retrieves action definition by action_type key."""
        return ACTIONS.get(action_type)

    def list_actions(self) -> List[ActionRegistryItemSchema]:
        """Returns all registered actions."""
        return list(ACTIONS.values())

    def is_action_enabled(self, action_type: str) -> bool:
        """Checks if an action is registered and enabled."""
        act = self.get_action(action_type)
        return act.enabled if act else False

action_registry = ActionRegistry()
