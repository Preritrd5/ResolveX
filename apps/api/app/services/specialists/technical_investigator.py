"""
ResolveX Technical / Service Investigator Interface
Audits microservice telemetry logs, dropped webhooks, and infrastructure events.
"""

import hashlib
import uuid
from typing import Tuple, Optional
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import SpecialistFinding, EvidenceItem

class TechnicalInvestigator:
    def investigate(self, context: CaseContext) -> Tuple[SpecialistFinding, Optional[EvidenceItem]]:
        events = context.service_events

        # Identify critical or error service telemetry
        critical_events = [e for e in events if e.severity in ["critical", "error"]]
        
        if critical_events:
            ev = critical_events[0]
            err_msg = ev.payload.get("error", "Unknown service error")
            desc = f"Service Event [{ev.service_name}:{ev.event_type}] ({ev.severity.upper()}): {err_msg} (Trace: {ev.trace_id})."
            raw_hash = hashlib.sha256(f"{ev.id}:{ev.service_name}:{ev.event_type}:{ev.trace_id}".encode()).hexdigest()

            evidence = EvidenceItem(
                id=str(uuid.uuid4()),
                type="service_event",
                source_entity_id=ev.id,
                description=desc,
                timestamp=ev.created_at,
                relevance_score=0.97,
                raw_data={"service_name": ev.service_name, "event_type": ev.event_type, "payload": ev.payload, "trace_id": ev.trace_id},
                sha256_hash=raw_hash
            )

            finding = SpecialistFinding(
                specialist_name="Technical / Service Agent",
                finding_type="infrastructure_telemetry",
                status="DISCREPANCY_DETECTED",
                conclusion=f"Detected system error in microservice '{ev.service_name}' ({ev.event_type}) correlating with customer symptom: {err_msg}",
                confidence=0.96,
                evidence_refs=[evidence.id],
                data={"service_name": ev.service_name, "event_type": ev.event_type, "severity": ev.severity}
            )
            return finding, evidence

        finding = SpecialistFinding(
            specialist_name="Technical / Service Agent",
            finding_type="infrastructure_telemetry",
            status="NORMAL",
            conclusion="All microservice systems and webhook workers operating normally with zero recent errors.",
            confidence=0.90,
            evidence_refs=[],
            data={}
        )
        return finding, None

technical_investigator = TechnicalInvestigator()
