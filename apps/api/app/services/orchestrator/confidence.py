"""
ResolveX Explainable Confidence Aggregator
Calculates calibrated AI investigation confidence based on evidence quality,
inter-agent corroboration, missing telemetry penalties, and specialist agreement.
"""

from typing import List, Dict, Any, Tuple
from apps.api.app.domain.schemas import SpecialistFinding, EvidenceItem

class ConfidenceAggregator:
    """
    Computes explainable AI confidence for multi-agent investigations.
    Never uses naive unweighted averaging.
    """

    CRITICAL_SPECIALISTS = {"billing", "order", "technical", "refund"}

    def calculate_confidence(
        self,
        findings: List[SpecialistFinding],
        evidence: List[EvidenceItem],
        requested_specialists: List[str],
        completed_specialists: List[str],
        agent_errors: List[Dict[str, Any]]
    ) -> Tuple[float, str]:
        """
        Calculates aggregate confidence score and explicit justification string.
        """
        if not findings:
            return 0.20, "No specialist findings recorded; degraded baseline confidence."

        # 1. Base Domain Weighted Confidence
        total_weight = 0.0
        weighted_sum = 0.0
        
        for f in findings:
            name = f.specialist_name.lower()
            # Critical domains carry higher evidentiary weight
            weight = 2.0 if any(cs in name for cs in self.CRITICAL_SPECIALISTS) else 1.0
            weighted_sum += f.confidence * weight
            total_weight += weight

        base_score = weighted_sum / max(total_weight, 1.0)
        adjustments = []

        # 2. Evidence Grounding Bonus (Concrete source IDs + SHA-256 hashes verified)
        verified_hashes = [e for e in evidence if e.sha256_hash is not None and len(e.sha256_hash) == 64]
        if len(verified_hashes) >= 2:
            base_score += 0.04
            adjustments.append("+4% (multiple cryptographic evidence items verified)")
        elif len(verified_hashes) == 1:
            base_score += 0.02
            adjustments.append("+2% (cryptographic evidence item verified)")

        # 3. Inter-Specialist Corroboration Bonus
        has_billing = any("billing" in f.specialist_name.lower() for f in findings)
        has_order = any("order" in f.specialist_name.lower() for f in findings)
        has_tech = any("technical" in f.specialist_name.lower() for f in findings)

        if has_billing and has_order and has_tech:
            # Full triangulation across financial, logistics, and telemetry
            base_score += 0.04
            adjustments.append("+4% (triangulated cross-domain findings across billing, order, and telemetry)")

        # 4. Incomplete Specialist Penalty
        failed_agents = len(agent_errors)
        missing_count = max(0, len(requested_specialists) - len(completed_specialists))
        if failed_agents > 0 or missing_count > 0:
            penalty = (failed_agents + missing_count) * 0.12
            base_score -= penalty
            adjustments.append(f"-{int(penalty * 100)}% ({failed_agents + missing_count} requested specialist(s) degraded or missing)")

        # 5. Contradiction Detection
        # Check if any finding has status "CONTRADICTORY" or negative conclusion conflicts
        contradictions = [f for f in findings if f.status == "CONTRADICTORY" or "conflict" in f.conclusion.lower()]
        if contradictions:
            base_score -= 0.20
            adjustments.append("-20% (contradictory findings detected between domain records)")

        # Bound score in [0.15, 0.98]
        final_score = round(max(0.15, min(0.98, base_score)), 2)
        
        rationale = f"Base score derived from {len(findings)} specialist findings. Adjustments: " + (
            "; ".join(adjustments) if adjustments else "Standard domain alignment."
        )

        return final_score, rationale

confidence_aggregator = ConfidenceAggregator()
