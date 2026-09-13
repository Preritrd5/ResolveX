"""
ResolveX Ticket Domain Service
Encapsulates case retrieval, filtering, and detail context enrichment
"""

from typing import Dict, List, Any, Optional, Tuple
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import (
    TicketSchema,
    TicketDetailSchema,
    TicketMessageSchema,
    CustomerSchema,
    CustomerProfileSchema,
    OrderSchema,
    PaymentSchema
)

class TicketService:
    async def list_tickets(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        category: Optional[str] = None,
        intent: Optional[str] = None,
        customer_id: Optional[str] = None,
        ai_resolvable: Optional[bool] = None,
        team: Optional[str] = None,
        query: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[TicketSchema], int]:
        filters: Dict[str, Any] = {}
        if status:
            filters["status"] = status
        if priority:
            filters["priority"] = priority
        if category:
            filters["intent_category"] = category
        if intent:
            filters["intent_category"] = intent
        if customer_id:
            filters["customer_id"] = customer_id
        if ai_resolvable is not None:
            filters["ai_resolvable"] = ai_resolvable
        if team:
            filters["recommended_team"] = team

        records, total = await repo.list_records(
            table_name="tickets",
            filters=filters,
            search_query=query,
            search_fields=["ticket_number", "subject"],
            page=page,
            limit=limit
        )

        results = []
        for r in records:
            # Enrich with customer name if missing
            item = dict(r)
            if not item.get("customer_name") and item.get("customer_id"):
                cust = await repo.get_record_by_id("customers", item["customer_id"])
                if cust:
                    item["customer_name"] = cust.get("full_name")
                    item["customer_email"] = cust.get("email")
            results.append(TicketSchema.model_validate(item))

        return results, total

    async def get_ticket_detail(self, ticket_id: str) -> Optional[TicketDetailSchema]:
        record = await repo.get_record_by_id("tickets", ticket_id)
        if not record:
            return None

        ticket_data = dict(record)

        # 1. Fetch messages
        msgs, _ = await repo.list_records("ticket_messages", filters={"ticket_id": ticket_id}, limit=50)
        messages = [TicketMessageSchema.model_validate(m) for m in msgs]

        # 2. Fetch Customer & Profile
        customer_schema = None
        profile_schema = None
        if ticket_data.get("customer_id"):
            cust = await repo.get_record_by_id("customers", ticket_data["customer_id"])
            if cust:
                customer_schema = CustomerSchema.model_validate(cust)
                ticket_data["customer_name"] = cust.get("full_name")
                ticket_data["customer_email"] = cust.get("email")

                profiles, _ = await repo.list_records("customer_profiles", filters={"customer_id": cust["id"]}, limit=1)
                if profiles:
                    profile_schema = CustomerProfileSchema.model_validate(profiles[0])

        # 3. Fetch linked payment (if any)
        linked_payment = None
        if ticket_data.get("customer_id"):
            payments, _ = await repo.list_records("payments", filters={"customer_id": ticket_data["customer_id"]}, limit=1)
            if payments:
                linked_payment = PaymentSchema.model_validate(payments[0])

        # 4. Fetch linked order (if any)
        linked_order = None
        if ticket_data.get("customer_id"):
            orders, _ = await repo.list_records("orders", filters={"customer_id": ticket_data["customer_id"]}, limit=1)
            if orders:
                linked_order = OrderSchema.model_validate(orders[0])

        return TicketDetailSchema(
            **ticket_data,
            messages=messages,
            customer=customer_schema,
            customer_profile=profile_schema,
            linked_order=linked_order,
            linked_payment=linked_payment
        )

ticket_service = TicketService()
