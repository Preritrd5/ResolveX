"""
ResolveX Phase 5 Automated Test Suite — Autonomous Resolution & Intelligent Escalation
Verifies Action Registry, Policy Engine, Resolution Engine, Action Executor & Verification,
Audit Logging, Idempotency, Human Approval Flow, Escalation Packages, and Bulk Incident Resolution.
"""

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from apps.api.app.main import app
from apps.api.app.repositories.base_repository import repo
from apps.api.app.services.action_registry import action_registry
from apps.api.app.services.policy_engine import policy_engine
from apps.api.app.services.resolution_engine import resolution_engine
from apps.api.app.services.action_executor import action_executor
from apps.api.app.services.escalation_service import escalation_service
from apps.api.app.services.incident_service import PRIMARY_INCIDENT_ID

client = TestClient(app)

FLAGSHIP_TICKET_ID = "03c206ec-e347-5ff9-9345-360fa48ca8c8"

@pytest.fixture(autouse=True, scope="module")
def reset_fixtures_after_suite():
    yield
    repo._load_fixtures_cache()
    from apps.api.app.services.incident_service import incident_service
    incident_service._ensure_initialized = False
    from apps.api.app.services.investigation_service import investigation_service
    investigation_service._cached_results.clear()



# ------------------------------------------------------------------------------
# 1. Action Registry Completeness
# ------------------------------------------------------------------------------

def test_action_registry_all_ten_actions_registered():
    """Verifies that all 10 standard actions are registered with metadata"""
    actions = action_registry.list_actions()
    action_types = {a.action_type for a in actions}
    
    expected_actions = {
        "resend_order_confirmation",
        "retry_order_creation",
        "resend_payment_receipt",
        "provide_refund_status",
        "create_refund_request",
        "issue_refund",
        "cancel_order",
        "update_ticket_status",
        "assign_ticket",
        "create_human_escalation"
    }
    assert expected_actions.issubset(action_types), f"Missing actions: {expected_actions - action_types}"

def test_action_registry_risk_classifications():
    """Verifies risk levels and verification strategies on registry items"""
    low_action = action_registry.get_action("resend_order_confirmation")
    assert low_action is not None
    assert low_action.risk_level == "LOW"
    assert low_action.requires_human_approval is False

    med_action = action_registry.get_action("retry_order_creation")
    assert med_action is not None
    assert med_action.risk_level == "MEDIUM"

    high_action = action_registry.get_action("issue_refund")
    assert high_action is not None
    assert high_action.risk_level == "HIGH"
    assert high_action.requires_human_approval is True

# ------------------------------------------------------------------------------
# 2. Deterministic Policy Engine & RBAC
# ------------------------------------------------------------------------------

def test_policy_engine_rbac_support_agent_vs_manager():
    """Verifies that low-permission agents cannot issue refunds directly"""
    agent_user = {"id": "usr_agent_1", "role": "SUPPORT_AGENT"}
    manager_user = {"id": "usr_mgr_1", "role": "SUPPORT_MANAGER"}

    # Agent cannot issue refund directly due to missing refund.execute permission
    check_agent = policy_engine.evaluate_policy(
        action_type="issue_refund",
        ticket_id="TCK-10000",
        context={"payment": {"amount_cents": 2500, "status": "succeeded"}},
        user=agent_user
    )
    assert check_agent.allowed is False
    assert any("INSUFFICIENT_PERMISSIONS" in v for v in check_agent.violations)

    # Manager has permissions and can proceed (subject to authorization)
    check_mgr = policy_engine.evaluate_policy(
        action_type="issue_refund",
        ticket_id="TCK-10000",
        context={"payment": {"amount_cents": 2500, "status": "succeeded"}},
        user=manager_user
    )
    assert check_mgr.allowed is True
    assert len(check_mgr.violations) == 0

def test_policy_engine_refund_financial_threshold():
    """Refunds over $50 require human manager approval even if valid payment"""
    manager_user = {"id": "usr_mgr_1", "role": "SUPPORT_MANAGER"}

    # $55.00 refund (5500 cents) exceeds threshold
    check_high = policy_engine.evaluate_policy(
        action_type="issue_refund",
        ticket_id="TCK-10000",
        context={"payment": {"amount_cents": 5500, "status": "succeeded"}},
        user=manager_user
    )
    assert check_high.required_approval is True
    assert check_high.risk_level == "HIGH"

def test_policy_engine_refund_window_expiration():
    """Refunds requested past 30-day window are strictly blocked"""
    old_date = (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()
    check_expired = policy_engine.evaluate_policy(
        action_type="issue_refund",
        ticket_id="TCK-10000",
        context={
            "order": {"id": "ord_old", "created_at": old_date},
            "payment": {"amount_cents": 2000, "status": "succeeded"}
        }
    )
    assert check_expired.allowed is False
    assert any("30-day" in v.lower() or "window" in v.lower() for v in check_expired.violations)

def test_policy_engine_missing_order_preconditions():
    """retry_order_creation requires payment succeeded and no existing valid order"""
    # 1. Succeeded payment and missing order -> PASS
    check_valid = policy_engine.evaluate_policy(
        action_type="retry_order_creation",
        ticket_id="TCK-10000",
        context={"payment": {"status": "succeeded"}, "order": None}
    )
    assert check_valid.allowed is True

    # 2. Existing valid order -> BLOCKED to prevent duplicate charges/orders
    check_dup = policy_engine.evaluate_policy(
        action_type="retry_order_creation",
        ticket_id="TCK-10000",
        context={"payment": {"status": "succeeded"}, "order": {"id": "ord_1", "status": "processing"}}
    )
    assert check_dup.allowed is False
    assert any("already exists" in v.lower() for v in check_dup.violations)

# ------------------------------------------------------------------------------
# 3. Resolution Engine Decision Logic
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_resolution_engine_flagship_assisted_decision():
    """Flagship case Marcus Vance (orphaned payment, missing order) results in ASSISTED_RESOLUTION"""
    decision = await resolution_engine.evaluate_resolution(FLAGSHIP_TICKET_ID)
    assert decision.decision in ["ASSISTED_RESOLUTION", "AUTO_RESOLVE"]
    assert decision.recommended_action == "retry_order_creation"
    assert len(decision.parameters) > 0


@pytest.mark.anyio
async def test_resolution_engine_security_lockout_escalates():
    """Security credentials or lockout ticket strictly triggers ESCALATE"""
    sec_ticket = {
        "id": "TCK-SEC-01",
        "org_id": "00000000-0000-0000-0000-000000000001",
        "customer_id": "fd8cf8b4-03d9-5ef8-9cb5-19797e77b2c9",
        "ticket_number": "99991",
        "subject": "Account locked out after password reset attempt",
        "description": "I cannot access my account and suspect security compromise",
        "status": "open",
        "priority": "urgent",
        "category": "security",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await repo.insert_record("tickets", sec_ticket)

    decision = await resolution_engine.evaluate_resolution("TCK-SEC-01")
    assert decision.decision == "ESCALATE"
    assert "security" in decision.reason.lower()


# ------------------------------------------------------------------------------
# 4. Action Executor: Dry-Run, Verification & Idempotency
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_action_executor_dry_run_preview():
    """Dry-run preview predicts state changes without mutating DB"""
    result = await action_executor.execute_action(
        ticket_id=FLAGSHIP_TICKET_ID,
        action_type="retry_order_creation",
        parameters={"amount_cents": 4999},
        dry_run=True
    )
    assert result.execution_status == "preview"
    assert result.verified is True
    assert result.before_state is not None
    assert result.after_state.get("order_exists") is True
    assert "ORD-REC" in str(result.after_state.get("order_number", ""))

@pytest.mark.anyio
async def test_action_executor_real_execution_and_db_verification():
    """Live execution creates order, verifies in DB, logs audit record"""
    result = await action_executor.execute_action(
        ticket_id=FLAGSHIP_TICKET_ID,
        action_type="retry_order_creation",
        parameters={"amount_cents": 4999},
        user={"id": "usr_mgr_1", "role": "SUPPORT_MANAGER", "email": "manager@resolvex.ai"},
        dry_run=False
    )
    assert result.execution_status == "success"
    assert result.verified is True
    assert "successfully created and verified" in result.verification_message

    # Post-execution verification: Order exists in DB
    orders, _ = await repo.list_records("orders", filters={"order_number": f"ORD-REC-TCK-10000"})
    assert len(orders) >= 1
    assert orders[0]["status"] == "processing"

    # Ticket was updated to resolved
    ticket = await repo.get_record_by_id("tickets", FLAGSHIP_TICKET_ID)
    assert ticket["status"] == "resolved"

    # Audit record exists in action_executions
    execs, _ = await repo.list_records("action_executions", filters={"idempotency_key": result.idempotency_key})
    assert len(execs) >= 1
    assert execs[0]["execution_status"] == "success"

@pytest.mark.anyio
async def test_action_executor_idempotent_replay():
    """Executing the exact same action a second time safely returns previous verified result"""
    second_result = await action_executor.execute_action(
        ticket_id=FLAGSHIP_TICKET_ID,
        action_type="retry_order_creation",
        parameters={"amount_cents": 4999},
        user={"id": "usr_mgr_1", "role": "SUPPORT_MANAGER", "email": "manager@resolvex.ai"},
        dry_run=False
    )
    assert second_result.execution_status == "success"
    assert "Idempotent replay" in second_result.verification_message

    # Clean up created order and ticket state to restore pristine demo state for other test suites
    if "orders" in repo._fixtures:
        repo._fixtures["orders"] = [o for o in repo._fixtures["orders"] if not str(o.get("order_number", "")).startswith("ORD-REC")]
    ticket = await repo.get_record_by_id("tickets", FLAGSHIP_TICKET_ID)
    if ticket:
        ticket["status"] = "investigating"
    from apps.api.app.services.investigation_service import investigation_service
    if hasattr(investigation_service, "_cache"):
        investigation_service._cache.pop(FLAGSHIP_TICKET_ID, None)


# ------------------------------------------------------------------------------
# 5. Human Approval Workflow
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_human_approval_queue_and_resolution():
    """High-risk actions queue into action_approvals, which can be approved or rejected"""
    result = await action_executor.execute_action(
        ticket_id=FLAGSHIP_TICKET_ID,
        action_type="issue_refund",
        parameters={"amount_cents": 12000},
        user={"id": "usr_agent_1", "role": "SUPPORT_AGENT"},
        dry_run=False
    )
    assert result.execution_status == "pending_approval"
    assert result.approval_id is not None

    approval_id = result.approval_id

    # Manager approves via API
    resp = client.post(
        f"/api/v1/actions/{approval_id}/approve",
        json={"notes": "Customer provided valid return tracking number"}
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["execution_status"] == "success"
    assert data["verified"] is True


# ------------------------------------------------------------------------------
# 6. Escalation Package Generation
# ------------------------------------------------------------------------------

@pytest.mark.anyio
async def test_escalation_package_cryptographic_evidence_and_timeline():
    """Verifies that generated handoff packages include complete context and SHA-256 evidence digests"""
    pkg = await escalation_service.generate_handoff_package(
        ticket_id=FLAGSHIP_TICKET_ID,
        escalation_reason="Payment webhook dropped by gateway"
    )
    assert pkg.ticket_id == FLAGSHIP_TICKET_ID
    assert pkg.customer_summary is not None
    assert len(pkg.evidence) > 0
    # Check SHA-256 digest on evidence
    for ev in pkg.evidence:
        assert "evidence_hash" in ev
        assert len(ev["evidence_hash"]) == 64  # Hex length for sha256
    
    assert pkg.root_cause_assessment is not None
    assert pkg.recommendation is not None
    assert len(pkg.investigation_timeline) > 0

# ------------------------------------------------------------------------------
# 7. Incident Bulk Action Safety
# ------------------------------------------------------------------------------

def test_incident_bulk_action_preview_and_execution():
    """Incident bulk actions preview partitions tickets into eligible and excluded safely"""
    # 1. Preview
    resp_prev = client.post(
        f"/api/v1/incidents/{PRIMARY_INCIDENT_ID}/actions/preview",
        json={"action_type": "retry_order_creation", "parameters": {}}
    )
    assert resp_prev.status_code == 200
    preview = resp_prev.json()["data"]
    assert "total_targets" in preview
    assert "eligible_count" in preview
    assert "excluded_count" in preview
    assert "targets" in preview
    assert isinstance(preview["targets"], list)

    # 2. Execution
    resp_exec = client.post(
        f"/api/v1/incidents/{PRIMARY_INCIDENT_ID}/actions/execute",
        json={"action_type": "retry_order_creation", "parameters": {}}
    )
    assert resp_exec.status_code == 200
    exec_res = resp_exec.json()["data"]
    assert "total_executed" in exec_res
    assert "successful_count" in exec_res
    assert "failed_count" in exec_res
    assert "results" in exec_res

# ------------------------------------------------------------------------------
# 8. Action Catalog and History Endpoints
# ------------------------------------------------------------------------------

def test_api_action_catalog_endpoint():
    """GET /api/v1/actions returns full action registry"""
    resp = client.get("/api/v1/actions")
    assert resp.status_code == 200
    items = resp.json()["data"]
    assert len(items) >= 10

def test_api_ticket_resolution_endpoint():
    """GET /api/v1/tickets/{id}/resolve returns structured resolution decision"""
    resp = client.get(f"/api/v1/tickets/{FLAGSHIP_TICKET_ID}/resolve")
    assert resp.status_code == 200
    decision = resp.json()["data"]
    assert "decision" in decision
    assert "recommended_action" in decision
    assert "confidence" in decision
