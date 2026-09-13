"""
ResolveX Global Search Service
Lightweight, organization-scoped search across customers, tickets, incidents, orders, and payments
"""

from typing import Dict, Any, List, Optional
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import GlobalSearchResultSchema

class SearchService:
    async def global_search(self, query: str, limit_per_entity: int = 5) -> GlobalSearchResultSchema:
        q = (query or "").strip().lower()
        if not q:
            return GlobalSearchResultSchema(
                query="",
                total_results=0,
                customers=[],
                tickets=[],
                incidents=[],
                orders=[],
                payments=[]
            )

        # 1. Search Customers
        all_customers, _ = await repo.list_records("customers", limit=500)
        matching_customers = []
        for c in all_customers:
            name = str(c.get("full_name") or "").lower()
            email = str(c.get("email") or "").lower()
            ext_id = str(c.get("external_customer_id") or "").lower()
            if q in name or q in email or q in ext_id:
                matching_customers.append({
                    "id": c.get("id"),
                    "full_name": c.get("full_name"),
                    "email": c.get("email"),
                    "loyalty_tier": c.get("profile", {}).get("loyalty_tier", "standard") if isinstance(c.get("profile"), dict) else "standard",
                    "url": f"/customers/{c.get('id')}"
                })
                if len(matching_customers) >= limit_per_entity:
                    break

        # 2. Search Tickets
        all_tickets, _ = await repo.list_records("tickets", limit=500)
        matching_tickets = []
        for t in all_tickets:
            t_num = str(t.get("ticket_number") or "").lower()
            subj = str(t.get("subject") or "").lower()
            desc = str(t.get("description") or "").lower()
            if q in t_num or q in subj or q in desc:
                matching_tickets.append({
                    "id": t.get("id"),
                    "ticket_number": t.get("ticket_number"),
                    "subject": t.get("subject"),
                    "status": t.get("status"),
                    "priority": t.get("priority"),
                    "url": f"/cases/{t.get('id')}"
                })
                if len(matching_tickets) >= limit_per_entity:
                    break

        # 3. Search Incidents
        from apps.api.app.services.incident_service import incident_service
        all_incidents, _ = await incident_service.list_incidents()
        matching_incidents = []
        for inc in all_incidents:
            i_id = getattr(inc, "id", None) if hasattr(inc, "id") else inc.get("id")
            i_num = getattr(inc, "incident_number", "") if hasattr(inc, "incident_number") else inc.get("incident_number", "")
            title = getattr(inc, "title", "") if hasattr(inc, "title") else inc.get("title", "")
            sev = getattr(inc, "severity", "") if hasattr(inc, "severity") else inc.get("severity", "")
            st = getattr(inc, "status", "") if hasattr(inc, "status") else inc.get("status", "")

            if q in str(i_num).lower() or q in str(title).lower():
                matching_incidents.append({
                    "id": i_id,
                    "incident_number": i_num,
                    "title": title,
                    "severity": sev,
                    "status": st,
                    "url": f"/incidents/{i_id}"
                })
                if len(matching_incidents) >= limit_per_entity:
                    break

        # 4. Search Orders
        all_orders, _ = await repo.list_records("orders", limit=500)
        matching_orders = []
        for o in all_orders:
            o_num = str(o.get("order_number") or "").lower()
            if q in o_num:
                matching_orders.append({
                    "id": o.get("id"),
                    "order_number": o.get("order_number"),
                    "status": o.get("status"),
                    "total_amount_cents": o.get("total_amount_cents", 0),
                    "customer_id": o.get("customer_id"),
                    "url": f"/customers/{o.get('customer_id')}" if o.get("customer_id") else "/customers"
                })
                if len(matching_orders) >= limit_per_entity:
                    break

        # 5. Search Payments
        all_payments, _ = await repo.list_records("payments", limit=500)
        matching_payments = []
        for p in all_payments:
            txn_id = str(p.get("gateway_transaction_id") or "").lower()
            gw = str(p.get("gateway_name") or "").lower()
            if q in txn_id or q in gw:
                matching_payments.append({
                    "id": p.get("id"),
                    "gateway_transaction_id": p.get("gateway_transaction_id"),
                    "gateway_name": p.get("gateway_name"),
                    "amount_cents": p.get("amount_cents", 0),
                    "status": p.get("status"),
                    "customer_id": p.get("customer_id"),
                    "url": f"/customers/{p.get('customer_id')}" if p.get("customer_id") else "/customers"
                })
                if len(matching_payments) >= limit_per_entity:
                    break

        total_matches = (
            len(matching_customers)
            + len(matching_tickets)
            + len(matching_incidents)
            + len(matching_orders)
            + len(matching_payments)
        )

        return GlobalSearchResultSchema(
            query=query,
            total_results=total_matches,
            customers=matching_customers,
            tickets=matching_tickets,
            incidents=matching_incidents,
            orders=matching_orders,
            payments=matching_payments
        )

search_service = SearchService()
