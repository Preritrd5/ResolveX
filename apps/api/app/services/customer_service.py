"""
ResolveX Customer Domain Service
Encapsulates Customer 360 logic and relationship assembly
"""

from typing import Dict, List, Any, Optional, Tuple
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.schemas import CustomerSchema, CustomerDetailSchema, CustomerProfileSchema

class CustomerService:
    async def list_customers(
        self,
        query: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[CustomerSchema], int]:
        filters = {"status": status} if status else {}
        records, total = await repo.list_records(
            table_name="customers",
            filters=filters,
            search_query=query,
            search_fields=["full_name", "email", "external_customer_id"],
            page=page,
            limit=limit
        )
        return [CustomerSchema.model_validate(r) for r in records], total

    async def get_customer_detail(self, customer_id: str) -> Optional[CustomerDetailSchema]:
        cust = await repo.get_record_by_id("customers", customer_id)
        if not cust:
            return None

        # Fetch profile
        profiles, _ = await repo.list_records("customer_profiles", filters={"customer_id": customer_id}, limit=1)
        profile_schema = CustomerProfileSchema.model_validate(profiles[0]) if profiles else None

        # Fetch recent tickets
        tickets, _ = await repo.list_records("tickets", filters={"customer_id": customer_id}, limit=10)

        # Fetch recent orders
        orders, _ = await repo.list_records("orders", filters={"customer_id": customer_id}, limit=10)

        # Fetch recent payments
        payments, _ = await repo.list_records("payments", filters={"customer_id": customer_id}, limit=10)

        detail = CustomerDetailSchema(
            **cust,
            profile=profile_schema,
            recent_tickets=tickets,
            recent_orders=orders,
            recent_payments=payments
        )
        return detail

customer_service = CustomerService()
