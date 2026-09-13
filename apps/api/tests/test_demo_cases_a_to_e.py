"""
Tests for 5 Flagship Demo Cases (Cases A through E)
Validates end-to-end investigation execution for all required scenario tickets.
"""

import pytest
from apps.api.app.services.ticket_service import ticket_service
from apps.api.app.services.investigation_service import investigation_service

@pytest.mark.anyio
async def test_case_a_marcus_vance():
    # CASE A: "My payment went through but my order is missing."
    tickets, _ = await ticket_service.list_tickets(query="TCK-10000")
    assert len(tickets) > 0
    t_id = tickets[0].id

    result = await investigation_service.run_investigation(t_id)
    assert result is not None
    assert "payment" in result.intent.intent.lower()
    assert result.routing.recommended_team == "Billing"
    assert any("order_missing" in e.source_entity_id or "missing" in e.description.lower() for e in result.evidence)
    assert result.overall_confidence >= 0.88

@pytest.mark.anyio
async def test_case_b_elena_rostova():
    # CASE B: "Refund has not arrived."
    tickets, _ = await ticket_service.list_tickets(query="TCK-10005")
    assert len(tickets) > 0
    t_id = tickets[0].id

    result = await investigation_service.run_investigation(t_id)
    assert result is not None
    assert "refund" in result.intent.intent.lower()
    assert result.routing.recommended_team == "Billing"

@pytest.mark.anyio
async def test_case_c_david_kim():
    # CASE C: "Subscription renewed unexpectedly."
    tickets, _ = await ticket_service.list_tickets(query="TCK-10020")
    assert len(tickets) > 0
    t_id = tickets[0].id

    result = await investigation_service.run_investigation(t_id)
    assert result is not None
    assert "subscription" in result.intent.intent.lower()
    assert result.routing.recommended_team == "Billing"

@pytest.mark.anyio
async def test_case_d_priya_sharma():
    # CASE D: "Account locked after password reset."
    tickets, _ = await ticket_service.list_tickets(query="TCK-10025")
    assert len(tickets) > 0
    t_id = tickets[0].id

    result = await investigation_service.run_investigation(t_id)
    assert result is not None
    assert "account" in result.intent.intent.lower()
    assert result.routing.recommended_team == "Account Security"
    assert result.routing.ai_resolvable is False # Human verification required

@pytest.mark.anyio
async def test_case_e_carlos_mendez():
    # CASE E: "Product stopped working after update."
    tickets, _ = await ticket_service.list_tickets(query="TCK-10030")
    assert len(tickets) > 0
    t_id = tickets[0].id

    result = await investigation_service.run_investigation(t_id)
    assert result is not None
    assert "troubleshooting" in result.intent.intent.lower() or "technical" in result.intent.intent.lower()
    assert result.routing.recommended_team == "Technical Support"
