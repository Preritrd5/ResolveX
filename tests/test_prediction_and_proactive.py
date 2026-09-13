"""
ResolveX Phase 6: Predictive & Proactive Customer Intelligence Test Suite
Validates affected customer prediction, evidence corroboration, operational anomaly detection,
impact trend forecasting, communication policy safety, and notification deduplication.
"""

import pytest
from datetime import datetime, timezone

from apps.api.app.services.prediction_engine import prediction_engine
from apps.api.app.services.anomaly_engine import anomaly_engine
from apps.api.app.services.impact_analytics_service import impact_analytics_service
from apps.api.app.services.proactive_service import proactive_service
from apps.api.app.services.prediction_feedback_service import prediction_feedback_service
from apps.api.app.services.incident_service import PRIMARY_INCIDENT_ID, SECONDARY_INCIDENT_ID
from apps.api.app.repositories.base_repository import repo
from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)

@pytest.fixture(autouse=True, scope="module")
def reset_state():
    """Teardown and reload fixtures cache between test suites"""
    yield
    repo._load_fixtures_cache()
    proactive_service._recommendations.clear()
    proactive_service._sent_notification_index.clear()
    proactive_service._initialized = False
    prediction_engine._prediction_cache.clear()

# ------------------------------------------------------------------------------
# 1. Affected Customer Prediction & Evidence Classification
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_affected_customer_prediction_identifies_unreported_candidates():
    """Verifies that customers with captured payments and missing orders who have NOT filed tickets are classified LIKELY_AFFECTED"""
    predictions = await prediction_engine.predict_affected_customers(PRIMARY_INCIDENT_ID)
    assert len(predictions) > 0

    likely = [p for p in predictions if p.classification == "LIKELY_AFFECTED"]
    assert len(likely) >= 1, "Expected at least one unreported customer to be predicted as LIKELY_AFFECTED"

    candidate = likely[0]
    assert candidate.evidence_confidence >= 0.70
    assert "Payment captured" in candidate.reason or "missing" in candidate.reason
    assert any(ev.signal_name == "captured_payment_unlinked" and ev.matched for ev in candidate.evidence)
    assert any(ev.signal_name == "customer_ticket_reported" and not ev.matched for ev in candidate.evidence)

@pytest.mark.anyio
async def test_reported_incident_ticket_classified_confirmed_affected():
    """Verifies that customers with linked tickets, captured payments, and missing orders are classified CONFIRMED_AFFECTED"""
    predictions = await prediction_engine.predict_affected_customers(PRIMARY_INCIDENT_ID)
    confirmed = [p for p in predictions if p.classification == "CONFIRMED_AFFECTED"]
    assert len(confirmed) >= 1, "Expected at least one reported customer to be classified as CONFIRMED_AFFECTED"

    # Marcus Vance (TCK-10000) or Elena Rostova
    cand = confirmed[0]
    assert cand.evidence_confidence >= 0.90
    assert cand.risk_level in ["CRITICAL", "HIGH"]
    assert any(ev.signal_name == "customer_ticket_reported" and ev.matched for ev in cand.evidence)
    assert any(ev.signal_name == "order_record_missing" and ev.matched for ev in cand.evidence)

@pytest.mark.anyio
async def test_customer_risk_endpoint_distinguishes_observed_from_predicted():
    """Verifies GET /customers/{id}/risk returns observed facts and explainable predictions"""
    predictions = await prediction_engine.predict_affected_customers(PRIMARY_INCIDENT_ID)
    test_cust = predictions[0]

    res = client.get(f"/api/v1/customers/{test_cust.customer_id}/risk")
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["customer_id"] == test_cust.customer_id
    assert data["classification"] in ["CONFIRMED_AFFECTED", "LIKELY_AFFECTED"]
    assert len(data["observed_facts"]) > 0
    assert len(data["predicted_impact"]) > 0
    assert data["linked_incident"]["id"] == PRIMARY_INCIDENT_ID

# ------------------------------------------------------------------------------
# 2. Operational Anomaly & Emerging Issue Detection
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_emerging_issues_anomaly_detection_scan():
    """Verifies anomaly engine calculates baseline vs current rate and emits EarlyWarning"""
    warnings = await anomaly_engine.detect_emerging_issues()
    assert len(warnings) >= 1

    webhook_warning = next((w for w in warnings if w.affected_service == "payment-webhook-worker"), None)
    assert webhook_warning is not None
    assert webhook_warning.current_rate > webhook_warning.baseline_rate
    assert webhook_warning.change_percentage > 100.0  # e.g., 600% increase
    assert webhook_warning.anomaly_score > 3.0
    assert webhook_warning.confidence == "HIGH"

@pytest.mark.anyio
async def test_early_warning_investigate_links_to_incident():
    """Verifies that investigating an early warning with high anomaly score links it to an incident"""
    success, msg, payload = await anomaly_engine.investigate_early_warning("warn-ew-001")
    assert success is True
    assert payload["status"] == "LINKED_TO_INCIDENT"
    assert payload["linked_incident_id"] == PRIMARY_INCIDENT_ID

# ------------------------------------------------------------------------------
# 3. Impact Trend & Near-term Forecasting
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_impact_trend_time_series_chronological():
    """Verifies chronological impact progression curve"""
    trend = await impact_analytics_service.get_incident_impact_trend(PRIMARY_INCIDENT_ID)
    assert len(trend) >= 3
    assert trend[0].affected_customers <= trend[-1].affected_customers

@pytest.mark.anyio
async def test_impact_forecast_labeled_estimate_and_insufficient_data_guard():
    """Verifies near-term projection includes assumptions and guards against sparse data"""
    forecast = await impact_analytics_service.get_impact_forecast(PRIMARY_INCIDENT_ID)
    assert forecast.has_sufficient_data is True
    assert forecast.estimated_near_term_low is not None
    assert forecast.estimated_near_term_high is not None
    assert forecast.estimated_near_term_low <= forecast.estimated_near_term_high
    assert len(forecast.assumptions) > 0

    # Non-existent or empty incident candidate -> returns insufficient data flag
    sparse_forecast = await impact_analytics_service.get_impact_forecast("non_existent_inc")
    assert sparse_forecast.has_sufficient_data is False
    assert "Insufficient historical data" in (sparse_forecast.notice or "")

@pytest.mark.anyio
async def test_support_load_estimate_calculates_projected_tickets():
    """Verifies incoming customer ticket volume projection over the next hour"""
    load = await impact_analytics_service.get_support_load_estimate(PRIMARY_INCIDENT_ID)
    assert load.has_sufficient_data is True
    assert load.current_ticket_rate_per_hour > load.baseline_ticket_rate_per_hour
    assert load.projected_tickets_next_hour is not None
    assert load.projected_tickets_next_hour >= int(load.current_ticket_rate_per_hour)

# ------------------------------------------------------------------------------
# 4. Proactive Support, Communication Policy & Deduplication
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_proactive_recommendation_generation():
    """Verifies proactive recommendations are drafted for predicted affected customers"""
    recs = await proactive_service.get_recommendations_for_incident(PRIMARY_INCIDENT_ID)
    assert len(recs) > 0
    rec = recs[0]
    assert rec.status == "DRAFTED"
    assert rec.action_type == "send_proactive_status_notification"
    assert "payment was received" in (rec.suggested_message or "").lower()

def test_communication_policy_enforcement():
    """Verifies communication policy enforces deduplication, confidence thresholds, and risk gates"""
    # 1. High risk requires approval
    status, reason = proactive_service.evaluate_communication_policy(
        incident_id=PRIMARY_INCIDENT_ID,
        classification="LIKELY_AFFECTED",
        confidence=0.91,
        risk_level="CRITICAL",
        dedup_key=("inc_1", "cust_1", "notif_type")
    )
    assert status == "REQUIRE_APPROVAL"

    # 2. Low confidence is blocked
    status, reason = proactive_service.evaluate_communication_policy(
        incident_id=PRIMARY_INCIDENT_ID,
        classification="LIKELY_AFFECTED",
        confidence=0.55,
        risk_level="LOW",
        dedup_key=("inc_1", "cust_2", "notif_type")
    )
    assert status == "BLOCK"
    assert "below" in reason

    # 3. Non-affected customer is blocked
    status, reason = proactive_service.evaluate_communication_policy(
        incident_id=PRIMARY_INCIDENT_ID,
        classification="NOT_AFFECTED",
        confidence=0.90,
        risk_level="LOW",
        dedup_key=("inc_1", "cust_3", "notif_type")
    )
    assert status == "BLOCK"

@pytest.mark.anyio
async def test_notification_deduplication_prevents_duplicate_send():
    """Verifies that sending an identical notification to the same customer is blocked"""
    recs = await proactive_service.get_recommendations_for_incident(PRIMARY_INCIDENT_ID)
    rec = next(r for r in recs if r.policy_status in ["ALLOW", "REQUIRE_APPROVAL"])

    # If requires approval, approve it first
    if rec.policy_status == "REQUIRE_APPROVAL":
        await proactive_service.approve_recommendation(rec.id)

    # First send should succeed
    success, msg, receipt = await proactive_service.send_proactive_notification(rec.id)
    assert success is True
    assert receipt["status"] == "SENT"

    # Second send with same recommendation should be blocked
    success_dup, msg_dup, _ = await proactive_service.send_proactive_notification(rec.id)
    assert success_dup is False
    assert "Duplicate" in msg_dup

# ------------------------------------------------------------------------------
# 5. Prediction Feedback & Model Versioning
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_prediction_feedback_metrics_avoids_fake_accuracy():
    """Verifies system explicitly returns insufficient evaluated outcomes message when ground truth is absent"""
    metrics = await prediction_feedback_service.get_prediction_metrics()
    assert metrics.predictions_generated > 0
    # Before ground truth is recorded:
    assert metrics.evaluated_predictions == 0
    assert metrics.precision is None
    assert "Not enough evaluated outcomes" in metrics.status_message

    # Record real outcome and re-verify
    prediction_feedback_service.record_outcome("pred-test-1", "AFFECTED", "AFFECTED")
    metrics_with_outcome = await prediction_feedback_service.get_prediction_metrics()
    assert metrics_with_outcome.evaluated_predictions == 1
    assert metrics_with_outcome.precision == 1.0

# ------------------------------------------------------------------------------
# 6. REST API Endpoints
# ------------------------------------------------------------------------------

def test_api_incident_predictions():
    """Verifies GET /api/v1/incidents/{id}/predictions endpoint"""
    res = client.get(f"/api/v1/incidents/{PRIMARY_INCIDENT_ID}/predictions")
    assert res.status_code == 200
    data = res.json()["data"]
    assert isinstance(data, list)
    assert len(data) > 0

def test_api_incident_impact_overview():
    """Verifies GET /api/v1/incidents/{id}/impact endpoint"""
    res = client.get(f"/api/v1/incidents/{PRIMARY_INCIDENT_ID}/impact")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["incident_id"] == PRIMARY_INCIDENT_ID
    assert "confirmed_affected_count" in data
    assert "likely_affected_count" in data
    assert "forecast" in data
    assert "trend" in data

def test_api_early_warnings():
    """Verifies GET /api/v1/early-warnings and POST /api/v1/incidents/detect-emerging"""
    res = client.get("/api/v1/early-warnings")
    assert res.status_code == 200
    assert isinstance(res.json()["data"], list)

    scan_res = client.post("/api/v1/incidents/detect-emerging")
    assert scan_res.status_code == 200
    assert scan_res.json()["meta"]["scanned"] is True

def test_api_proactive_queue():
    """Verifies GET /api/v1/proactive endpoint"""
    res = client.get("/api/v1/proactive")
    assert res.status_code == 200
    assert isinstance(res.json()["data"], list)
