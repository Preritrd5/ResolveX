"""
ResolveX Automated Test Suite — End-to-End Customer Complaint Intake
Verifies unauthenticated complaint intake, input sanitization, rate-limiting,
ticket creation, queue insertion, case detail resolution, multi-agent AI investigation,
and ticket-to-incident correlation.
"""

import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.services.support_intake_service import support_intake_service
from apps.api.app.services.ticket_service import ticket_service
from apps.api.app.services.incident_service import incident_service, PRIMARY_INCIDENT_ID
from apps.api.app.domain.schemas import CustomerSupportIntakeRequest

client = TestClient(app)

# ------------------------------------------------------------------------------
# 1. Public Intake Endpoint Tests
# ------------------------------------------------------------------------------

def test_public_support_info_endpoint():
    """Verifies that public support channel metadata is reachable without auth"""
    resp = client.get("/api/v1/support/info")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["organization_name"] == "Acme Commerce Inc."
    assert data["operating_status"] == "operational"
    assert len(data["categories"]) > 0

def test_public_support_intake_flagship_scenario():
    """
    Verifies end-to-end submission of the flagship complaint:
    'My payment succeeded but my order is missing.'
    """
    payload = {
        "full_name": "Rahul Sharma",
        "email": "rahul@example.com",
        "order_id": "ORD-10452",
        "category": "Payment & Billing Issues",
        "subject": "Payment was successful but my order is missing",
        "message": "Hi support, my payment of $49.99 was captured on Stripe 25 minutes ago, but my orders page is empty and no confirmation email arrived."
    }

    resp = client.post("/api/v1/support/intake", json=payload)
    assert resp.status_code == 201, f"Expected 201 Created, got {resp.status_code}: {resp.text}"

    data = resp.json()["data"]
    assert "ticket_id" in data
    assert "ticket_number" in data
    assert data["ticket_number"].startswith("RX-")
    assert data["customer_email"] == "rahul@example.com"
    assert data["customer_name"] == "Rahul Sharma"
    assert data["status"] == "open"
    assert "confirmation_code" in data

    ticket_id = data["ticket_id"]
    ticket_number = data["ticket_number"]

    # 2. Verify ticket appears in live cases queue
    list_resp = client.get("/api/v1/tickets?limit=10")
    assert list_resp.status_code == 200
    tickets = list_resp.json()["data"]
    assert len(tickets) > 0

    # Ensure the newly created ticket is at the top of the queue
    top_ticket = tickets[0]
    assert top_ticket["ticket_number"] == ticket_number
    assert top_ticket["customer_name"] == "Rahul Sharma"
    assert top_ticket["intent_category"] == "payment_successful_order_missing"

    # 3. Verify internal Case Detail includes customer & messages
    detail_resp = client.get(f"/api/v1/tickets/{ticket_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()["data"]
    assert detail["id"] == ticket_id
    assert detail["customer"]["email"] == "rahul@example.com"
    assert len(detail["messages"]) >= 1
    assert "captured on Stripe" in detail["messages"][0]["content"]

    # 4. Verify Ticket-to-Incident Intelligence correlation
    corr_resp = client.get(f"/api/v1/tickets/{ticket_id}/incident")
    assert corr_resp.status_code == 200
    corr = corr_resp.json()["data"]
    assert corr["is_linked"] is True
    assert corr["incident_id"] == PRIMARY_INCIDENT_ID
    assert corr["incident_number"] == "INC-2026-041"
    assert "Stripe Webhook Delivery Drop" in corr["incident_title"]
    assert corr["correlation_score"] >= 0.85

    # 5. Verify Multi-Agent AI Investigation runs on the dynamic intake ticket
    inv_resp = client.post(f"/api/v1/ai/tickets/{ticket_id}/investigate?force_rerun=true")
    assert inv_resp.status_code == 200
    inv = inv_resp.json()["data"]
    assert inv["status"] in ("completed", "partial")
    assert len(inv["agent_runs"]) >= 3
    assert len(inv["evidence"]) >= 3
    assert inv["overall_confidence"] > 0.70

def test_public_support_intake_validation_rejects_invalid_inputs():
    """Verifies that invalid or malformed public submissions are rejected with HTTP 400 or 422"""
    # Empty message / too short
    resp_short = client.post("/api/v1/support/intake", json={
        "full_name": "John Doe",
        "email": "john@example.com",
        "message": "hi" # < 10 chars
    })
    assert resp_short.status_code in (400, 422)

    # Invalid email address
    resp_bad_email = client.post("/api/v1/support/intake", json={
        "full_name": "John Doe",
        "email": "not-an-email",
        "message": "This is a legitimate complaint about my product not arriving."
    })
    assert resp_bad_email.status_code in (400, 422)

    # Empty name
    resp_empty_name = client.post("/api/v1/support/intake", json={
        "full_name": " ",
        "email": "john@example.com",
        "message": "This is a legitimate complaint about my product not arriving."
    })
    assert resp_empty_name.status_code in (400, 422)

def test_dynamic_customer_creation_for_new_user():
    """Verifies that a customer not previously in the database is automatically created without breaking"""
    new_email = "brand_new_customer_2026@testmail.com"
    payload = {
        "full_name": "Aarav Patel",
        "email": new_email,
        "category": "Returns & Refund Delay",
        "message": "I requested a return 8 days ago and have not received any refund status update."
    }

    resp = client.post("/api/v1/support/intake", json=payload)
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["customer_email"] == new_email

    # Verify ticket detail can retrieve the newly created customer
    ticket_id = data["ticket_id"]
    detail_resp = client.get(f"/api/v1/tickets/{ticket_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()["data"]
    assert detail["customer"]["full_name"] == "Aarav Patel"
    assert detail["customer"]["email"] == new_email
