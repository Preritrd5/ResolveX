"""
Phase 3 Multi-Agent LangGraph Orchestration Test Suite
Verifies StateGraph compilation, dynamic specialist routing, evidence aggregation,
explainable confidence methodology, partial failure isolation, and idempotency.
"""

import pytest
from apps.api.app.services.orchestrator.graph import investigation_graph, route_specialists
from apps.api.app.services.orchestrator.supervisor import supervisor_agent
from apps.api.app.services.orchestrator.confidence import confidence_aggregator
from apps.api.app.services.investigation_service import investigation_service
from apps.api.app.domain.schemas import SpecialistFinding, EvidenceItem

@pytest.mark.anyio
async def test_supervisor_planning_specialist_selection():
    """Verifies that SupervisorAgent selects the correct specialists based on symptoms"""
    # Case A: Missing order after payment
    state_a = {
        "case_id": "test_case_a",
        "ticket_id": "03c206ec-e347-5ff9-9345-360fa48ca8c8",
        "intent": {"intent": "payment_successful_order_missing"},
        "investigation_steps": []
    }
    plan_a = await supervisor_agent.plan_investigation(state_a)
    assert "billing" in plan_a["requested_specialists"]
    assert "order" in plan_a["requested_specialists"]
    assert "technical" in plan_a["requested_specialists"]
    assert "policy" in plan_a["requested_specialists"]

    # Refund Case
    state_refund = {
        "case_id": "test_case_b",
        "ticket_id": "tck_refund",
        "intent": {"intent": "refund_delayed_inquiry"},
        "investigation_steps": []
    }
    plan_b = await supervisor_agent.plan_investigation(state_refund)
    assert "refund" in plan_b["requested_specialists"]
    assert "billing" in plan_b["requested_specialists"]

    # Account Lockout Case
    state_acc = {
        "case_id": "test_case_c",
        "ticket_id": "tck_acc",
        "intent": {"intent": "account_security_lockout"},
        "investigation_steps": []
    }
    plan_c = await supervisor_agent.plan_investigation(state_acc)
    assert "account" in plan_c["requested_specialists"]

def test_dynamic_send_routing():
    """Verifies LangGraph dynamic Send router dispatches only requested specialists"""
    state = {
        "requested_specialists": ["billing", "order"]
    }
    sends = route_specialists(state)
    target_nodes = [s.node for s in sends]
    assert "billing_node" in target_nodes
    assert "order_node" in target_nodes
    assert "technical_node" not in target_nodes
    assert "refund_node" not in target_nodes

def test_explainable_confidence_aggregation():
    """Verifies multi-factor confidence aggregation formula"""
    findings = [
        SpecialistFinding(
            specialist_name="Billing Agent",
            finding_type="payment_audit",
            status="DISCREPANCY_DETECTED",
            conclusion="Payment captured with no linked order.",
            confidence=0.98
        ),
        SpecialistFinding(
            specialist_name="Order Agent",
            finding_type="order_audit",
            status="DISCREPANCY_DETECTED",
            conclusion="No order record found.",
            confidence=0.95
        ),
        SpecialistFinding(
            specialist_name="Technical Agent",
            finding_type="telemetry_audit",
            status="DISCREPANCY_DETECTED",
            conclusion="Webhook timeout event detected.",
            confidence=0.92
        )
    ]
    evidence = [
        EvidenceItem(
            id="ev_1",
            type="payment_record",
            source_entity_id="pay_123",
            description="Stripe charge captured",
            relevance_score=0.96,
            sha256_hash="a" * 64
        ),
        EvidenceItem(
            id="ev_2",
            type="service_event",
            source_entity_id="evt_456",
            description="Redis queue timeout",
            relevance_score=0.94,
            sha256_hash="b" * 64
        )
    ]

    # Full alignment with evidence
    score, rationale = confidence_aggregator.calculate_confidence(
        findings=findings,
        evidence=evidence,
        requested_specialists=["billing", "order", "technical"],
        completed_specialists=["billing", "order", "technical"],
        agent_errors=[]
    )
    assert score >= 0.90
    assert "triangulated cross-domain findings" in rationale

    # Penalized score with missing specialist
    score_penalized, rationale_pen = confidence_aggregator.calculate_confidence(
        findings=findings,
        evidence=evidence,
        requested_specialists=["billing", "order", "technical", "policy"],
        completed_specialists=["billing", "order", "technical"],
        agent_errors=[{"agent": "policy", "error": "ChromaDB timeout"}]
    )
    assert score_penalized < score
    assert "requested specialist(s) degraded" in rationale_pen

@pytest.mark.anyio
async def test_investigation_idempotency():
    """Verifies repeated investigation calls on same ticket do not duplicate executions"""
    ticket_id = "03c206ec-e347-5ff9-9345-360fa48ca8c8"

    # First run: force execution
    run1 = await investigation_service.run_investigation(ticket_id, force_rerun=True)
    assert run1 is not None
    assert run1.status == "completed"
    inv_id1 = run1.investigation_id

    # Second run without force_rerun: should return cached idempotent result
    run2 = await investigation_service.run_investigation(ticket_id, force_rerun=False)
    assert run2 is not None
    assert run2.investigation_id == inv_id1
