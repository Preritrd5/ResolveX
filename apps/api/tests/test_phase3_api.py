"""
Phase 3 Multi-Agent API Verification Test Suite
Verifies all Phase 3 endpoints: /investigate, /investigation, /investigations/{id}/steps, /agents.
"""

import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)

TICKET_A_ID = "03c206ec-e347-5ff9-9345-360fa48ca8c8"

def test_api_investigate_ticket_endpoint():
    """POST /api/v1/ai/tickets/{id}/investigate triggers multi-agent orchestration"""
    res = client.post(f"/api/v1/ai/tickets/{TICKET_A_ID}/investigate?force_rerun=true")
    assert res.status_code == 200
    body = res.json()
    data = body["data"]
    
    assert data["ticket_id"] == TICKET_A_ID
    assert data["status"] in ("completed", "partial")
    assert len(data["investigation_steps"]) >= 5
    assert len(data["agent_runs"]) >= 4
    assert data["overall_confidence"] >= 0.85
    assert "investigation_id" in body["meta"]
    assert body["meta"]["orchestrator"] == "LangGraph"

def test_api_get_ticket_investigation():
    """GET /api/v1/tickets/{id}/investigation returns latest multi-agent results"""
    res = client.get(f"/api/v1/tickets/{TICKET_A_ID}/investigation")
    assert res.status_code == 200
    body = res.json()
    assert body["data"]["ticket_id"] == TICKET_A_ID
    assert len(body["data"]["investigation_steps"]) > 0

def test_api_get_investigation_steps_and_agents():
    """GET /api/v1/investigations/{id}/steps and /agents returns trace data"""
    inv_res = client.get(f"/api/v1/tickets/{TICKET_A_ID}/investigation")
    inv_id = inv_res.json()["data"]["investigation_id"]

    # Steps endpoint
    steps_res = client.get(f"/api/v1/investigations/{inv_id}/steps")
    assert steps_res.status_code == 200
    steps = steps_res.json()["data"]
    assert len(steps) > 0
    assert "agent_name" in steps[0]
    assert "step_number" in steps[0]

    # Agents endpoint
    agents_res = client.get(f"/api/v1/investigations/{inv_id}/agents")
    assert agents_res.status_code == 200
    agent_runs = agents_res.json()["data"]
    assert len(agent_runs) > 0
    assert "agent_id" in agent_runs[0]
    assert "duration_ms" in agent_runs[0]

    # Evidence endpoint
    ev_res = client.get(f"/api/v1/investigations/{inv_id}/evidence")
    assert ev_res.status_code == 200
    assert len(ev_res.json()["data"]) > 0

def test_api_agents_fleet_with_live_stats():
    """GET /api/v1/agents returns enriched agent records with execution counts"""
    # Trigger an investigation to ensure live agent runs are registered
    client.post(f"/api/v1/ai/tickets/{TICKET_A_ID}/investigate?force_rerun=true")

    res = client.get("/api/v1/agents")
    assert res.status_code == 200
    body = res.json()
    agents = body["data"]
    assert len(agents) == 12

    # Verify at least one agent has execution counters
    active_runs = [a for a in agents if a["total_runs"] > 0]
    assert len(active_runs) > 0
    first_active = active_runs[0]
    assert "total_runs" in first_active
    assert "successful_runs" in first_active
    assert first_active["total_runs"] >= first_active["successful_runs"]
