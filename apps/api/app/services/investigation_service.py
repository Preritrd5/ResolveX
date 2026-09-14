"""
ResolveX Multi-Agent Investigation Service (LangGraph Orchestrated)
Coordinates single-case investigations through a compiled LangGraph DAG with
Supervisor planning, dynamic specialist dispatch, evidence aggregation, and audit persistence.
"""

import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import (
    InvestigationResult,
    SpecialistFinding,
    EvidenceItem,
    AIResponse,
    RoutingDecision,
    InvestigationStepSchema,
    AgentRunSchema,
    SupervisorDecision,
    IntentClassification,
    KnowledgeSnippet
)
from apps.api.app.services.case_context_service import case_context_service
from apps.api.app.services.ai.intent_service import intent_service
from apps.api.app.services.ai.router_service import router_service
from apps.api.app.services.knowledge_service import knowledge_service
from apps.api.app.services.orchestrator.graph import investigation_graph
from apps.api.app.services.orchestrator.state import InvestigationState
from apps.api.app.services.agent_service import agent_service
from apps.api.app.core.logging import logger

class InvestigationService:
    """
    Orchestrates the LangGraph multi-agent investigation workflow with idempotency and audit persistence.
    """

    def __init__(self):
        self._cached_results: Dict[str, InvestigationResult] = {}

    async def run_investigation(self, ticket_id: str, force_rerun: bool = False) -> Optional[InvestigationResult]:
        """
        Executes or retrieves an idempotent multi-agent investigation for a ticket.
        """
        start_time = datetime.now(timezone.utc).isoformat()

        # Idempotency Check: if already completed and not forced rerun, retrieve existing
        if not force_rerun:
            if ticket_id in self._cached_results:
                logger.info(f"Returning cached in-memory investigation {self._cached_results[ticket_id].investigation_id} for ticket {ticket_id} (idempotent).")
                return self._cached_results[ticket_id]
            existing = await self.get_investigation_for_ticket(ticket_id)
            if existing and existing.status in ("completed", "partial"):
                logger.info(f"Returning cached database investigation {existing.investigation_id} for ticket {ticket_id} (idempotent).")
                return existing


        # Step 1: Assemble CaseContext from Supabase
        context = await case_context_service.assemble_context(ticket_id)
        if not context:
            logger.warning(f"Could not assemble CaseContext for ticket_id {ticket_id}")
            return None

        # Step 2: Understand Intent & Sentiment
        messages_text = [m.content for m in context.conversation]
        intent = await intent_service.classify_ticket_intent(
            subject=context.ticket.subject,
            messages=messages_text,
            customer_context=context.customer_history
        )
        sentiment = intent_service.analyze_sentiment(" ".join(messages_text))
        context.intent = intent
        context.sentiment = sentiment

        # Step 3: Retrieve Authoritative Acme Commerce Policies
        policies = await knowledge_service.get_relevant_policies_for_case(context)
        context.relevant_policies = policies

        # Step 4: Determine Routing Decision
        routing = router_service.determine_route(
            intent=intent,
            sentiment=sentiment,
            customer_status=context.customer.status,
            loyalty_tier=context.customer_profile.loyalty_tier if context.customer_profile else "bronze"
        )
        context.routing = routing

        # Step 5: Initialize LangGraph State
        inv_id = str(uuid.uuid4())
        initial_state: InvestigationState = {
            "case_id": inv_id,
            "ticket_id": ticket_id,
            "org_id": context.ticket.org_id,
            "case_context": context,
            "intent": intent,
            "urgency": intent.urgency,
            "sentiment": sentiment,
            "complexity": intent.complexity,
            "requested_specialists": [],
            "completed_specialists": [],
            "agent_findings": [],
            "evidence": [],
            "knowledge_results": policies,
            "investigation_steps": [],
            "agent_runs": [],
            "agent_errors": [],
            "confidence": 0.0,
            "supervisor_decision": None,
            "supervisor_summary": None,
            "recommended_next_step": None,
            "workflow_status": "queued",
            "routing": routing,
            "ai_response": None,
            "trace_metadata": {
                "orchestration_engine": "LangGraph StateGraph",
                "dag_topology": "Dynamic Fan-Out / Fan-In",
                "version": "3.0.0"
            },
            "started_at": start_time,
            "completed_at": None
        }

        # Step 6: Invoke Compiled LangGraph DAG
        logger.info(f"Executing LangGraph multi-agent investigation for ticket {ticket_id} (run_id: {inv_id})...")
        final_state = await investigation_graph.ainvoke(initial_state)

        overall_confidence = final_state.get("confidence", 0.90)
        supervisor_summary = final_state.get("supervisor_summary", "Investigation completed.")
        recommended_next_step = final_state.get("recommended_next_step", "Operator manual review required.")
        ai_resp = final_state.get("ai_response")
        findings = final_state.get("agent_findings", [])
        raw_evidence = final_state.get("evidence", [])
        
        # Defensively deduplicate evidence items by ID before persistence
        seen_ev_ids = set()
        evidence_list = []
        for ev in raw_evidence:
            if ev.id not in seen_ev_ids:
                seen_ev_ids.add(ev.id)
                evidence_list.append(ev)

        steps = final_state.get("investigation_steps", [])
        runs = final_state.get("agent_runs", [])
        decision = final_state.get("supervisor_decision")
        completed_at = final_state.get("completed_at") or datetime.now(timezone.utc).isoformat()
        status = "partial" if final_state.get("agent_errors") else "completed"

        # Step 7: Persist Investigation Record
        inv_record = {
            "id": inv_id,
            "org_id": context.ticket.org_id,
            "ticket_id": ticket_id,
            "incident_id": None,
            "status": status,
            "summary": supervisor_summary,
            "overall_confidence": overall_confidence,
            "started_at": start_time,
            "completed_at": completed_at
        }
        await repo.insert_record("investigations", inv_record)

        # Step 8: Persist Evidence Items
        for ev in evidence_list:
            ev_record = {
                "id": ev.id,
                "org_id": context.ticket.org_id,
                "investigation_id": inv_id,
                "evidence_type": ev.type,
                "source_entity_id": ev.source_entity_id,
                "summary": ev.description,
                "raw_data": ev.raw_data,
                "relevance_score": ev.relevance_score,
                "sha256_hash": ev.sha256_hash,
                "created_at": start_time
            }
            await repo.insert_record("evidence", ev_record)

        # Step 9: Persist Investigation Steps (Trace)
        for st in steps:
            step_record = {
                "id": st.id,
                "org_id": context.ticket.org_id,
                "investigation_id": inv_id,
                "step_number": st.step_number,
                "agent_name": st.agent_name,
                "action_type": st.action_type,
                "status": st.status,
                "finding_summary": st.finding_summary,
                "thought_process": st.thought_process,
                "tool_name": st.tool_name,
                "tool_input": st.tool_input,
                "tool_output": st.tool_output,
                "confidence": st.confidence,
                "evidence_refs": st.evidence_refs,
                "duration_ms": st.duration_ms,
                "started_at": st.started_at,
                "completed_at": st.completed_at,
                "error": st.error,
                "created_at": st.started_at or start_time
            }
            await repo.insert_record("investigation_steps", step_record)

        # Step 10: Persist Agent Runs & Update Registry Stats
        for rn in runs:
            run_record = {
                "id": rn.id,
                "org_id": context.ticket.org_id,
                "investigation_id": inv_id,
                "agent_id": rn.agent_id,
                "input_state_hash": rn.input_state_hash,
                "tokens_used": rn.tokens_used,
                "duration_ms": rn.duration_ms,
                "status": rn.status,
                "confidence": rn.confidence,
                "finding_summary": rn.finding_summary,
                "evidence_ids": rn.evidence_ids,
                "error": rn.error,
                "started_at": rn.started_at,
                "completed_at": rn.completed_at,
                "created_at": rn.started_at or start_time
            }
            await repo.insert_record("agent_runs", run_record)
            # Update live agent counters
            await agent_service.update_agent_execution_stats(rn.agent_id, success=(rn.status == "completed"))

        # Step 11: Persist Agent Findings
        for fn in findings:
            finding_record = {
                "id": str(uuid.uuid4()),
                "org_id": context.ticket.org_id,
                "investigation_id": inv_id,
                "agent_run_id": None,
                "finding_type": fn.finding_type,
                "conclusion": fn.conclusion,
                "confidence": fn.confidence,
                "evidence_refs": fn.evidence_refs,
                "specialist_name": fn.specialist_name,
                "status": fn.status,
                "created_at": start_time
            }
            await repo.insert_record("agent_findings", finding_record)

        # Step 12: Update Ticket Attributes with Multi-Agent Findings
        await repo.update_record("tickets", ticket_id, {
            "ai_confidence": overall_confidence,
            "recommended_team": routing.recommended_team,
            "ai_resolvable": routing.ai_resolvable,
            "intent_category": intent.intent,
            "priority": routing.priority
        })

        result = InvestigationResult(
            investigation_id=inv_id,
            ticket_id=ticket_id,
            status=status,
            summary=supervisor_summary,
            overall_confidence=overall_confidence,
            intent=intent,
            routing=routing,
            supervisor_decision=decision,
            findings=findings,
            evidence=evidence_list,
            relevant_policies=policies,
            investigation_steps=steps,
            agent_runs=runs,
            ai_response=ai_resp,
            recommended_next_step=recommended_next_step,
            started_at=start_time,
            completed_at=completed_at,
            trace_metadata=final_state.get("trace_metadata", {})
        )

        # Cache in-memory for instant idempotent retrieval
        self._cached_results[ticket_id] = result
        return result

    async def get_investigation_for_ticket(self, ticket_id: str) -> Optional[InvestigationResult]:
        """Fetches the latest investigation for a ticket including steps and runs"""
        invs, _ = await repo.list_records("investigations", filters={"ticket_id": ticket_id}, limit=5)
        if not invs:
            return None

        # Sort by completed_at or started_at desc
        sorted_invs = sorted(invs, key=lambda x: x.get("completed_at") or x.get("started_at") or "", reverse=True)
        latest_inv = sorted_invs[0]
        inv_id = latest_inv["id"]

        return await self.get_investigation_by_id(inv_id)

    async def get_investigation_by_id(self, inv_id: str) -> Optional[InvestigationResult]:
        """Fetches complete investigation details by investigation UUID"""
        inv = await repo.get_record_by_id("investigations", inv_id)
        if not inv:
            return None

        ticket_id = inv["ticket_id"]
        if ticket_id in self._cached_results and self._cached_results[ticket_id].investigation_id == inv_id:
            return self._cached_results[ticket_id]

        ticket = await repo.get_record_by_id("tickets", ticket_id)

        # Retrieve steps
        steps = await self.get_investigation_steps(inv_id)
        # Retrieve agent runs
        runs = await self.get_investigation_agents(inv_id)
        # Retrieve evidence
        evidence = await self.get_investigation_evidence(inv_id)
        # Retrieve findings
        raw_findings, _ = await repo.list_records("agent_findings", filters={"investigation_id": inv_id}, limit=50)
        findings = [
            SpecialistFinding(
                specialist_name=rf.get("specialist_name", rf.get("finding_type", "Specialist")),
                finding_type=rf.get("finding_type", "audit"),
                status=rf.get("status", "VERIFIED"),
                conclusion=rf.get("conclusion", ""),
                confidence=rf.get("confidence", 0.90),
                evidence_refs=rf.get("evidence_refs", [])
            )
            for rf in raw_findings
        ]

        # Reconstruct intent & routing from ticket attributes
        intent_cat = ticket.get("intent_category", "general_inquiry") if ticket else "general_inquiry"
        priority = ticket.get("priority", "medium") if ticket else "medium"
        team = ticket.get("recommended_team", "Support Operations") if ticket else "Support Operations"
        resolvable = ticket.get("ai_resolvable", True) if ticket else True

        intent = IntentClassification(
            intent=intent_cat,
            confidence=inv.get("overall_confidence", 0.90),
            urgency=priority,
            sentiment="neutral",
            complexity="medium",
            provider="hybrid"
        )
        routing = RoutingDecision(
            recommended_team=team,
            priority=priority,
            ai_resolvable=resolvable,
            reason="Synthesized from multi-agent investigation evidence.",
            confidence=inv.get("overall_confidence", 0.90),
            provider="hybrid"
        )

        return InvestigationResult(
            investigation_id=inv_id,
            ticket_id=ticket_id,
            status=inv.get("status", "completed"),
            summary=inv.get("summary", ""),
            overall_confidence=inv.get("overall_confidence", 0.90),
            intent=intent,
            routing=routing,
            supervisor_decision=None,
            findings=findings,
            evidence=evidence,
            relevant_policies=[],
            investigation_steps=steps,
            agent_runs=runs,
            ai_response=AIResponse(
                suggested_response=inv.get("summary", ""),
                reasoning_summary=inv.get("summary", ""),
                confidence=inv.get("overall_confidence", 0.90),
                evidence_ids=[e.id for e in evidence],
                policy_sources=[],
                recommended_next_step="Operator review advised.",
                provider="supervisor_synthesis"
            ),
            recommended_next_step="Operator review advised.",
            started_at=inv.get("started_at", ""),
            completed_at=inv.get("completed_at")
        )

    async def get_investigation_steps(self, inv_id: str) -> List[InvestigationStepSchema]:
        """Retrieves chronological investigation trace steps"""
        raw_steps, _ = await repo.list_records("investigation_steps", filters={"investigation_id": inv_id}, limit=50)
        sorted_steps = sorted(raw_steps, key=lambda x: x.get("step_number", 0))
        return [
            InvestigationStepSchema(
                id=str(s.get("id")),
                investigation_id=str(s.get("investigation_id")),
                step_number=s.get("step_number", 1),
                agent_name=s.get("agent_name", "Specialist"),
                action_type=s.get("action_type", "investigate"),
                status=s.get("status", "completed"),
                finding_summary=s.get("finding_summary") or s.get("thought_process"),
                thought_process=s.get("thought_process"),
                tool_name=s.get("tool_name"),
                tool_input=s.get("tool_input", {}),
                tool_output=s.get("tool_output", {}),
                confidence=s.get("confidence"),
                evidence_refs=s.get("evidence_refs", []),
                duration_ms=s.get("duration_ms"),
                started_at=s.get("started_at"),
                completed_at=s.get("completed_at"),
                error=s.get("error"),
                created_at=s.get("created_at")
            )
            for s in sorted_steps
        ]

    async def get_investigation_agents(self, inv_id: str) -> List[AgentRunSchema]:
        """Retrieves all agent runs associated with an investigation"""
        raw_runs, _ = await repo.list_records("agent_runs", filters={"investigation_id": inv_id}, limit=50)
        return [
            AgentRunSchema(
                id=str(r.get("id")),
                investigation_id=str(r.get("investigation_id")),
                agent_id=str(r.get("agent_id")),
                agent_name=r.get("agent_name"),
                input_state_hash=r.get("input_state_hash", ""),
                tokens_used=r.get("tokens_used", 0),
                duration_ms=r.get("duration_ms"),
                status=r.get("status", "completed"),
                confidence=r.get("confidence"),
                finding_summary=r.get("finding_summary"),
                evidence_ids=r.get("evidence_ids", []),
                error=r.get("error"),
                started_at=r.get("started_at"),
                completed_at=r.get("completed_at"),
                created_at=r.get("created_at")
            )
            for r in raw_runs
        ]

    async def get_investigation_evidence(self, inv_id: str) -> List[EvidenceItem]:
        """Retrieves all evidence items attached to an investigation (deduplicated by ID)"""
        raw_ev, _ = await repo.list_records("evidence", filters={"investigation_id": inv_id}, limit=50)
        seen_ids = set()
        items = []
        for r in raw_ev:
            ev_id = str(r.get("id"))
            if ev_id in seen_ids:
                continue
            seen_ids.add(ev_id)
            items.append(
                EvidenceItem(
                    id=ev_id,
                    type=r.get("evidence_type", "order_log"),
                    source_entity_id=r.get("source_entity_id", ""),
                    description=r.get("summary", ""),
                    timestamp=r.get("created_at"),
                    relevance_score=r.get("relevance_score", 0.95),
                    raw_data=r.get("raw_data", {}),
                    sha256_hash=r.get("sha256_hash")
                )
            )
        return items

    async def get_case_evidence(self, ticket_id: str) -> List[EvidenceItem]:
        """Retrieves verified evidence stored for a ticket (backward-compatible)"""
        invs, _ = await repo.list_records("investigations", filters={"ticket_id": ticket_id}, limit=1)
        if not invs:
            res = await self.run_investigation(ticket_id)
            return res.evidence if res else []

        inv_id = invs[0]["id"]
        return await self.get_investigation_evidence(inv_id)

investigation_service = InvestigationService()
