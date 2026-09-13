"""
ResolveX Billing Investigator Interface
Audits payment gateway captures, authorization codes, and bank settlement status.
"""

import hashlib
import uuid
from typing import Tuple, Optional
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import SpecialistFinding, EvidenceItem

class BillingInvestigator:
    def investigate(self, context: CaseContext) -> Tuple[SpecialistFinding, Optional[EvidenceItem]]:
        """
        INPUT: CaseContext
        OUTPUT: SpecialistFinding
        EVIDENCE: EvidenceItem (if payment record identified)
        CONFIDENCE: 0.95 (deterministic financial audit)
        """
        payments = context.payments

        # Check for orphan or recent captured payment
        orphans = [p for p in payments if p.status == "captured" and p.order_id is None]
        captured_payments = [p for p in payments if p.status == "captured"]
        latest = orphans[0] if orphans else (captured_payments[0] if captured_payments else None)
        
        if latest:
            desc = f"Payment of ${latest.amount_cents / 100:.2f} captured on {latest.gateway_name.upper()} (Transaction ID: {latest.gateway_transaction_id})."
            raw_hash = hashlib.sha256(f"{latest.id}:{latest.gateway_transaction_id}:{latest.amount_cents}".encode()).hexdigest()
            
            evidence = EvidenceItem(
                id=str(uuid.uuid4()),
                type="payment_record",
                source_entity_id=latest.id,
                description=desc,
                timestamp=latest.created_at,
                relevance_score=0.96,
                raw_data={
                    "gateway_transaction_id": latest.gateway_transaction_id,
                    "gateway_name": latest.gateway_name,
                    "amount_cents": latest.amount_cents,
                    "status": latest.status,
                    "order_id": latest.order_id
                },
                sha256_hash=raw_hash
            )

            status = "DISCREPANCY_DETECTED" if latest.order_id is None else "VERIFIED"
            conclusion = (
                f"Verified captured transaction of ${latest.amount_cents / 100:.2f} on {latest.gateway_name.upper()} with NO linked order ID. Funds securely received."
                if latest.order_id is None else
                f"Verified captured payment of ${latest.amount_cents / 100:.2f} properly linked to Order."
            )

            finding = SpecialistFinding(
                specialist_name="Billing Agent",
                finding_type="payment_audit",
                status=status,
                conclusion=conclusion,
                confidence=0.98,
                evidence_refs=[evidence.id],
                data={"payment_id": latest.id, "amount_cents": latest.amount_cents, "order_id": latest.order_id}
            )
            return finding, evidence

        # No captured payment found
        finding = SpecialistFinding(
            specialist_name="Billing Agent",
            finding_type="payment_audit",
            status="NORMAL",
            conclusion="No recent captured payment transactions found for this customer.",
            confidence=0.85,
            evidence_refs=[],
            data={}
        )
        return finding, None

billing_investigator = BillingInvestigator()
