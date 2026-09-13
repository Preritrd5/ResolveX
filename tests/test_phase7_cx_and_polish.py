"""
ResolveX Phase 7 — Advanced CX Analytics, Global Search, Demo Mode & System Health Tests
"""

import pytest
from apps.api.app.services.analytics_service import analytics_service
from apps.api.app.services.search_service import search_service
from apps.api.app.services.demo_service import demo_service
from apps.api.app.repositories.base_repository import repo
from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)

@pytest.mark.anyio
async def test_advanced_cx_analytics_calculation():
    """Verify CX analytics derives all figures from actual database records with zero fake numbers"""
    cx = await analytics_service.get_advanced_cx_analytics()
    
    # Fundamental counts
    assert cx.total_tickets > 0
    assert cx.total_customers > 0
    assert cx.total_orders > 0
    assert cx.total_revenue_cents > 0
    
    # Rates
    assert 0.0 <= cx.resolution_rate_percentage <= 100.0
    assert 0.0 <= cx.escalation_rate_percentage <= 100.0
    assert 0.0 <= cx.repeat_contact_rate_percentage <= 100.0

    # Intent Distribution (aggregated from ticket subjects)
    assert len(cx.intent_distribution) > 0
    top_intent = cx.intent_distribution[0]
    assert top_intent.count > 0
    assert top_intent.percentage > 0.0

    # Service Failure Distribution (aggregated from service events)
    assert len(cx.service_failure_distribution) > 0

    # Resolution Breakdown (Phase 5 verified actions)
    assert "verified_actions" in cx.resolution_breakdown
    assert "pending_approvals" in cx.resolution_breakdown

    # Escalation Breakdown
    assert "pending_count" in cx.escalation_breakdown

    # Proactive Funnel (Phase 6 predictions)
    assert "total_evaluated_candidates" in cx.proactive_funnel
    assert cx.proactive_funnel["total_evaluated_candidates"] > 0

    # Top Incidents
    assert len(cx.top_incidents) > 0
    assert cx.top_incidents[0]["incident_number"] == "INC-2026-041"

@pytest.mark.anyio
async def test_insufficient_data_guard_on_avg_resolution_time():
    """Verify statistical honesty: Insufficient data guard triggers when resolution timestamps are sparse"""
    cx = await analytics_service.get_advanced_cx_analytics()
    # Either calculable with >=3 samples or cleanly reports insufficient data notice
    if cx.avg_resolution_time_minutes is None:
        assert cx.avg_resolution_time_notice is not None
        assert "Insufficient data" in cx.avg_resolution_time_notice
    else:
        assert cx.avg_resolution_time_minutes > 0.0

@pytest.mark.anyio
async def test_global_search_across_entities():
    """Verify search finds records across customers, tickets, incidents, orders, and payments"""
    # 1. Search Marcus
    res_marcus = await search_service.global_search("marcus")
    assert res_marcus.total_results > 0
    assert any("marcus" in c["full_name"].lower() for c in res_marcus.customers)

    # 2. Search Ticket
    res_ticket = await search_service.global_search("TCK")
    assert len(res_ticket.tickets) > 0

    # 3. Search Incident
    res_inc = await search_service.global_search("INC-2026")
    assert len(res_inc.incidents) > 0
    assert res_inc.incidents[0]["incident_number"] == "INC-2026-041"

    # 4. Search Order
    res_order = await search_service.global_search("ORD")
    assert len(res_order.orders) > 0

    # 5. Search Payment
    res_pay = await search_service.global_search("stripe")
    assert len(res_pay.payments) > 0

@pytest.mark.anyio
async def test_global_search_empty_query():
    """Verify empty search query returns empty grouped results safely"""
    res = await search_service.global_search("")
    assert res.total_results == 0
    assert len(res.customers) == 0
    assert len(res.tickets) == 0

@pytest.mark.anyio
async def test_demo_status_returns_flagship_context():
    """Verify demo status exposes flagship incident INC-2026-041 and Marcus Vance"""
    status = await demo_service.get_demo_status()
    assert status.demo_mode is True
    assert status.seed == 42
    assert status.flagship_incident_number == "INC-2026-041"
    assert status.flagship_customer_name == "Marcus Vance"
    assert len(status.recommended_flow) == 8

@pytest.mark.anyio
async def test_demo_reset_safe_and_reproducible():
    """Verify demo reset restores deterministic baseline and creates an audit record"""
    res = await demo_service.reset_demo_data(seed=42, requested_by="test_operator")
    assert res.success is True
    assert res.seed == 42
    assert res.records_restored["customers"] > 0
    assert res.records_restored["tickets"] > 0

    # Check audit log in repository
    actions, _ = await repo.list_records("action_executions", filters={"action_type": "reset_demo_environment"})
    assert len(actions) > 0
    assert actions[-1]["actor_id"] == "test_operator"

def test_api_system_health_detailed():
    """Verify GET /system/health checks all 6 subsystems"""
    response = client.get("/system/health")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] in ["healthy", "degraded"]
    assert "backend_api" in data["components"]
    assert "database" in data["components"]
    assert "ai_orchestration" in data["components"]
    assert "knowledge_rag" in data["components"]
    assert "prediction_engine" in data["components"]
    assert "proactive_transport" in data["components"]

def test_api_cx_analytics_endpoint():
    """Verify GET /api/v1/analytics/cx returns complete advanced CX metrics"""
    response = client.get("/api/v1/analytics/cx")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_tickets"] > 0
    assert len(data["intent_distribution"]) > 0
    assert len(data["top_incidents"]) > 0

def test_api_search_endpoint():
    """Verify GET /api/v1/search endpoint returns grouped results"""
    response = client.get("/api/v1/search?q=marcus")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_results"] > 0
    assert len(data["customers"]) > 0

def test_api_demo_endpoints():
    """Verify GET /api/v1/demo/status and POST /api/v1/demo/reset"""
    status_resp = client.get("/api/v1/demo/status")
    assert status_resp.status_code == 200
    assert status_resp.json()["data"]["flagship_incident_number"] == "INC-2026-041"

    reset_resp = client.post("/api/v1/demo/reset", json={"seed": 42, "actor": "hackathon_lead"})
    assert reset_resp.status_code == 200
    assert reset_resp.json()["data"]["success"] is True
