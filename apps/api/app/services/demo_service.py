"""
ResolveX Demo Management & Safe Reset Service
"""

from datetime import datetime, timezone
from typing import Dict, Any
from pathlib import Path
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import DemoResetResponseSchema, DemoStatusSchema
from apps.api.app.services.incident_service import PRIMARY_INCIDENT_ID, PRIMARY_INCIDENT_NUMBER

class DemoService:
    async def get_demo_status(self) -> DemoStatusSchema:
        # Check flagship case
        tickets, _ = await repo.list_records("tickets", limit=10)
        flagship_ticket = next((t for t in tickets if t.get("ticket_number") == "TCK-1001"), None)
        case_id = flagship_ticket["id"] if flagship_ticket else "case-1001"
        case_number = flagship_ticket["ticket_number"] if flagship_ticket else "TCK-1001"

        return DemoStatusSchema(
            demo_mode=True,
            organization_id="org_acme_commerce",
            organization_name="Acme Commerce",
            seed=42,
            flagship_incident_id=PRIMARY_INCIDENT_ID,
            flagship_incident_number=PRIMARY_INCIDENT_NUMBER,
            flagship_case_id=case_id,
            flagship_case_number=case_number,
            flagship_customer_name="Marcus Vance",
            recommended_flow=[
                {"step": "1", "title": "Command Center Overview", "route": "/overview", "cue": "Start at the executive pulse. Notice emerging webhook failure alarms."},
                {"step": "2", "title": "Customer Tickets Queue", "route": "/cases", "cue": "These look like isolated customer complaints across orders and billing."},
                {"step": "3", "title": "Incident Intelligence", "route": f"/incidents/{PRIMARY_INCIDENT_ID}", "cue": "ResolveX correlates language, timing, transactions into ONE systemic incident."},
                {"step": "4", "title": "Root Cause & Blast Radius", "route": f"/incidents/{PRIMARY_INCIDENT_ID}", "cue": "Inspect the multi-agent root cause graph and affected customer blast radius."},
                {"step": "5", "title": "Predictive Blast Radius", "route": f"/incidents/{PRIMARY_INCIDENT_ID}/impact", "cue": "Uncover silent victims who haven't complained yet based on payment ledgers."},
                {"step": "6", "title": "Autonomous Safe Resolution", "route": f"/cases/{case_id}", "cue": "Deterministic policy gates execute verified mutations for safe cases."},
                {"step": "7", "title": "Proactive Outreach Queue", "route": "/proactive", "cue": "Policy-gated, deduplicated customer communications before ticket surge."},
                {"step": "8", "title": "Executive CX Analytics", "route": "/analytics", "cue": "Quantifiable customer experience impact, resolution trends, and operational savings."},
            ]
        )

    async def reset_demo_data(self, seed: int = 42, requested_by: str = "operator_maya_patel") -> DemoResetResponseSchema:
        from data.seed.generate_demo_data import generate_all_data
        from data.seed.generate_sql_seed import generate_sql
        
        # 1. Regenerate deterministic JSON fixtures and SQL files
        generate_all_data()
        generate_sql()

        # 2. Reload base repository in-memory cache
        repo._load_fixtures_cache()

        # 3. Log audit record of reset
        reset_time = datetime.now(timezone.utc).isoformat()
        records_restored = {
            "customers": len(repo._fixtures.get("customers", [])),
            "tickets": len(repo._fixtures.get("tickets", [])),
            "orders": len(repo._fixtures.get("orders", [])),
            "payments": len(repo._fixtures.get("payments", [])),
            "service_events": len(repo._fixtures.get("service_events", [])),
            "incidents": len(repo._fixtures.get("incidents", [])),
        }

        # Add audit execution record
        await repo.create_record("action_executions", {
            "action_type": "reset_demo_environment",
            "actor_id": requested_by,
            "target_id": "org_acme_commerce",
            "execution_status": "success",
            "input_payload": {"seed": seed},
            "output_payload": {"records_restored": records_restored},
            "created_at": reset_time,
        })

        return DemoResetResponseSchema(
            success=True,
            message="ResolveX Acme Commerce demonstration environment successfully reset to deterministic baseline.",
            seed=seed,
            reset_at=reset_time,
            records_restored=records_restored
        )

demo_service = DemoService()
