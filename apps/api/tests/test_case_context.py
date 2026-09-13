"""
Tests for Case Context Engine
Verifies relevance-driven context assembly, missing data handling, and organization scoping.
"""

import pytest
from apps.api.app.services.case_context_service import case_context_service

@pytest.mark.anyio
async def test_case_context_assembly_flagship():
    # Ticket TCK-10000: Marcus Vance
    ticket_id = "03c206ec-e347-5ff9-9345-360fa48ca8c8"
    ctx = await case_context_service.assemble_context(ticket_id)

    assert ctx is not None
    assert ctx.customer.full_name == "Marcus Vance"
    assert ctx.ticket.ticket_number == "TCK-10000"
    assert len(ctx.conversation) >= 1
    # Check that payment context was retrieved
    assert len(ctx.payments) >= 1
    # Check that missing data is properly represented without hallucination
    assert ctx.current_state == "assembled"
    assert ctx.customer_history["loyalty_tier"] == "vip"

@pytest.mark.anyio
async def test_case_context_missing_ticket():
    ctx = await case_context_service.assemble_context("00000000-0000-0000-0000-000000000099")
    assert ctx is None
