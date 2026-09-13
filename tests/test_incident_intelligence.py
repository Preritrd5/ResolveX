"""
ResolveX Phase 4 Automated Test Suite — Ticket-to-Incident Intelligence
Tests multi-signal correlation scoring, non-incident isolation, deduplication,
lifecycle state machine, blast radius, React Flow graph topology, and API endpoints.
"""

import pytest
import math
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.services.correlation_service import correlation_service
from apps.api.app.services.incident_service import incident_service, PRIMARY_INCIDENT_ID, SECONDARY_INCIDENT_ID
from apps.api.app.services.incident_investigation_service import incident_investigation_service

client = TestClient(app)

# ------------------------------------------------------------------------------
# 1. Multi-Signal Correlation Scoring Tests
# ------------------------------------------------------------------------------

def test_multi_signal_correlation_weights():
    """Verifies that correlation weights sum exactly to 1.0"""
    total_weights = (
        correlation_service.w_sem +
        correlation_service.w_temp +
        correlation_service.w_ent +
        correlation_service.w_tel
    )
    assert round(total_weights, 2) == 1.00

def test_temporal_proximity_exponential_decay():
    """Verifies exponential decay: S_temp = exp(-dt / tau) with tau=3600"""
    # Identical timestamps -> 1.0
    t0 = "2026-09-13T13:30:00Z"
    assert correlation_service.calculate_temporal_proximity(t0, t0) == 1.0

    # 1 hour difference -> exp(-1) ~= 0.368
    t1 = "2026-09-13T14:30:00Z"
    score_1h = correlation_service.calculate_temporal_proximity(t0, t1)
    assert math.isclose(score_1h, math.exp(-1.0), rel_tol=1e-2)

    # 10 hours difference -> very low score
    t10 = "2026-09-13T23:30:00Z"
    score_10h = correlation_service.calculate_temporal_proximity(t0, t10)
    assert score_10h < 0.01

def test_semantic_similarity_domain_weighted():
    """Verifies semantic similarity detects correlated symptoms across different wordings"""
    text_a = "Payment was successful but my order is missing"
    text_b = "Charged on credit card but no confirmation email or order number"
    text_c = "Compatibility with MacBook Pro M3 trackpad"

    sim_ab = correlation_service.calculate_semantic_similarity(text_a, text_b)
    sim_ac = correlation_service.calculate_semantic_similarity(text_a, text_c)

    assert sim_ab >= 0.50, f"Expected strong similarity for missing orders, got {sim_ab}"
    assert sim_ac <= 0.10, f"Expected near zero similarity for hardware inquiry, got {sim_ac}"

def test_false_positive_resistance_non_incident():
    """Verifies that an unrelated inquiry (TCK-10009) achieves score < 0.40 and is isolated"""
    t_flagship = {
        "subject": "Payment was successful but my order is missing",
        "intent_category": "payment_successful_order_missing",
        "created_at": "2026-09-13T13:35:00Z"
    }
    t_unrelated = {
        "subject": "Compatibility with MacBook Pro M3",
        "intent_category": "general_inquiry",
        "created_at": "2026-09-13T13:35:00Z"
    }
    service_events = [
        {
            "service_name": "payment-webhook-worker",
            "event_type": "redis_enqueue_timeout",
            "created_at": "2026-09-13T13:30:00Z"
        }
    ]

    score, breakdown = correlation_service.compute_pair_correlation(t_flagship, t_unrelated, service_events)
    assert score < 0.40, f"False positive violation! Score was {score}"
    assert breakdown["semantic"] < 0.20

# ------------------------------------------------------------------------------
# 2. Incident Candidate Lifecycle & State Machine Tests
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_incident_state_machine_transitions():
    """Tests strict state machine transition validation"""
    # 1. confirmed -> resolved (Valid)
    ok, msg, updated = await incident_service.update_incident_status(PRIMARY_INCIDENT_ID, "resolved")
    assert ok
    assert updated.status == "resolved"
    assert updated.resolved_at is not None

    # 2. resolved -> confirmed (Valid Reopen)
    ok, msg, updated = await incident_service.update_incident_status(PRIMARY_INCIDENT_ID, "confirmed")
    assert ok
    assert updated.status == "confirmed"

    # 3. confirmed -> invalid_state (Invalid)
    ok, msg, _ = await incident_service.update_incident_status(PRIMARY_INCIDENT_ID, "unknown_state")
    assert not ok
    assert "Cannot transition" in msg

@pytest.mark.anyio
async def test_incident_detail_and_blast_radius():
    """Verifies blast radius calculation and detail assembly"""
    detail = await incident_service.get_incident(PRIMARY_INCIDENT_ID)
    assert detail is not None
    assert detail.incident_number == "INC-2026-041"
    assert detail.confidence_score >= 0.90
    assert detail.blast_radius is not None
    assert detail.blast_radius.reported_customers_count >= 1
    assert detail.blast_radius.unreported_customers_count == 10
    assert detail.blast_radius.total_affected_customers >= 11
    assert detail.blast_radius.total_financial_exposure_cents > 0

@pytest.mark.anyio
async def test_react_flow_graph_structure():
    """Verifies React Flow nodes and edges are populated with valid types and layout coordinates"""
    graph = await incident_service.get_incident_graph(PRIMARY_INCIDENT_ID)
    assert len(graph.nodes) >= 8
    assert len(graph.edges) >= 8

    # Verify node types exist
    node_types = set(n.type for n in graph.nodes)
    assert "rootCause" in node_types
    assert "incidentHub" in node_types
    assert "ticket" in node_types
    assert "customer" in node_types

    # Verify edge connectivity
    for edge in graph.edges:
        assert edge.source != ""
        assert edge.target != ""
        assert edge.id != ""

@pytest.mark.anyio
async def test_chronological_timeline():
    """Verifies chronological timeline reconstruction"""
    timeline = await incident_service.get_incident_timeline(PRIMARY_INCIDENT_ID)
    assert len(timeline) >= 4
    # Event 1 must be the root cause service error
    assert timeline[0].event_type == "service_error"
    assert "redis" in timeline[0].title.lower()

# ------------------------------------------------------------------------------
# 3. Incident API Endpoints Tests
# ------------------------------------------------------------------------------

def test_api_list_incidents():
    """Tests GET /api/v1/incidents"""
    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    json_data = response.json()
    assert "data" in json_data
    assert len(json_data["data"]) >= 2
    inc_numbers = [i["incident_number"] for i in json_data["data"]]
    assert "INC-2026-041" in inc_numbers

def test_api_detect_incidents():
    """Tests GET /api/v1/incidents/detect"""
    response = client.get("/api/v1/incidents/detect")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["data"]["scanned_tickets_count"] > 0
    assert len(json_data["data"]["incidents"]) >= 2

def test_api_get_incident_detail():
    """Tests GET /api/v1/incidents/{id}"""
    response = client.get(f"/api/v1/incidents/{PRIMARY_INCIDENT_ID}")
    assert response.status_code == 200
    json_data = response.json()["data"]
    assert json_data["incident_number"] == "INC-2026-041"
    assert "explainability" in json_data
    assert "why_one_incident" in json_data["explainability"]

def test_api_get_incident_graph():
    """Tests GET /api/v1/incidents/{id}/graph"""
    response = client.get(f"/api/v1/incidents/{PRIMARY_INCIDENT_ID}/graph")
    assert response.status_code == 200
    json_data = response.json()["data"]
    assert "nodes" in json_data
    assert "edges" in json_data
    assert len(json_data["nodes"]) > 0

def test_api_get_incident_timeline():
    """Tests GET /api/v1/incidents/{id}/timeline"""
    response = client.get(f"/api/v1/incidents/{PRIMARY_INCIDENT_ID}/timeline")
    assert response.status_code == 200
    json_data = response.json()["data"]
    assert len(json_data) >= 4

def test_api_ticket_incident_link():
    """Tests GET /api/v1/tickets/{ticket_id}/incident for Marcus Vance TCK-10000"""
    # Using known UUID for TCK-10000
    ticket_id = "03c206ec-e347-5ff9-9345-360fa48ca8c8"
    response = client.get(f"/api/v1/tickets/{ticket_id}/incident")
    assert response.status_code == 200
    json_data = response.json()["data"]
    assert json_data["is_linked"] is True
    assert json_data["incident_number"] == "INC-2026-041"
    assert json_data["correlation_score"] >= 0.90
