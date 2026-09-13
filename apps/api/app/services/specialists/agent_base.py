"""
ResolveX Base Specialist Agent Runner
Provides standardized execution timing, error trapping, trace step generation,
and run audit persistence across all LangGraph specialist nodes.
"""

import time
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Callable, Optional, Tuple
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import (
    SpecialistFinding,
    EvidenceItem,
    InvestigationStepSchema,
    AgentRunSchema
)
from apps.api.app.services.orchestrator.state import InvestigationState
from apps.api.app.core.logging import logger

def execute_specialist_node(
    agent_name: str,
    agent_id: str,
    action_type: str,
    tool_name: str,
    state: InvestigationState,
    investigate_fn: Callable[[CaseContext], Tuple[SpecialistFinding, Optional[EvidenceItem]]]
) -> Dict[str, Any]:
    """
    Standardized execution harness for a specialist agent node within LangGraph.
    Tracks precise execution duration, isolates failures, and builds audit records.
    """
    start_time_iso = datetime.now(timezone.utc).isoformat()
    t0 = time.perf_counter()
    inv_id = state.get("case_id") or state.get("ticket_id") or str(uuid.uuid4())
    context: Optional[CaseContext] = state.get("case_context")

    # Compute deterministic input state hash
    ticket_id = state.get("ticket_id", "unknown")
    state_repr = f"{ticket_id}:{agent_name}:{start_time_iso}"
    input_hash = hashlib.sha256(state_repr.encode()).hexdigest()[:16]

    if not context:
        # Graceful handling if context was not provided
        duration_ms = int((time.perf_counter() - t0) * 1000)
        end_time_iso = datetime.now(timezone.utc).isoformat()
        err_msg = f"CaseContext unavailable for specialist {agent_name}."
        logger.error(err_msg)

        step = InvestigationStepSchema(
            id=str(uuid.uuid4()),
            investigation_id=inv_id,
            step_number=len(state.get("investigation_steps", [])) + 1,
            agent_name=agent_name,
            action_type=action_type,
            status="failed",
            finding_summary="Specialist execution skipped: missing CaseContext",
            thought_process=None,
            tool_name=tool_name,
            tool_input={"ticket_id": ticket_id},
            tool_output={},
            confidence=0.0,
            evidence_refs=[],
            duration_ms=duration_ms,
            started_at=start_time_iso,
            completed_at=end_time_iso,
            error=err_msg
        )

        run = AgentRunSchema(
            id=str(uuid.uuid4()),
            investigation_id=inv_id,
            agent_id=agent_id,
            agent_name=agent_name,
            input_state_hash=input_hash,
            duration_ms=duration_ms,
            status="failed",
            confidence=0.0,
            finding_summary="Execution failed: missing CaseContext",
            evidence_ids=[],
            error=err_msg,
            started_at=start_time_iso,
            completed_at=end_time_iso
        )

        return {
            "agent_errors": [{"agent": agent_name, "error": err_msg}],
            "investigation_steps": [step],
            "agent_runs": [run]
        }

    try:
        # Execute specialist reasoning & domain lookup
        finding, evidence = investigate_fn(context)
        duration_ms = int((time.perf_counter() - t0) * 1000)
        end_time_iso = datetime.now(timezone.utc).isoformat()

        evidence_ids = [evidence.id] if evidence else []

        step = InvestigationStepSchema(
            id=str(uuid.uuid4()),
            investigation_id=inv_id,
            step_number=len(state.get("investigation_steps", [])) + 1,
            agent_name=agent_name,
            action_type=action_type,
            status="completed",
            finding_summary=finding.conclusion,
            thought_process=f"Examined {action_type} across customer records.",
            tool_name=tool_name,
            tool_input={"ticket_id": ticket_id},
            tool_output=finding.data,
            confidence=finding.confidence,
            evidence_refs=evidence_ids,
            duration_ms=duration_ms,
            started_at=start_time_iso,
            completed_at=end_time_iso,
            error=None
        )

        run = AgentRunSchema(
            id=str(uuid.uuid4()),
            investigation_id=inv_id,
            agent_id=agent_id,
            agent_name=agent_name,
            input_state_hash=input_hash,
            duration_ms=duration_ms,
            status="completed",
            confidence=finding.confidence,
            finding_summary=finding.conclusion,
            evidence_ids=evidence_ids,
            error=None,
            started_at=start_time_iso,
            completed_at=end_time_iso
        )

        update: Dict[str, Any] = {
            "completed_specialists": [agent_name.lower().split()[0]],
            "agent_findings": [finding],
            "investigation_steps": [step],
            "agent_runs": [run]
        }
        if evidence:
            update["evidence"] = [evidence]

        return update

    except Exception as exc:
        duration_ms = int((time.perf_counter() - t0) * 1000)
        end_time_iso = datetime.now(timezone.utc).isoformat()
        err_str = str(exc)
        logger.error(f"Specialist node {agent_name} failed: {err_str}", exc_info=True)

        step = InvestigationStepSchema(
            id=str(uuid.uuid4()),
            investigation_id=inv_id,
            step_number=len(state.get("investigation_steps", [])) + 1,
            agent_name=agent_name,
            action_type=action_type,
            status="failed",
            finding_summary=f"Specialist encountered an internal error: {err_str}",
            thought_process=None,
            tool_name=tool_name,
            tool_input={"ticket_id": ticket_id},
            tool_output={},
            confidence=0.0,
            evidence_refs=[],
            duration_ms=duration_ms,
            started_at=start_time_iso,
            completed_at=end_time_iso,
            error=err_str
        )

        run = AgentRunSchema(
            id=str(uuid.uuid4()),
            investigation_id=inv_id,
            agent_id=agent_id,
            agent_name=agent_name,
            input_state_hash=input_hash,
            duration_ms=duration_ms,
            status="failed",
            confidence=0.0,
            finding_summary=f"Failed: {err_str}",
            evidence_ids=[],
            error=err_str,
            started_at=start_time_iso,
            completed_at=end_time_iso
        )

        return {
            "agent_errors": [{"agent": agent_name, "error": err_str}],
            "investigation_steps": [step],
            "agent_runs": [run]
        }
