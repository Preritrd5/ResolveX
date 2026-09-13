"""
Tests for Single-Case Investigation & Evidence Persistence
Verifies specialist findings, evidence hashing, persistence, and grounded responses without action fabrication.
"""

import pytest
from apps.api.app.services.investigation_service import investigation_service

@pytest.mark.anyio
async def test_investigation_marcus_vance_evidence():
    # Ticket TCK-10000: Marcus Vance
    ticket_id = "03c206ec-e347-5ff9-9345-360fa48ca8c8"
    result = await investigation_service.run_investigation(ticket_id)

    assert result is not None
    assert result.status == "completed"
    assert result.overall_confidence >= 0.85

    # Verify specialist findings
    specialist_names = [f.specialist_name for f in result.findings]
    assert "Billing Agent" in specialist_names
    assert "Order Agent" in specialist_names
    assert "Technical / Service Agent" in specialist_names

    # Verify evidence items
    evidence_types = [e.type for e in result.evidence]
    assert "payment_record" in evidence_types
    assert "service_event" in evidence_types

    # Ensure evidence hashes exist and are valid SHA-256
    for ev in result.evidence:
        assert ev.sha256_hash is not None
        assert len(ev.sha256_hash) == 64

    # Verify zero mutation claims in suggested response
    suggested = result.ai_response.suggested_response
    assert "recreated your order" not in suggested.lower()
    assert "refund has been issued" not in suggested.lower()
    assert "escalated" in suggested.lower() or "investigated" in suggested.lower()
