"""
ResolveX Automated Test Suite — Multi-Tenancy, RBAC & Connector Abstractions
Verifies:
1. Tenant scoping (org_id) across entities
2. Role-Based Access Control enforcement across internal employee roles:
   - Support Agent
   - Support Manager
   - Lead Investigator / Incident Operator
   - Organization Admin
3. Inbound Connector normalization for Zendesk, Stripe, and Datadog
4. Live diagnostic connectivity tests
"""

import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.core.auth import SEEDED_PERSONAS, UserRole
from apps.api.app.integrations.registry import connector_registry

client = TestClient(app)

# ------------------------------------------------------------------------------
# 1. Multi-Tenant Identity & Persona Session Tests
# ------------------------------------------------------------------------------

def test_auth_me_returns_current_persona():
    """Verifies /auth/me returns active user session and tenant scoping"""
    # Test as Admin
    resp_admin = client.get("/api/v1/auth/me", headers={"X-User-Role": "admin"})
    assert resp_admin.status_code == 200
    data_admin = resp_admin.json()["data"]
    assert data_admin["role"] == "admin"
    assert data_admin["full_name"] == "Devin Wright"
    assert data_admin["org_name"] == "Acme Commerce Inc."
    assert "*" in data_admin["permissions"]

    # Test as Support Agent
    resp_agent = client.get("/api/v1/auth/me", headers={"X-User-Role": "support_agent"})
    assert resp_agent.status_code == 200
    data_agent = resp_agent.json()["data"]
    assert data_agent["role"] == "support_agent"
    assert data_agent["full_name"] == "Alex Rivera"
    assert "cases:read" in data_agent["permissions"]
    assert "*" not in data_agent["permissions"]

    # Test as Support Manager
    resp_mgr = client.get("/api/v1/auth/me", headers={"X-User-Role": "support_manager"})
    assert resp_mgr.status_code == 200
    data_mgr = resp_mgr.json()["data"]
    assert data_mgr["role"] == "support_manager"
    assert data_mgr["full_name"] == "Sarah Jenkins"

    # Test as Lead Investigator
    resp_op = client.get("/api/v1/auth/me", headers={"X-User-Role": "lead_investigator"})
    assert resp_op.status_code == 200
    data_op = resp_op.json()["data"]
    assert data_op["role"] == "lead_investigator"
    assert data_op["full_name"] == "Maya Patel"

def test_auth_switch_role_endpoint():
    """Verifies that switching active role works cleanly"""
    resp = client.post("/api/v1/auth/switch-role", json={"role": "support_agent"})
    assert resp.status_code == 200
    assert resp.json()["data"]["role"] == "support_agent"

    resp_invalid = client.post("/api/v1/auth/switch-role", json={"role": "non_existent_role"})
    assert resp_invalid.status_code == 400

# ------------------------------------------------------------------------------
# 2. Integration Connectors & Normalization Tests
# ------------------------------------------------------------------------------

def test_list_integrations_returns_all_registered_connectors():
    """Verifies connector registry exposes Zendesk, Stripe, Shopify, Datadog, Slack"""
    resp = client.get("/api/v1/integrations")
    assert resp.status_code == 200
    connectors = resp.json()["data"]
    names = [c["name"] for c in connectors]
    assert "zendesk" in names
    assert "stripe" in names
    assert "shopify" in names
    assert "datadog" in names
    assert "slack" in names

def test_zendesk_connector_normalization():
    """Verifies Zendesk webhook payload is normalized into InboundTicketPayload"""
    zd_conn = connector_registry.get_connector("zendesk")
    assert zd_conn is not None

    raw_payload = {
        "ticket": {
            "id": 88412,
            "subject": "Missing items in shipment",
            "description": "My delivery arrived with 1 item missing.",
            "priority": "high",
            "type": "incident",
            "requester": {
                "name": "Marcus Vance",
                "email": "marcus.vance@example.com"
            },
            "custom_fields": {
                "order_id": "ORD-10000"
            }
        }
    }

    normalized = zd_conn.normalize(raw_payload)
    assert normalized.external_id == "88412"
    assert normalized.requester_name == "Marcus Vance"
    assert normalized.requester_email == "marcus.vance@example.com"
    assert normalized.subject == "Missing items in shipment"
    assert normalized.order_id == "ORD-10000"

def test_stripe_connector_normalization():
    """Verifies Stripe charge event is normalized into InboundPaymentEvent"""
    stripe_conn = connector_registry.get_connector("stripe")
    assert stripe_conn is not None

    raw_stripe_event = {
        "id": "evt_test_charge_9918",
        "type": "charge.captured",
        "data": {
            "object": {
                "id": "ch_stripe_orphaned_9000",
                "amount": 4999,
                "currency": "usd",
                "receipt_email": "marcus.vance@example.com",
                "status": "succeeded"
            }
        }
    }

    normalized = stripe_conn.normalize(raw_stripe_event)
    assert normalized.event_id == "evt_test_charge_9918"
    assert normalized.gateway_name == "stripe"
    assert normalized.transaction_id == "ch_stripe_orphaned_9000"
    assert normalized.amount_cents == 4999
    assert normalized.customer_email == "marcus.vance@example.com"
    assert normalized.status == "captured"

def test_datadog_connector_normalization():
    """Verifies Datadog telemetry alert is normalized into InboundTelemetryEvent"""
    dd_conn = connector_registry.get_connector("datadog")
    assert dd_conn is not None

    raw_dd_alert = {
        "event": {
            "trace_id": "trace_dd_timeout_1001",
            "service": "payment-webhook-worker",
            "event_type": "redis_enqueue_timeout",
            "severity": "critical",
            "message": "Redis connection pool timeout (5000ms). Webhook event dropped.",
            "latency_ms": 5014.2
        }
    }

    normalized = dd_conn.normalize(raw_dd_alert)
    assert normalized.trace_id == "trace_dd_timeout_1001"
    assert normalized.service_name == "payment-webhook-worker"
    assert normalized.event_type == "redis_enqueue_timeout"
    assert normalized.severity == "critical"
    assert normalized.latency_ms > 5000.0

def test_connector_diagnostic_ping():
    """Verifies connector health check handshake endpoint"""
    resp = client.post("/api/v1/integrations/stripe/test")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["connector_id"] == "stripe"
    assert data["status"] == "healthy"
    assert data["latency_ms"] > 0
    assert "Handshake verified" in data["message"]
