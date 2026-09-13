"""
ResolveX Analytics Domain Service
Calculates real-time operational aggregates from active database records
"""

from typing import Dict, Any
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import OverviewMetricsSchema, TicketSchema, EscalationSchema

class AnalyticsService:
    async def get_overview_metrics(self) -> OverviewMetricsSchema:
        # 1. Total Customers
        _, total_customers = await repo.list_records("customers", limit=1)

        # 2. Tickets counts by status
        _, open_cases = await repo.list_records("tickets", filters={"status": "open"}, limit=1)
        _, investigating_cases = await repo.list_records("tickets", filters={"status": "investigating"}, limit=1)
        _, waiting_cases = await repo.list_records("tickets", filters={"status": "waiting_customer"}, limit=1)
        pending_resolution = open_cases + investigating_cases + waiting_cases

        # 3. Active Escalations
        _, active_escalations = await repo.list_records("escalations", filters={"status": "pending"}, limit=1)

        # 4. Total Orders & Revenue
        orders, total_orders = await repo.list_records("orders", limit=1000)
        total_revenue_cents = sum(o.get("total_amount_cents", 0) for o in orders)

        # 5. Service Event Health (System Status)
        crit_events, _ = await repo.list_records("service_events", filters={"severity": "critical"}, limit=1)
        system_status = "Degraded (Active Service Errors)" if crit_events else "Operational"

        # 6. Recent Tickets
        recent_tickets_raw, _ = await repo.list_records("tickets", limit=5)
        recent_tickets = []
        for r in recent_tickets_raw:
            item = dict(r)
            if item.get("customer_id"):
                cust = await repo.get_record_by_id("customers", item["customer_id"])
                if cust:
                    item["customer_name"] = cust.get("full_name")
            recent_tickets.append(TicketSchema.model_validate(item))

        # 7. Recent Escalations
        recent_esc_raw, _ = await repo.list_records("escalations", limit=5)
        recent_escalations = []
        for e in recent_esc_raw:
            item = dict(e)
            if item.get("ticket_id"):
                t = await repo.get_record_by_id("tickets", item["ticket_id"])
                if t:
                    item["ticket_number"] = t.get("ticket_number")
                    if t.get("customer_id"):
                        cust = await repo.get_record_by_id("customers", t["customer_id"])
                        if cust:
                            item["customer_name"] = cust.get("full_name")
            recent_escalations.append(EscalationSchema.model_validate(item))

        return OverviewMetricsSchema(
            total_customers=total_customers,
            open_cases=open_cases,
            investigating_cases=investigating_cases,
            pending_resolution=pending_resolution,
            active_escalations=active_escalations,
            total_orders=total_orders,
            total_revenue_cents=total_revenue_cents,
            system_status=system_status,
            active_critical_incidents=1 if crit_events else 0,
            recent_tickets=recent_tickets,
            recent_escalations=recent_escalations
        )

analytics_service = AnalyticsService()
