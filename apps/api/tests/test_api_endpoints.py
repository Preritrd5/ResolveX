"""
ResolveX Backend API Unit & Integration Tests
Verifies health, customers, tickets, orders, payments, escalations, and analytics endpoints
"""

import pytest
from starlette.testclient import TestClient
from apps.api.app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["status"] == "healthy"
    assert "service" in data["data"]

def test_health_db_endpoint(client):
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data["data"]

def test_version_endpoint(client):
    response = client.get("/api/version")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data["data"]
    assert data["data"]["platform"] == "ResolveX Autonomous Customer Incident Intelligence"

def test_list_customers_endpoint(client):
    response = client.get("/api/v1/customers?page=1&limit=10")
    assert response.status_code == 200
    body = response.json()
    assert "data" in body
    assert "meta" in body
    assert len(body["data"]) == 10
    assert body["meta"]["total"] >= 500

    # Marcus Vance check (first customer)
    first_customer = body["data"][0]
    assert "email" in first_customer
    assert "full_name" in first_customer

def test_get_customer_detail_found(client):
    list_res = client.get("/api/v1/customers?limit=1").json()
    actual_id = list_res["data"][0]["id"]

    res = client.get(f"/api/v1/customers/{actual_id}")
    assert res.status_code == 200
    body = res.json()["data"]
    assert body["id"] == actual_id
    assert "profile" in body

def test_get_customer_detail_not_found(client):
    fake_id = "11111111-1111-1111-1111-111111111111"
    res = client.get(f"/api/v1/customers/{fake_id}")
    assert res.status_code == 404
    err = res.json()["error"]
    assert err["code"] == "CUSTOMER_NOT_FOUND"

def test_list_tickets_endpoint(client):
    res = client.get("/api/v1/tickets?page=1&limit=20")
    assert res.status_code == 200
    body = res.json()
    assert len(body["data"]) == 20
    assert body["meta"]["total"] >= 300

def test_ticket_filtering_by_status(client):
    res = client.get("/api/v1/tickets?status=open")
    assert res.status_code == 200
    body = res.json()
    for t in body["data"]:
        assert t["status"] == "open"

def test_get_ticket_detail_found(client):
    list_res = client.get("/api/v1/tickets?limit=1").json()
    first_id = list_res["data"][0]["id"]

    res = client.get(f"/api/v1/tickets/{first_id}")
    assert res.status_code == 200
    body = res.json()["data"]
    assert body["id"] == first_id
    assert "messages" in body
    assert len(body["messages"]) >= 1

def test_get_ticket_detail_not_found(client):
    fake_id = "11111111-1111-1111-1111-111111111111"
    res = client.get(f"/api/v1/tickets/{fake_id}")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "TICKET_NOT_FOUND"

def test_orders_and_payments_endpoints(client):
    res_orders = client.get("/api/v1/orders?limit=5")
    assert res_orders.status_code == 200
    assert len(res_orders.json()["data"]) == 5

    res_payments = client.get("/api/v1/payments?limit=5")
    assert res_payments.status_code == 200
    assert len(res_payments.json()["data"]) == 5

def test_incidents_and_escalations_endpoints(client):
    res_inc = client.get("/api/v1/incidents")
    assert res_inc.status_code == 200
    assert len(res_inc.json()["data"]) >= 1

    res_esc = client.get("/api/v1/escalations")
    assert res_esc.status_code == 200
    assert len(res_esc.json()["data"]) >= 1

def test_analytics_overview_endpoint(client):
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total_customers"] >= 500
    assert data["open_cases"] >= 1
    assert data["pending_resolution"] >= 1
    assert "system_status" in data
    assert len(data["recent_tickets"]) > 0

def test_agents_registry_endpoint(client):
    res = client.get("/api/v1/agents")
    assert res.status_code == 200
    agents = res.json()["data"]
    assert len(agents) == 12 # 12 Specialist Agents defined in Phase 0
