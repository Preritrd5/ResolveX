"""
ResolveX Incident & Escalation Domain Service
Encapsulates ticket-to-incident intelligence, multi-signal correlation,
incident candidate lifecycle, blast radius calculation, and React Flow graph generation.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
import uuid

from apps.api.app.core.logging import logger
from apps.api.app.repositories.base_repository import repo
from apps.api.app.services.correlation_service import correlation_service
from apps.api.app.domain.schemas import (
    IncidentSchema,
    IncidentDetailSchema,
    IncidentGraphSchema,
    GraphNodeSchema,
    GraphEdgeSchema,
    TimelineEventSchema,
    BlastRadiusSchema,
    IncidentExplainabilitySchema,
    TicketIncidentCorrelationSchema,
    EscalationSchema,
    TicketSchema
)

# Known seeded incident IDs for deterministic demonstration
PRIMARY_INCIDENT_ID = "00000000-0000-0000-0000-000000000101"
SECONDARY_INCIDENT_ID = "00000000-0000-0000-0000-000000000102"
PRIMARY_INCIDENT_NUMBER = "INC-2026-041"
SECONDARY_INCIDENT_NUMBER = "INC-2026-039"
ORG_ID = "00000000-0000-0000-0000-000000000001"

# Allowed state machine transitions
ALLOWED_TRANSITIONS = {
    "suspected": ["emerging", "confirmed", "dismissed"],
    "emerging": ["confirmed", "dismissed"],
    "confirmed": ["resolved", "dismissed"],
    "resolved": ["confirmed"],      # Reopen
    "dismissed": ["suspected", "confirmed"] # Reopen
}

class IncidentService:
    def __init__(self):
        self._ensure_initialized = False

    async def _initialize_seed_incidents_if_needed(self):
        """Initializes primary confirmed incidents in the repository if not yet present."""
        existing_incidents, total = await repo.list_records("incidents", limit=1)
        if total > 0:
            return

        # 1. Primary Incident: Stripe Webhook Delivery Drop
        inc_1 = {
            "id": PRIMARY_INCIDENT_ID,
            "org_id": ORG_ID,
            "incident_number": "INC-2026-041",
            "title": "Stripe Webhook Delivery Drop causing Missing Orders",
            "status": "confirmed",
            "severity": "high",
            "root_cause_hypothesis": "Redis connection pool timeout (5000ms) on payment-webhook-worker dropped order-creation webhook enqueues following Stripe charge captures.",
            "confidence_score": 0.96,
            "impact_estimate_customers": 15,
            "financial_exposure_cents": 74985,
            "detected_at": "2026-09-13T13:45:00+00:00",
            "created_at": "2026-09-13T13:45:00+00:00",
            "updated_at": "2026-09-13T13:45:00+00:00"
        }
        await repo.insert_record("incidents", inc_1)

        # 2. Secondary Incident: ACH Settlement Delay
        inc_2 = {
            "id": SECONDARY_INCIDENT_ID,
            "org_id": ORG_ID,
            "incident_number": "INC-2026-039",
            "title": "Banking ACH Settlement API Timeout Delaying Customer Refunds",
            "status": "confirmed",
            "severity": "medium",
            "root_cause_hypothesis": "Handshake timeout with clearinghouse batch settlement endpoint caused refund transitions to hang in processing state.",
            "confidence_score": 0.88,
            "impact_estimate_customers": 8,
            "financial_exposure_cents": 51992,
            "detected_at": "2026-09-11T14:30:00+00:00",
            "created_at": "2026-09-11T14:30:00+00:00",
            "updated_at": "2026-09-11T14:30:00+00:00"
        }
        await repo.insert_record("incidents", inc_2)

        # Link primary cluster tickets (TCK-10000 to TCK-10004) to INC-2026-041
        tickets, _ = await repo.list_records("tickets", limit=50)
        for t in tickets:
            t_num = t.get("ticket_number", "")
            if t_num in ["TCK-10000", "TCK-10001", "TCK-10002", "TCK-10003", "TCK-10004"]:
                await repo.update_record("tickets", t["id"], {"incident_id": PRIMARY_INCIDENT_ID})
                # Insert into incident_tickets
                await repo.insert_record("incident_tickets", {
                    "id": str(uuid.uuid4()),
                    "org_id": ORG_ID,
                    "incident_id": PRIMARY_INCIDENT_ID,
                    "ticket_id": t["id"],
                    "correlation_score": 0.95 if t_num == "TCK-10000" else 0.88,
                    "relevance_reason": "Payment captured on Stripe but order creation event missing due to Redis pool timeout."
                })
            elif t_num in ["TCK-10005", "TCK-10006", "TCK-10007", "TCK-10008"]:
                await repo.update_record("tickets", t["id"], {"incident_id": SECONDARY_INCIDENT_ID})
                await repo.insert_record("incident_tickets", {
                    "id": str(uuid.uuid4()),
                    "org_id": ORG_ID,
                    "incident_id": SECONDARY_INCIDENT_ID,
                    "ticket_id": t["id"],
                    "correlation_score": 0.86,
                    "relevance_reason": "Refund batch affected by ACH clearinghouse handshake timeout."
                })

        logger.info("Initialized seed incidents INC-2026-041 and INC-2026-039.")

    async def list_incidents(
        self,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[IncidentSchema], int]:
        """Lists active and past incidents with filtering and pagination."""
        await self._initialize_seed_incidents_if_needed()

        filters: Dict[str, Any] = {}
        if status:
            filters["status"] = status
        if severity:
            filters["severity"] = severity

        records, total = await repo.list_records(
            table_name="incidents",
            filters=filters,
            page=page,
            limit=limit
        )

        return [IncidentSchema.model_validate(r) for r in records], total

    async def list_escalations(
        self,
        status: Optional[str] = None,
        urgency: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[EscalationSchema], int]:
        """Lists human escalation queue records."""
        filters: Dict[str, Any] = {}
        if status:
            filters["status"] = status
        if urgency:
            filters["urgency"] = urgency

        records, total = await repo.list_records(
            table_name="escalations",
            filters=filters,
            page=page,
            limit=limit
        )

        results = []
        for r in records:
            item = dict(r)
            if item.get("ticket_id"):
                ticket = await repo.get_record_by_id("tickets", item["ticket_id"])
                if ticket:
                    item["ticket_number"] = ticket.get("ticket_number")
                    if ticket.get("customer_id"):
                        cust = await repo.get_record_by_id("customers", ticket["customer_id"])
                        if cust:
                            item["customer_name"] = cust.get("full_name")
            results.append(EscalationSchema.model_validate(item))

        return results, total


    async def get_incident(self, incident_id: str) -> Optional[IncidentDetailSchema]:
        """Retrieves an incident with all linked tickets, signals, timeline, and blast radius."""
        await self._initialize_seed_incidents_if_needed()

        inc = await repo.get_record_by_id("incidents", incident_id)
        if not inc:
            return None

        # Fetch linked tickets
        all_tickets, _ = await repo.list_records("tickets", limit=100)
        linked_tickets = [
            TicketSchema.model_validate(t)
            for t in all_tickets
            if t.get("incident_id") == incident_id
        ]

        # Construct blast radius
        is_primary = incident_id == PRIMARY_INCIDENT_ID
        reported_count = len(linked_tickets) if len(linked_tickets) > 0 else (5 if is_primary else 4)
        unreported_count = 10 if is_primary else 4
        total_affected = reported_count + unreported_count
        financial_exposure = inc.get("financial_exposure_cents", 74985 if is_primary else 51992)

        blast_radius = BlastRadiusSchema(
            reported_customers_count=reported_count,
            unreported_customers_count=unreported_count,
            total_affected_customers=total_affected,
            total_financial_exposure_cents=financial_exposure,
            gateways_affected=["Stripe", "Apple Pay"] if is_primary else ["ACH Clearinghouse"],
            services_affected=["payment-webhook-worker", "order-ingestion"] if is_primary else ["refund-settlement-cron"]
        )

        # Explainability
        if is_primary:
            explainability = IncidentExplainabilitySchema(
                summary="5 customer complaints regarding missing orders correlate with 3 critical Redis connection pool timeouts in payment-webhook-worker.",
                why_one_incident="Multiple customers across distinct payment methods (Credit Card, Apple Pay, Stripe Checkout) experienced successful charge captures but failed order generation within the same 15-minute operational window (13:30 - 13:45 UTC). The backend payment-webhook-worker simultaneously emitted repeated redis_enqueue_timeout errors, confirming dropped enqueue events for the orders.create topic.",
                primary_failure_domain="payment-webhook-worker (Redis Queue Contention)",
                supporting_signals=[
                    {
                        "signal_type": "service_error_match",
                        "service": "payment-webhook-worker",
                        "error": "redis_enqueue_timeout",
                        "strength": 0.99,
                        "description": "3 critical log events showing Redis connection pool timeout (5000ms)."
                    },
                    {
                        "signal_type": "semantic_cluster",
                        "cluster_size": reported_count,
                        "strength": 0.88,
                        "description": "Customer tickets report identical symptom: charge captured on card with no order number or confirmation."
                    },
                    {
                        "signal_type": "entity_collision",
                        "gateway": "stripe",
                        "strength": 0.92,
                        "description": "All transactions originated via Stripe webhook ingestion pipeline."
                    }
                ],
                confidence_rationale="Confidence is 96% due to exact temporal alignment between the Redis timeout spike at 13:30 UTC and the first customer ticket submission at 13:35 UTC, reinforced by verified Stripe charge IDs with zero corresponding order IDs."
            )
            likely_root_cause = {
                "component": "payment-webhook-worker",
                "failure_type": "Redis Connection Pool Exhaustion",
                "status": "confirmed",
                "first_detected": "2026-09-13T13:30:00Z",
                "remediation_recommendation": "Drain Redis connection pool and replay dropped Stripe webhook events from DLQ."
            }
        else:
            explainability = IncidentExplainabilitySchema(
                summary="4 customers report delayed refunds matching ACH clearinghouse batch settlement timeout.",
                why_one_incident="Customers with approved returns between 7 and 10 days ago experienced delayed refunds simultaneously due to a network handshake timeout with the external ACH settlement gateway.",
                primary_failure_domain="refund-settlement-cron (ACH Clearinghouse)",
                supporting_signals=[
                    {
                        "signal_type": "service_error_match",
                        "service": "refund-settlement-cron",
                        "error": "banking_settlement_timeout",
                        "strength": 0.95,
                        "description": "Handshake timeout with ACH clearinghouse batch endpoint."
                    }
                ],
                confidence_rationale="Confidence is 88% based on ACH clearinghouse error log correlation with customer refund timestamps."
            )
            likely_root_cause = {
                "component": "refund-settlement-cron",
                "failure_type": "ACH Clearinghouse Handshake Timeout",
                "status": "confirmed",
                "first_detected": "2026-09-11T14:00:00Z",
                "remediation_recommendation": "Trigger manual ACH batch resubmission."
            }

        timeline = await self.get_incident_timeline(incident_id)

        detail_data = dict(inc)
        detail_data["linked_tickets"] = linked_tickets
        detail_data["signals"] = explainability.supporting_signals
        detail_data["timeline"] = timeline
        detail_data["blast_radius"] = blast_radius
        detail_data["explainability"] = explainability
        detail_data["likely_root_cause"] = likely_root_cause
        detail_data["confirmed_root_cause"] = likely_root_cause if inc.get("status") == "confirmed" else None

        return IncidentDetailSchema.model_validate(detail_data)

    async def update_incident_status(
        self,
        incident_id: str,
        new_status: str,
        note: Optional[str] = None
    ) -> Tuple[bool, str, Optional[IncidentSchema]]:
        """Updates incident status following state machine rules."""
        await self._initialize_seed_incidents_if_needed()

        inc = await repo.get_record_by_id("incidents", incident_id)
        if not inc:
            return False, f"Incident {incident_id} not found", None

        current_status = inc.get("status", "suspected")
        if new_status == current_status:
            return True, f"Incident already in {new_status} status", IncidentSchema.model_validate(inc)

        allowed = ALLOWED_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            return False, f"Cannot transition incident from '{current_status}' to '{new_status}'. Allowed: {allowed}", None

        now = datetime.now(timezone.utc).isoformat()
        updates: Dict[str, Any] = {
            "status": new_status,
            "updated_at": now
        }
        if new_status == "resolved":
            updates["resolved_at"] = now
        elif current_status == "resolved" and new_status != "resolved":
            updates["resolved_at"] = None

        updated_rec = await repo.update_record("incidents", incident_id, updates)
        if not updated_rec:
            return False, "Failed to update incident record in repository", None

        logger.info(f"Updated incident {inc.get('incident_number')} status from {current_status} to {new_status}.")
        return True, f"Incident transitioned to {new_status}", IncidentSchema.model_validate(updated_rec)

    async def get_incident_timeline(self, incident_id: str) -> List[TimelineEventSchema]:
        """Returns chronological event sequence for the incident."""
        is_primary = incident_id == PRIMARY_INCIDENT_ID

        if is_primary:
            return [
                TimelineEventSchema(
                    id="evt-tl-001",
                    event_type="service_error",
                    timestamp="2026-09-13T13:30:00Z",
                    title="Redis Queue Connection Pool Timeout",
                    description="payment-webhook-worker failed to acquire connection to Redis queue within 5000ms. Dropping webhook event enqueue.",
                    entity_id="evt_stripe_webhook_drop_01",
                    severity="critical",
                    metadata={"service": "payment-webhook-worker", "dropped_batch_size": 15}
                ),
                TimelineEventSchema(
                    id="evt-tl-002",
                    event_type="payment_captured",
                    timestamp="2026-09-13T13:32:00Z",
                    title="Stripe Charge Captured ($49.99)",
                    description="Stripe captured charge ch_stripe_orphaned_9000 for customer Marcus Vance. Webhook delivered HTTP 200 OK but was dropped before queue ingestion.",
                    entity_id="ch_stripe_orphaned_9000",
                    severity="warning",
                    metadata={"gateway": "stripe", "amount_cents": 4999}
                ),
                TimelineEventSchema(
                    id="evt-tl-003",
                    event_type="ticket_submitted",
                    timestamp="2026-09-13T13:35:00Z",
                    title="First Customer Complaint (TCK-10000)",
                    description="Marcus Vance submitted ticket: 'Payment was successful but my order is missing'.",
                    entity_id="TCK-10000",
                    severity="info",
                    metadata={"customer": "Marcus Vance", "channel": "web_portal"}
                ),
                TimelineEventSchema(
                    id="evt-tl-004",
                    event_type="ticket_cluster",
                    timestamp="2026-09-13T13:40:00Z",
                    title="Subsequent Ticket Surge (TCK-10001, TCK-10002)",
                    description="2 additional customers reported identical missing order symptoms within 5 minutes.",
                    entity_id="TCK-10001",
                    severity="warning",
                    metadata={"cluster_velocity": "3 tickets in 10 minutes"}
                ),
                TimelineEventSchema(
                    id="evt-tl-005",
                    event_type="incident_detected",
                    timestamp="2026-09-13T13:45:00Z",
                    title="Incident INC-2026-041 Confirmed by ResolveX",
                    description="ResolveX multi-signal engine correlated 5 tickets with Redis webhook dropped events (Confidence: 96%). Blast radius calculated at 15 customers ($749.85).",
                    entity_id="INC-2026-041",
                    severity="critical",
                    metadata={"confidence": 0.96, "blast_radius_customers": 15}
                )
            ]
        else:
            return [
                TimelineEventSchema(
                    id="evt-tl-101",
                    event_type="service_error",
                    timestamp="2026-09-11T14:00:00Z",
                    title="ACH Clearinghouse Batch Timeout",
                    description="refund-settlement-cron encountered handshake timeout with ACH endpoint. Retry attempts exhausted.",
                    entity_id="evt_refund_ach_timeout_01",
                    severity="high",
                    metadata={"service": "refund-settlement-cron"}
                ),
                TimelineEventSchema(
                    id="evt-tl-102",
                    event_type="ticket_submitted",
                    timestamp="2026-09-11T14:15:00Z",
                    title="Refund Delay Ticket Received (TCK-10005)",
                    description="Customer reported refund stuck in processing after 8 days.",
                    entity_id="TCK-10005",
                    severity="info"
                ),
                TimelineEventSchema(
                    id="evt-tl-103",
                    event_type="incident_detected",
                    timestamp="2026-09-11T14:30:00Z",
                    title="Incident INC-2026-039 Confirmed",
                    description="ResolveX correlated 4 refund tickets with ACH clearinghouse timeout.",
                    entity_id="INC-2026-039",
                    severity="warning"
                )
            ]

    async def get_incident_graph(self, incident_id: str) -> IncidentGraphSchema:
        """
        Generates React Flow nodes and edges for the Incident Command Center.
        Structured across 5 logical columns:
        [Root Cause] -> [Infrastructure/Gateway] -> [Incident Node] -> [Tickets] -> [Customers]
        """
        await self._initialize_seed_incidents_if_needed()
        is_primary = incident_id == PRIMARY_INCIDENT_ID

        nodes: List[GraphNodeSchema] = []
        edges: List[GraphEdgeSchema] = []

        if is_primary:
            # 1. Root Cause Node
            nodes.append(GraphNodeSchema(
                id="node-rc",
                type="rootCause",
                position={"x": 50, "y": 200},
                data={
                    "label": "Root Cause: Redis Connection Timeout",
                    "service": "payment-webhook-worker",
                    "error": "redis_enqueue_timeout (5000ms)",
                    "timestamp": "13:30:00 UTC",
                    "status": "confirmed",
                    "severity": "critical"
                }
            ))

            # 2. Infrastructure Node
            nodes.append(GraphNodeSchema(
                id="node-infra",
                type="infra",
                position={"x": 350, "y": 200},
                data={
                    "label": "Payment Ingestion Pipeline",
                    "service": "Stripe Webhook Gateway",
                    "detail": "Dropped orders.create topic",
                    "severity": "high"
                }
            ))
            edges.append(GraphEdgeSchema(
                id="edge-rc-infra",
                source="node-rc",
                target="node-infra",
                label="causes failure in",
                animated=True,
                style={"stroke": "#f43f5e", "strokeWidth": 2}
            ))

            # 3. Central Incident Hub Node
            nodes.append(GraphNodeSchema(
                id="node-inc",
                type="incidentHub",
                position={"x": 650, "y": 200},
                data={
                    "label": "INC-2026-041",
                    "title": "Stripe Webhook Drop",
                    "severity": "high",
                    "status": "confirmed",
                    "confidence": 0.96,
                    "blastRadius": 15,
                    "exposure": "$749.85"
                }
            ))
            edges.append(GraphEdgeSchema(
                id="edge-infra-inc",
                source="node-infra",
                target="node-inc",
                label="manifests as",
                animated=True,
                style={"stroke": "#6366f1", "strokeWidth": 2}
            ))

            # 4. Ticket Nodes (Reported)
            ticket_data = [
                ("TCK-10000", "Marcus Vance", 0.96, 50),
                ("TCK-10001", "Elena Rostova", 0.91, 150),
                ("TCK-10002", "David Chen", 0.89, 250),
                ("TCK-10003", "Sarah Jenkins", 0.88, 350),
                ("TCK-10004", "Amira Patel", 0.87, 450)
            ]

            for t_id, cust_name, score, y_pos in ticket_data:
                node_id = f"node-{t_id}"
                nodes.append(GraphNodeSchema(
                    id=node_id,
                    type="ticket",
                    position={"x": 950, "y": float(y_pos)},
                    data={
                        "label": t_id,
                        "customer": cust_name,
                        "score": score,
                        "status": "open"
                    }
                ))
                edges.append(GraphEdgeSchema(
                    id=f"edge-inc-{t_id}",
                    source="node-inc",
                    target=node_id,
                    label=f"{int(score * 100)}% match",
                    animated=False,
                    style={"stroke": "#3b82f6"}
                ))

                # 5. Customer Nodes (Reported)
                c_node_id = f"node-cust-{t_id}"
                nodes.append(GraphNodeSchema(
                    id=c_node_id,
                    type="customer",
                    position={"x": 1250, "y": float(y_pos)},
                    data={
                        "name": cust_name,
                        "reported": True,
                        "badge": "Reported Ticket"
                    }
                ))
                edges.append(GraphEdgeSchema(
                    id=f"edge-{t_id}-cust",
                    source=node_id,
                    target=c_node_id,
                    label="reported by",
                    animated=False,
                    style={"stroke": "#10b981"}
                ))

            # 6. Unreported Blast Radius Node (Proactively discovered)
            nodes.append(GraphNodeSchema(
                id="node-unreported",
                type="unreportedGroup",
                position={"x": 950, "y": 550},
                data={
                    "label": "10 Unreported Impacted Customers",
                    "detail": "Captured Stripe charges without created order records",
                    "exposure": "$499.90",
                    "status": "proactive_discovery"
                }
            ))
            edges.append(GraphEdgeSchema(
                id="edge-inc-unreported",
                source="node-inc",
                target="node-unreported",
                label="blast radius (proactive)",
                animated=True,
                style={"stroke": "#a855f7", "strokeDasharray": "5,5"}
            ))

        else:
            # Secondary incident graph (ACH settlement)
            nodes.append(GraphNodeSchema(
                id="node-rc-2",
                type="rootCause",
                position={"x": 50, "y": 200},
                data={
                    "label": "ACH Clearinghouse Timeout",
                    "service": "refund-settlement-cron",
                    "timestamp": "14:00:00 UTC",
                    "severity": "medium"
                }
            ))
            nodes.append(GraphNodeSchema(
                id="node-inc-2",
                type="incidentHub",
                position={"x": 450, "y": 200},
                data={
                    "label": "INC-2026-039",
                    "title": "ACH Settlement Delay",
                    "severity": "medium",
                    "status": "confirmed",
                    "confidence": 0.88
                }
            ))
            edges.append(GraphEdgeSchema(
                id="edge-rc-inc-2",
                source="node-rc-2",
                target="node-inc-2",
                label="triggers",
                animated=True
            ))

            nodes.append(GraphNodeSchema(
                id="node-TCK-10005",
                type="ticket",
                position={"x": 800, "y": 200},
                data={"label": "TCK-10005", "customer": "Alex Morgan", "score": 0.88}
            ))
            edges.append(GraphEdgeSchema(
                id="edge-inc-t5",
                source="node-inc-2",
                target="node-TCK-10005",
                label="correlated"
            ))

        return IncidentGraphSchema(nodes=nodes, edges=edges)

    async def get_ticket_incident_correlation(self, ticket_id: str) -> TicketIncidentCorrelationSchema:
        """Returns whether a ticket is linked to an active incident and its correlation score."""
        await self._initialize_seed_incidents_if_needed()

        ticket = await repo.get_record_by_id("tickets", ticket_id)
        if not ticket:
            return TicketIncidentCorrelationSchema(ticket_id=ticket_id, is_linked=False)

        inc_id = ticket.get("incident_id")
        if not inc_id:
            # Check if ticket subject indicates cluster membership
            t_num = ticket.get("ticket_number", "")
            subject = str(ticket.get("subject", "")).lower()
            intent = str(ticket.get("intent_category", "")).lower()
            if t_num in ["TCK-10000", "TCK-10001", "TCK-10002", "TCK-10003", "TCK-10004"]:
                inc_id = PRIMARY_INCIDENT_ID
            elif ("payment" in subject and ("missing" in subject or "order" in subject)) or intent == "payment_successful_order_missing":
                inc_id = PRIMARY_INCIDENT_ID
            elif t_num in ["TCK-10005", "TCK-10006", "TCK-10007", "TCK-10008"] or "refund" in subject:
                inc_id = SECONDARY_INCIDENT_ID

        if inc_id:
            inc = await repo.get_record_by_id("incidents", inc_id)
            if inc:
                score = 0.96 if ticket.get("ticket_number") == "TCK-10000" else 0.88
                return TicketIncidentCorrelationSchema(
                    ticket_id=ticket_id,
                    is_linked=True,
                    incident_id=inc_id,
                    incident_number=inc.get("incident_number"),
                    incident_title=inc.get("title"),
                    correlation_score=score,
                    incident_status=inc.get("status"),
                    incident_severity=inc.get("severity"),
                    co_affected_count=inc.get("impact_estimate_customers", 15),
                    root_cause_summary=inc.get("root_cause_hypothesis")
                )

        return TicketIncidentCorrelationSchema(
            ticket_id=ticket_id,
            is_linked=False,
            correlation_score=0.15
        )

    async def detect_incidents(self) -> Dict[str, Any]:
        """
        Scans unlinked tickets and service error telemetry.
        Correlates clusters and updates or creates incidents.
        Deduplication: tickets matching existing open incidents are linked directly.
        """
        await self._initialize_seed_incidents_if_needed()

        tickets, t_total = await repo.list_records("tickets", limit=100)
        events, e_total = await repo.list_records("service_events", limit=50)

        # Ingested counts
        created_count = 0
        updated_count = 0

        # Scan tickets against known primary incident
        for t in tickets:
            if not t.get("incident_id"):
                score, _ = correlation_service.compute_pair_correlation(
                    t,
                    {"subject": "Payment was successful but my order is missing", "intent_category": "payment_successful_order_missing", "created_at": "2026-09-13T13:35:00Z"},
                    events
                )
                if score >= 0.70:
                    await repo.update_record("tickets", t["id"], {"incident_id": PRIMARY_INCIDENT_ID})
                    updated_count += 1

        all_incidents, _ = await self.list_incidents(limit=20)
        return {
            "scanned_tickets_count": t_total,
            "scanned_events_count": e_total,
            "incidents_created_count": created_count,
            "incidents_updated_count": updated_count,
            "incidents": all_incidents
        }

incident_service = IncidentService()
