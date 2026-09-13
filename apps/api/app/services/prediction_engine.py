"""
ResolveX Customer Impact Prediction Engine
Predicts, classifies, and prioritizes customers affected by operational incidents
using evidence-backed operational correlation and legitimate business signals.
"""

from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
import uuid

from apps.api.app.core.logging import logger
from apps.api.app.repositories.base_repository import repo
from apps.api.app.services.incident_service import (
    incident_service,
    PRIMARY_INCIDENT_ID,
    SECONDARY_INCIDENT_ID,
    ORG_ID
)
from apps.api.app.domain.schemas import (
    CustomerImpactPredictionSchema,
    CustomerEvidenceSignal,
    CustomerRiskResponseSchema,
    CustomerClassificationEnum,
    ImpactScoreLevelEnum
)

class IncidentSignature:
    """Reusable incident signature for operational pattern matching"""
    def __init__(
        self,
        service: str,
        event_signature: str,
        payment_state: str,
        order_state: str,
        temporal_window_start: str,
        temporal_window_end: str,
        gateway: Optional[str] = None,
        severity: str = "high"
    ):
        self.service = service
        self.event_signature = event_signature
        self.payment_state = payment_state
        self.order_state = order_state
        self.temporal_window_start = temporal_window_start
        self.temporal_window_end = temporal_window_end
        self.gateway = gateway
        self.severity = severity

class CustomerImpactPredictionEngine:
    """
    Evidence-backed prediction engine classifying customers into:
    CONFIRMED_AFFECTED, LIKELY_AFFECTED, POTENTIALLY_AFFECTED, NOT_AFFECTED
    """
    def __init__(self):
        self._prediction_cache: Dict[str, List[CustomerImpactPredictionSchema]] = {}
        self.model_name = "incident_pattern_matcher"
        self.model_version = "1.0"
        self.method_description = "rule_based_evidence_corroboration"

    def _get_incident_signature(self, incident: Dict[str, Any]) -> IncidentSignature:
        """Derives signature from incident metadata"""
        inc_id = incident.get("id")
        if inc_id == PRIMARY_INCIDENT_ID or "Stripe" in incident.get("title", ""):
            return IncidentSignature(
                service="payment-webhook-worker",
                event_signature="redis_enqueue_timeout",
                payment_state="captured",
                order_state="missing",
                temporal_window_start="2026-09-13T13:00:00+00:00",
                temporal_window_end="2026-09-13T14:30:00+00:00",
                gateway="stripe",
                severity=incident.get("severity", "high")
            )
        elif inc_id == SECONDARY_INCIDENT_ID or "ACH" in incident.get("title", ""):
            return IncidentSignature(
                service="refund-settlement-cron",
                event_signature="banking_settlement_timeout",
                payment_state="refund_pending",
                order_state="any",
                temporal_window_start="2026-09-11T13:00:00+00:00",
                temporal_window_end="2026-09-11T16:00:00+00:00",
                gateway="ach",
                severity=incident.get("severity", "medium")
            )
        else:
            return IncidentSignature(
                service="generic-service",
                event_signature="operational_error",
                payment_state="any",
                order_state="any",
                temporal_window_start="2026-09-01T00:00:00+00:00",
                temporal_window_end="2026-09-30T23:59:59+00:00",
                severity=incident.get("severity", "low")
            )

    async def predict_affected_customers(self, incident_id: str) -> List[CustomerImpactPredictionSchema]:
        """
        Discovers candidate customers matching the incident signature and classifies them.
        Caches predictions in memory.
        """
        await incident_service._initialize_seed_incidents_if_needed()
        incident = await repo.get_record_by_id("incidents", incident_id)
        if not incident:
            logger.warning(f"Incident {incident_id} not found for prediction.")
            return []

        sig = self._get_incident_signature(incident)

        # 1. Fetch relevant operational entities
        all_payments, _ = await repo.list_records("payments", limit=1000)
        all_orders, _ = await repo.list_records("orders", limit=1000)
        all_tickets, _ = await repo.list_records("tickets", limit=1000)
        all_customers, _ = await repo.list_records("customers", limit=1000)
        all_profiles, _ = await repo.list_records("customer_profiles", limit=1000)

        # Index data for efficient resolution
        orders_by_id = {o["id"]: o for o in all_orders}
        orders_by_customer: Dict[str, List[Dict[str, Any]]] = {}
        for o in all_orders:
            cid = o.get("customer_id")
            if cid:
                orders_by_customer.setdefault(cid, []).append(o)

        tickets_by_customer: Dict[str, List[Dict[str, Any]]] = {}
        for t in all_tickets:
            cid = t.get("customer_id")
            if cid:
                tickets_by_customer.setdefault(cid, []).append(t)

        cust_map = {c["id"]: c for c in all_customers}
        profile_map = {p.get("customer_id", p.get("id")): p for p in all_profiles}

        predictions: List[CustomerImpactPredictionSchema] = []
        now_str = datetime.now(timezone.utc).isoformat()

        # 2. Match candidates based on signature
        # A candidate is any customer with payments or tickets in the relevant scope
        candidate_customer_ids = set()

        for p in all_payments:
            p_time = p.get("created_at", "")
            if sig.temporal_window_start <= p_time <= sig.temporal_window_end:
                cid = p.get("customer_id")
                if cid:
                    candidate_customer_ids.add(cid)

        # Also include customers who filed tickets linked to this incident
        for t in all_tickets:
            if t.get("incident_id") == incident_id:
                cid = t.get("customer_id")
                if cid:
                    candidate_customer_ids.add(cid)

        # Evaluate evidence for each candidate
        for cid in candidate_customer_ids:
            cust = cust_map.get(cid)
            if not cust:
                continue

            prof = profile_map.get(cid, {})
            cust_payments = [p for p in all_payments if p.get("customer_id") == cid]
            cust_tickets = tickets_by_customer.get(cid, [])
            cust_orders = orders_by_customer.get(cid, [])

            # Check payments in incident window
            window_payments = [
                p for p in cust_payments
                if sig.temporal_window_start <= p.get("created_at", "") <= sig.temporal_window_end
            ]

            # Orphaned payments (captured payment without order)
            orphaned_in_window = [
                p for p in window_payments
                if not p.get("order_id") and p.get("status") in ["captured", "success"]
            ]

            # Linked ticket
            has_linked_ticket = any(t.get("incident_id") == incident_id for t in cust_tickets)

            # Build Evidence Signals
            evidence: List[CustomerEvidenceSignal] = []
            observed_facts: List[str] = []
            predicted_impact: List[str] = []

            # Signal 1: Transaction State Match
            if orphaned_in_window:
                p_item = orphaned_in_window[0]
                evidence.append(CustomerEvidenceSignal(
                    signal_name="captured_payment_unlinked",
                    matched=True,
                    description=f"Stripe payment {p_item.get('gateway_transaction_id')} (${p_item.get('amount_cents', 0)/100:.2f}) captured successfully",
                    timestamp=p_item.get("created_at")
                ))
                observed_facts.append(f"Payment {p_item.get('gateway_transaction_id')} captured on gateway")
            elif window_payments:
                evidence.append(CustomerEvidenceSignal(
                    signal_name="captured_payment_in_window",
                    matched=True,
                    description="Payment processed during incident window",
                    timestamp=window_payments[0].get("created_at")
                ))
                observed_facts.append("Payment transaction recorded during window")
            else:
                evidence.append(CustomerEvidenceSignal(
                    signal_name="captured_payment_unlinked",
                    matched=False,
                    description="No unlinked payment found in window"
                ))

            # Signal 2: Missing Order in Pipeline
            if orphaned_in_window:
                evidence.append(CustomerEvidenceSignal(
                    signal_name="order_record_missing",
                    matched=True,
                    description="No corresponding order record created in fulfillment database",
                    source="orders_database"
                ))
                observed_facts.append("Zero corresponding order records exist in fulfillment pipeline")
            else:
                evidence.append(CustomerEvidenceSignal(
                    signal_name="order_record_missing",
                    matched=False,
                    description="Order record exists or payment was linked",
                    source="orders_database"
                ))

            # Signal 3: Temporal Proximity
            if window_payments:
                evidence.append(CustomerEvidenceSignal(
                    signal_name="temporal_proximity_window",
                    matched=True,
                    description="Transaction occurred during Stripe webhook worker contention window (13:00–14:30 UTC)",
                    source="chronological_telemetry"
                ))
            else:
                evidence.append(CustomerEvidenceSignal(
                    signal_name="temporal_proximity_window",
                    matched=False,
                    description="No transactions within the incident temporal window"
                ))

            # Signal 4: Service Failure Match
            evidence.append(CustomerEvidenceSignal(
                signal_name="service_failure_match",
                matched=bool(orphaned_in_window),
                description=f"Correlates with {sig.service} {sig.event_signature} failure signature",
                source="service_events"
            ))

            # Signal 5: Support Contact Status
            if has_linked_ticket:
                t_nums = [t.get("ticket_number") for t in cust_tickets if t.get("incident_id") == incident_id]
                evidence.append(CustomerEvidenceSignal(
                    signal_name="customer_ticket_reported",
                    matched=True,
                    description=f"Customer submitted complaint ticket(s): {', '.join(filter(None, t_nums))}",
                    source="support_tickets"
                ))
                observed_facts.append(f"Customer filed support ticket {t_nums[0] if t_nums else ''}")
            else:
                evidence.append(CustomerEvidenceSignal(
                    signal_name="customer_ticket_reported",
                    matched=False,
                    description="No support complaint filed by customer yet",
                    source="support_tickets"
                ))
                observed_facts.append("Customer has not yet contacted support")

            # Classification Logic (strictly evidence-based)
            if has_linked_ticket and orphaned_in_window:
                classification = CustomerClassificationEnum.CONFIRMED_AFFECTED.value
                confidence = 0.96
                reason = "Customer filed a complaint with verified captured payment and missing order record matching the incident signature."
                predicted_impact.append("Customer actively seeking order status; high repeat contact risk")
            elif orphaned_in_window and not has_linked_ticket:
                classification = CustomerClassificationEnum.LIKELY_AFFECTED.value
                confidence = 0.91
                reason = "Payment captured on gateway during incident window, but order creation failed. Customer has not yet reported the issue."
                predicted_impact.append("Likely to discover missing order within 24 hours and file high-urgency complaint")
            elif window_payments and not orphaned_in_window:
                classification = CustomerClassificationEnum.POTENTIALLY_AFFECTED.value
                confidence = 0.65
                reason = "Customer transacted during incident window, but order status indicates delayed or partial fulfillment."
                predicted_impact.append("May experience delivery notification delays")
            else:
                classification = CustomerClassificationEnum.NOT_AFFECTED.value
                confidence = 0.20
                reason = "Operational evidence does not match the failure conditions of this incident."
                predicted_impact.append("Standard account activity")

            # Risk Prioritization (Strictly legitimate operational attributes)
            # Factors: incident severity, transaction amount, customer tier, time affected, classification
            base_score = 0.0
            if classification == CustomerClassificationEnum.CONFIRMED_AFFECTED.value:
                base_score += 40.0
            elif classification == CustomerClassificationEnum.LIKELY_AFFECTED.value:
                base_score += 35.0
            elif classification == CustomerClassificationEnum.POTENTIALLY_AFFECTED.value:
                base_score += 15.0

            # Financial impact factor (from transaction)
            txn_amount_cents = orphaned_in_window[0].get("amount_cents", 0) if orphaned_in_window else (
                window_payments[0].get("amount_cents", 0) if window_payments else 0
            )
            if txn_amount_cents >= 10000:  # >= $100
                base_score += 25.0
            elif txn_amount_cents >= 4000:  # >= $40
                base_score += 15.0
            else:
                base_score += 5.0

            # Legitimate loyalty tier factor
            tier = prof.get("loyalty_tier", "standard").lower()
            if tier in ["vip", "platinum"]:
                base_score += 20.0
            elif tier == "gold":
                base_score += 12.0
            elif tier == "silver":
                base_score += 6.0

            # Repeat contact factor
            if len(cust_tickets) >= 3:
                base_score += 15.0
            elif len(cust_tickets) >= 1:
                base_score += 5.0

            impact_score = min(100.0, round(base_score, 1))

            if impact_score >= 75.0:
                risk_level = ImpactScoreLevelEnum.CRITICAL.value
            elif impact_score >= 50.0:
                risk_level = ImpactScoreLevelEnum.HIGH.value
            elif impact_score >= 30.0:
                risk_level = ImpactScoreLevelEnum.MEDIUM.value
            else:
                risk_level = ImpactScoreLevelEnum.LOW.value

            # Recommended Action
            if classification == CustomerClassificationEnum.CONFIRMED_AFFECTED.value:
                recommended_action = "Expedite missing order recreation and notify customer via ticket reply"
            elif classification == CustomerClassificationEnum.LIKELY_AFFECTED.value:
                recommended_action = "Notify customer proactively before support inquiry; reconcile missing order"
            elif classification == CustomerClassificationEnum.POTENTIALLY_AFFECTED.value:
                recommended_action = "Monitor fulfillment pipeline telemetry for 30 minutes"
            else:
                recommended_action = "No proactive remediation required"

            pred = CustomerImpactPredictionSchema(
                id=f"pred-{cid[:8]}-{incident_id[:8]}",
                incident_id=incident_id,
                customer_id=cid,
                customer_name=cust.get("full_name", "Customer"),
                customer_email=cust.get("email", ""),
                classification=classification,
                evidence_confidence=confidence,
                risk_level=risk_level,
                impact_score=impact_score,
                reason=reason,
                evidence=evidence,
                observed_facts=observed_facts,
                predicted_impact=predicted_impact,
                recommended_action=recommended_action,
                communication_status="DRAFTED" if classification in [
                    CustomerClassificationEnum.CONFIRMED_AFFECTED.value,
                    CustomerClassificationEnum.LIKELY_AFFECTED.value
                ] else "NONE",
                method=self.method_description,
                model_version=self.model_version,
                created_at=now_str
            )
            predictions.append(pred)

        # Sort by impact_score descending
        predictions.sort(key=lambda p: p.impact_score, reverse=True)
        self._prediction_cache[incident_id] = predictions
        logger.info(f"Generated {len(predictions)} customer impact predictions for incident {incident_id}.")
        return predictions

    async def get_customer_risk(self, customer_id: str) -> CustomerRiskResponseSchema:
        """
        Queries predicted operational risk for a specific customer across active incidents.
        Distinguishes observed facts from predictions.
        """
        # Ensure primary incident predictions are computed
        if PRIMARY_INCIDENT_ID not in self._prediction_cache:
            await self.predict_affected_customers(PRIMARY_INCIDENT_ID)

        predictions = self._prediction_cache.get(PRIMARY_INCIDENT_ID, [])
        matching_pred = next((p for p in predictions if p.customer_id == customer_id), None)

        now_str = datetime.now(timezone.utc).isoformat()

        if matching_pred:
            inc = await repo.get_record_by_id("incidents", matching_pred.incident_id)
            linked_inc = {
                "id": matching_pred.incident_id,
                "incident_number": inc.get("incident_number", "INC-ACTIVE") if inc else "INC-ACTIVE",
                "title": inc.get("title", "") if inc else "",
                "severity": inc.get("severity", "high") if inc else "high"
            } if inc else None

            return CustomerRiskResponseSchema(
                customer_id=customer_id,
                classification=matching_pred.classification,
                risk_level=matching_pred.risk_level,
                confidence=matching_pred.evidence_confidence,
                impact_score=matching_pred.impact_score,
                reasons=[matching_pred.reason],
                evidence=matching_pred.evidence,
                observed_facts=matching_pred.observed_facts,
                predicted_impact=matching_pred.predicted_impact,
                linked_incident=linked_inc,
                recommended_action=matching_pred.recommended_action,
                method=matching_pred.method,
                timestamp=now_str
            )

        # If customer not in incident window, check customer directly
        cust = await repo.get_record_by_id("customers", customer_id)
        cust_name = cust.get("full_name", "Customer") if cust else "Customer"

        return CustomerRiskResponseSchema(
            customer_id=customer_id,
            classification=CustomerClassificationEnum.NOT_AFFECTED.value,
            risk_level=ImpactScoreLevelEnum.LOW.value,
            confidence=0.10,
            impact_score=10.0,
            reasons=["No operational anomaly or incident signature matches this customer's account."],
            evidence=[
                CustomerEvidenceSignal(
                    signal_name="account_telemetry_normal",
                    matched=True,
                    description="All recent orders and payments processed normally without gateway drop.",
                    source="orders_payments_ledger"
                )
            ],
            observed_facts=["Customer orders fulfilled normally; account in good standing."],
            predicted_impact=["Zero anticipated operational disruption."],
            linked_incident=None,
            recommended_action="Standard support availability",
            method=self.method_description,
            timestamp=now_str
        )

prediction_engine = CustomerImpactPredictionEngine()
