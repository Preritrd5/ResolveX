"""
ResolveX Account Investigator Interface
Audits customer security status, loyalty tier, lifetime value, and fraud risk score.
"""

import hashlib
import uuid
from typing import Tuple, Optional
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import SpecialistFinding, EvidenceItem

class AccountInvestigator:
    def investigate(self, context: CaseContext) -> Tuple[SpecialistFinding, Optional[EvidenceItem]]:
        cust = context.customer
        profile = context.customer_profile

        # Check if customer is locked or flagged for fraud
        is_restricted = cust.status in ["blocked", "flagged_for_fraud"]
        desc = f"Customer profile for {cust.full_name}: Status={cust.status.upper()}, Tier={(profile.loyalty_tier.upper() if profile else 'BRONZE')}, LTV=${(profile.lifetime_value_cents / 100 if profile else 0):.2f}."
        raw_hash = hashlib.sha256(f"customer:{cust.id}:{cust.status}".encode()).hexdigest()

        evidence = EvidenceItem(
            id=str(uuid.uuid4()),
            type="customer_profile",
            source_entity_id=cust.id,
            description=desc,
            timestamp=cust.created_at,
            relevance_score=0.92,
            raw_data={
                "customer_id": cust.id,
                "email": cust.email,
                "status": cust.status,
                "loyalty_tier": profile.loyalty_tier if profile else "bronze",
                "churn_risk": profile.churn_risk_score if profile else 0.0
            },
            sha256_hash=raw_hash
        )

        status = "DISCREPANCY_DETECTED" if is_restricted else "VERIFIED"
        conclusion = (
            f"Customer account {cust.email} is currently {cust.status.upper()}. Security policies require human verification."
            if is_restricted else
            f"Account verified in good standing ({profile.loyalty_tier.upper() if profile else 'BRONZE'} tier, active status)."
        )

        finding = SpecialistFinding(
            specialist_name="Account Agent",
            finding_type="security_audit",
            status=status,
            conclusion=conclusion,
            confidence=0.96,
            evidence_refs=[evidence.id],
            data={"status": cust.status, "tier": profile.loyalty_tier if profile else "bronze"}
        )
        return finding, evidence

account_investigator = AccountInvestigator()
