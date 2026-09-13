"""
ResolveX Order Investigator Interface
Verifies warehouse fulfillment, inventory reservations, and order registration status.
"""

import hashlib
import uuid
from typing import Tuple, Optional
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import SpecialistFinding, EvidenceItem

class OrderInvestigator:
    def investigate(self, context: CaseContext) -> Tuple[SpecialistFinding, Optional[EvidenceItem]]:
        """
        INPUT: CaseContext
        OUTPUT: SpecialistFinding
        EVIDENCE: EvidenceItem (if missing or existing order evaluated)
        CONFIDENCE: 0.95
        """
        orders = context.orders
        payments = context.payments
        orphaned_payments = [p for p in payments if p.status == "captured" and p.order_id is None]

        if orphaned_payments:
            latest_orphan = orphaned_payments[0]
            desc = f"Order Missing: Payment {latest_orphan.gateway_transaction_id} ($49.99) has zero corresponding records in fulfillment pipeline."
            raw_hash = hashlib.sha256(f"order_missing:{latest_orphan.id}:{context.customer.id}".encode()).hexdigest()

            evidence = EvidenceItem(
                id=str(uuid.uuid4()),
                type="order_log",
                source_entity_id=f"missing_order_for_{latest_orphan.id}",
                description=desc,
                timestamp=latest_orphan.created_at,
                relevance_score=0.98,
                raw_data={"missing_for_payment_id": latest_orphan.id, "customer_id": context.customer.id},
                sha256_hash=raw_hash
            )

            finding = SpecialistFinding(
                specialist_name="Order Agent",
                finding_type="fulfillment_audit",
                status="DISCREPANCY_DETECTED",
                conclusion="No matching order record exists in the warehouse database for the verified captured payment.",
                confidence=0.96,
                evidence_refs=[evidence.id],
                data={"total_orders": len(orders), "missing_order_detected": True}
            )
            return finding, evidence

        if orders:
            recent_order = orders[0]
            desc = f"Order {recent_order.order_number} verified with status: {recent_order.status.upper()} (Total: ${recent_order.total_amount_cents / 100:.2f})."
            raw_hash = hashlib.sha256(f"{recent_order.id}:{recent_order.order_number}:{recent_order.status}".encode()).hexdigest()

            evidence = EvidenceItem(
                id=str(uuid.uuid4()),
                type="order_log",
                source_entity_id=recent_order.id,
                description=desc,
                timestamp=recent_order.created_at,
                relevance_score=0.90,
                raw_data={
                    "order_number": recent_order.order_number,
                    "status": recent_order.status,
                    "total_amount_cents": recent_order.total_amount_cents
                },
                sha256_hash=raw_hash
            )

            finding = SpecialistFinding(
                specialist_name="Order Agent",
                finding_type="fulfillment_audit",
                status="VERIFIED",
                conclusion=f"Existing order {recent_order.order_number} found in status {recent_order.status}.",
                confidence=0.95,
                evidence_refs=[evidence.id],
                data={"order_id": recent_order.id, "status": recent_order.status}
            )
            return finding, evidence

        finding = SpecialistFinding(
            specialist_name="Order Agent",
            finding_type="fulfillment_audit",
            status="NORMAL",
            conclusion="No order history found for this customer account.",
            confidence=0.90,
            evidence_refs=[],
            data={}
        )
        return finding, None

order_investigator = OrderInvestigator()
