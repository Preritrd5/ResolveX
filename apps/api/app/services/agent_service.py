"""
ResolveX Agent Fleet Governance & Analytics Service
Tracks live agent execution statistics, performance metrics, and audit histories.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import AgentWithStatsSchema, AgentRunSchema
from apps.api.app.core.logging import logger

class AgentService:
    """
    Manages the AI Agent Registry, execution logs, and run telemetry.
    """

    async def list_agents_with_stats(self) -> List[AgentWithStatsSchema]:
        """
        Retrieves all registered agents decorated with real run counters and latest execution record.
        """
        raw_agents, _ = await repo.list_records("agents", limit=50)
        enriched: List[AgentWithStatsSchema] = []

        for ag in raw_agents:
            agent_id = str(ag.get("id"))
            
            # Query real agent runs from database
            runs_by_id, _ = await repo.list_records("agent_runs", filters={"agent_id": agent_id}, limit=20)
            runs_by_name, _ = await repo.list_records("agent_runs", filters={"agent_name": ag.get("name")}, limit=20)
            
            seen_run_ids = set()
            runs = []
            for r in runs_by_id + runs_by_name:
                rid = str(r.get("id"))
                if rid not in seen_run_ids:
                    seen_run_ids.add(rid)
                    runs.append(r)

            total_runs = max(ag.get("total_runs", 0), len(runs))
            successful_runs = max(ag.get("successful_runs", 0), len([r for r in runs if r.get("status") == "completed"]))
            failed_runs = max(ag.get("failed_runs", 0), len([r for r in runs if r.get("status") == "failed"]))
            last_run_at = ag.get("last_run_at")

            latest_run = None
            if runs:
                # Sort by started_at or created_at desc
                sorted_runs = sorted(runs, key=lambda x: x.get("started_at") or x.get("created_at") or "", reverse=True)
                latest_raw = sorted_runs[0]
                if not last_run_at:
                    last_run_at = latest_raw.get("started_at") or latest_raw.get("created_at")

                latest_run = AgentRunSchema(
                    id=str(latest_raw.get("id")),
                    investigation_id=str(latest_raw.get("investigation_id")),
                    agent_id=agent_id,
                    agent_name=ag.get("name"),
                    input_state_hash=latest_raw.get("input_state_hash", ""),
                    tokens_used=latest_raw.get("tokens_used", 0),
                    duration_ms=latest_raw.get("duration_ms"),
                    status=latest_raw.get("status", "completed"),
                    confidence=latest_raw.get("confidence"),
                    finding_summary=latest_raw.get("finding_summary"),
                    evidence_ids=latest_raw.get("evidence_ids", []),
                    error=latest_raw.get("error"),
                    started_at=latest_raw.get("started_at"),
                    completed_at=latest_raw.get("completed_at"),
                    created_at=latest_raw.get("created_at")
                )

            enriched.append(
                AgentWithStatsSchema(
                    id=agent_id,
                    name=ag.get("name", "Unknown Agent"),
                    role_description=ag.get("role_description", ""),
                    model_name=ag.get("model_name", "gemini-2.0-flash"),
                    is_active=ag.get("is_active", True),
                    total_runs=total_runs,
                    successful_runs=successful_runs,
                    failed_runs=failed_runs,
                    last_run_at=last_run_at,
                    latest_run=latest_run
                )
            )

        return enriched

    async def update_agent_execution_stats(self, agent_id: str, success: bool):
        """
        Increments runtime counters for a specific agent after execution.
        """
        agent = await repo.get_record_by_id("agents", agent_id)
        if not agent:
            return

        now_iso = datetime.now(timezone.utc).isoformat()
        total = agent.get("total_runs", 0) + 1
        success_count = agent.get("successful_runs", 0) + (1 if success else 0)
        failed_count = agent.get("failed_runs", 0) + (0 if success else 1)

        await repo.update_record("agents", agent_id, {
            "total_runs": total,
            "successful_runs": success_count,
            "failed_runs": failed_count,
            "last_run_at": now_iso
        })

agent_service = AgentService()
