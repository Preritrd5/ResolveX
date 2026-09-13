"""
ResolveX Policy Investigator Interface
Evaluates corporate SLAs and policy compliance based on verified case facts.
"""

import hashlib
import uuid
from typing import Tuple, Optional
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import SpecialistFinding, EvidenceItem

class PolicyInvestigator:
    def investigate(self, context: CaseContext) -> Tuple[SpecialistFinding, Optional[EvidenceItem]]:
        policies = context.relevant_policies
        intent = context.intent.intent if context.intent else "general_inquiry"

        if policies:
            top_policy = policies[0]
            desc = f"Applicable Corporate Policy: '{top_policy.document_title}' ({top_policy.section}). Grounded SLA and remediation criteria retrieved."
            raw_hash = hashlib.sha256(f"{top_policy.id}:{top_policy.document_title}:{top_policy.section}".encode()).hexdigest()

            evidence = EvidenceItem(
                id=str(uuid.uuid4()),
                type="policy_rule",
                source_entity_id=top_policy.id,
                description=desc,
                timestamp=None,
                relevance_score=top_policy.relevance_score,
                raw_data={"document_title": top_policy.document_title, "section": top_policy.section, "category": top_policy.category},
                sha256_hash=raw_hash
            )

            finding = SpecialistFinding(
                specialist_name="Policy / Knowledge Agent",
                finding_type="compliance_audit",
                status="VERIFIED",
                conclusion=f"Case grounded in authoritative Acme Commerce policy '{top_policy.document_title}'. SLA guidelines identified for resolution.",
                confidence=0.95,
                evidence_refs=[evidence.id],
                data={"policy_title": top_policy.document_title, "section": top_policy.section}
            )
            return finding, evidence

        finding = SpecialistFinding(
            specialist_name="Policy / Knowledge Agent",
            finding_type="compliance_audit",
            status="NORMAL",
            conclusion="Standard operating customer service procedures apply.",
            confidence=0.85,
            evidence_refs=[],
            data={}
        )
        return finding, None

policy_investigator = PolicyInvestigator()
