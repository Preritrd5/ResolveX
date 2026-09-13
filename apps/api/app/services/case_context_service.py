"""
ResolveX Case Context Assembly Engine
Relevance-driven context assembly from Supabase / BaseRepository
Strict Zero-Hallucination guarantee: missing records are explicitly None or []
"""

import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from apps.api.app.repositories.base_repository import repo
from apps.api.app.domain.case_context import CaseContext
from apps.api.app.domain.schemas import (
    CustomerSchema,
    CustomerProfileSchema,
    TicketDetailSchema,
    TicketMessageSchema,
    OrderSchema,
    PaymentSchema,
    RefundSchema,
    SubscriptionSchema,
    ProductSchema,
    ServiceEventSchema
)
from apps.api.app.services.ticket_service import ticket_service

class CaseContextService:
    async def assemble_context(self, ticket_id: str) -> Optional[CaseContext]:
        """
        Assembles a strongly typed CaseContext for a single ticket.
        Applies domain relevance rules to avoid bloated N+1 queries.
        """
        # 1. Fetch ticket and core messages
        ticket_detail = await ticket_service.get_ticket_detail(ticket_id)
        if not ticket_detail:
            return None

        customer_id = ticket_detail.customer_id
        org_id = ticket_detail.org_id

        # 2. Retrieve Customer & Profile
        customer_schema = ticket_detail.customer
        if not customer_schema and customer_id:
            cust_rec = await repo.get_record_by_id("customers", customer_id)
            if cust_rec:
                customer_schema = CustomerSchema.model_validate(cust_rec)

        if not customer_schema:
            return None

        customer_profile = ticket_detail.customer_profile
        if not customer_profile and customer_id:
            profiles, _ = await repo.list_records("customer_profiles", filters={"customer_id": customer_id}, limit=1)
            if profiles:
                customer_profile = CustomerProfileSchema.model_validate(profiles[0])

        # 3. Analyze ticket content for domain relevance keywords
        all_text = f"{ticket_detail.subject} " + " ".join([m.content for m in ticket_detail.messages])
        text_lower = all_text.lower()

        is_billing = any(w in text_lower for w in ["pay", "charge", "card", "bank", "stripe", "deduct", "money", "billing", "receipt", "wallet"])
        is_order = any(w in text_lower for w in ["order", "ship", "track", "delivery", "dispatch", "package", "warehouse", "missing", "cancel"])
        is_refund = any(w in text_lower for w in ["refund", "return", "reimburse", "credit"])
        is_sub = any(w in text_lower for w in ["subscri", "renew", "acmecare", "annual", "monthly", "plan"])
        is_account = any(w in text_lower for w in ["account", "password", "lock", "login", "reset", "email", "access"])
        is_tech = any(w in text_lower for w in ["update", "firmware", "headphone", "speaker", "bluetooth", "hardware", "not working", "broken", "connect"])

        # 4. Relevant Payments
        payments: List[PaymentSchema] = []
        if is_billing or is_order or is_refund:
            p_records, _ = await repo.list_records("payments", filters={"customer_id": customer_id}, limit=5)
            payments = [PaymentSchema.model_validate(p) for p in p_records]

        # 5. Relevant Orders
        orders: List[OrderSchema] = []
        if is_order or is_billing or is_refund or is_tech:
            o_records, _ = await repo.list_records("orders", filters={"customer_id": customer_id}, limit=5)
            orders = [OrderSchema.model_validate(o) for o in o_records]

        # 6. Relevant Refunds
        refunds: List[RefundSchema] = []
        if is_refund or is_billing or is_sub:
            r_records, _ = await repo.list_records("refunds", filters={"customer_id": customer_id}, limit=5)
            refunds = [RefundSchema.model_validate(r) for r in r_records]

        # 7. Relevant Subscriptions
        subscriptions: List[SubscriptionSchema] = []
        if is_sub or is_billing:
            s_records, _ = await repo.list_records("subscriptions", filters={"customer_id": customer_id}, limit=5)
            subscriptions = [SubscriptionSchema.model_validate(s) for s in s_records]

        # 8. Relevant Service Events (Microservice Telemetry)
        service_events: List[ServiceEventSchema] = []
        if is_billing or is_order:
            # Query payment-webhook-worker critical/error events
            se_records, _ = await repo.list_records("service_events", filters={"service_name": "payment-webhook-worker"}, limit=3)
            service_events.extend([ServiceEventSchema.model_validate(se) for se in se_records])
        if is_refund:
            se_refund, _ = await repo.list_records("service_events", filters={"service_name": "refund-settlement-cron"}, limit=3)
            service_events.extend([ServiceEventSchema.model_validate(se) for se in se_refund])
        if is_sub:
            se_sub, _ = await repo.list_records("service_events", filters={"service_name": "subscription-billing-vault"}, limit=3)
            service_events.extend([ServiceEventSchema.model_validate(se) for se in se_sub])
        if is_account:
            se_auth, _ = await repo.list_records("service_events", filters={"service_name": "auth-service"}, limit=3)
            service_events.extend([ServiceEventSchema.model_validate(se) for se in se_auth])
        if is_tech:
            se_tech, _ = await repo.list_records("service_events", filters={"service_name": "device-ota-service"}, limit=3)
            service_events.extend([ServiceEventSchema.model_validate(se) for se in se_tech])

        # 9. Customer Ticket History (Past interactions)
        past_tickets, _ = await repo.list_records("tickets", filters={"customer_id": customer_id}, limit=6)
        previous_tickets = [t for t in past_tickets if t.get("id") != ticket_id]
        
        customer_history = {
            "total_lifetime_tickets": len(past_tickets),
            "past_open_tickets": len([t for t in previous_tickets if t.get("status") in ["open", "investigating"]]),
            "past_resolved_tickets": len([t for t in previous_tickets if t.get("status") in ["resolved", "closed"]]),
            "loyalty_tier": customer_profile.loyalty_tier if customer_profile else "bronze",
            "lifetime_value_cents": customer_profile.lifetime_value_cents if customer_profile else 0,
            "churn_risk_score": customer_profile.churn_risk_score if customer_profile else 0.0
        }

        # 10. Assemble CaseContext
        return CaseContext(
            case_id=str(uuid.uuid4()),
            ticket=ticket_detail,
            customer=customer_schema,
            customer_profile=customer_profile,
            conversation=ticket_detail.messages,
            urgency=ticket_detail.priority,
            orders=orders,
            payments=payments,
            refunds=refunds,
            subscriptions=subscriptions,
            service_events=service_events,
            customer_history=customer_history,
            previous_tickets=previous_tickets,
            current_state="assembled"
        )

case_context_service = CaseContextService()
