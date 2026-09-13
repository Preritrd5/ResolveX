"""
ResolveX Refund Investigator Interface
Audits refund authorization state and banking settlement clearinghouse status.
"""

import hashlib
import uuid
from typing import Tuple, Optional
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import SpecialistFinding, EvidenceItem

class RefundInvestigator:
    def investigate(self, context: CaseContext) -> Tuple[SpecialistFinding, Optional[EvidenceItem]]:
        refunds = context.refunds

        # Look for delayed or pending refunds
        pending = [r for r in refunds if r.status in ["processing", "requested", "pending_approval"]]
        if pending:
            latest = pending[0]
            desc = f"Refund of ${latest.amount_cents / 100:.2f} for Order/Payment {latest.payment_id} currently stuck in status: {latest.status.upper()}."
            raw_hash = hashlib.sha256(f"refund:{latest.id}:{latest.status}:{latest.amount_cents}".encode()).hexdigest()

            evidence = EvidenceItem(
                id=str(uuid.uuid4()),
                type="payment_record",
                source_entity_id=latest.id,
                description=desc,
                timestamp=latest.created_at,
                relevance_score=0.95,
                raw_data={"refund_id": latest.id, "amount_cents": latest.amount_cents, "status": latest.status, "reason": latest.reason},
                sha256_hash=raw_hash
            )

            finding = SpecialistFinding(
                specialist_name="Refund Agent",
                finding_type="refund_audit",
                status="DISCREPANCY_DETECTED",
                conclusion=f"Authorized refund of ${latest.amount_cents / 100:.2f} has not completed bank settlement; currently in status: {latest.status}.",
                confidence=0.94,
                evidence_refs=[evidence.id],
                data={"refund_id": latest.id, "amount_cents": latest.amount_cents}
            )
            return finding, evidence

        finding = SpecialistFinding(
            specialist_name="Refund Agent",
            finding_type="refund_audit",
            status="NORMAL",
            conclusion="No active or pending refunds found for this customer.",
            confidence=0.90,
            evidence_refs=[],
            data={}
        )
        return finding, None

refund_investigator = RefundInvestigator()
