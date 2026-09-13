"""
ResolveX Multi-Signal Correlation Service
Computes cross-customer incident correlation scores across semantic, temporal,
entity, and infrastructure telemetry signals.

Formula: C_ij = 0.25 * S_sem + 0.20 * S_temp + 0.25 * S_ent + 0.30 * S_tel
"""

import math
import re
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from apps.api.app.core.logging import logger


# Domain failure signatures mapping intent / symptoms to telemetry patterns
TELEMETRY_SIGNATURE_MAP = {
    "payment_successful_order_missing": {
        "services": ["payment-webhook-worker", "stripe-connector", "order-ingestion"],
        "event_types": ["redis_enqueue_timeout", "webhook_delivery_timeout", "queue_backpressure"],
        "entities": {"gateway": "stripe"}
    },
    "delayed_refund": {
        "services": ["refund-settlement-cron", "clearinghouse-bridge"],
        "event_types": ["banking_settlement_timeout", "ach_batch_reject"],
        "entities": {"clearinghouse": "ach"}
    },
    "subscription_billing_failed": {
        "services": ["subscription-billing-vault", "vault-rotator"],
        "event_types": ["token_decryption_error", "vault_lock_timeout"],
        "entities": {"vault": "us-east-sub-vault"}
    },
    "hardware_ota_bricked": {
        "services": ["device-firmware-broker", "ota-dispatch"],
        "event_types": ["firmware_ota_failure", "checksum_mismatch"],
        "entities": {"device": "hardware"}
    }
}

class CorrelationService:
    def __init__(self):
        self.w_sem = 0.25
        self.w_temp = 0.20
        self.w_ent = 0.25
        self.w_tel = 0.30
        self.tau = 3600.0  # 1 hour temporal decay constant

    def parse_timestamp(self, ts: Any) -> Optional[datetime]:
        """Safely parse timestamps into UTC datetime objects."""
        if not ts:
            return None
        if isinstance(ts, datetime):
            return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
        try:
            # Handle ISO formats
            clean_ts = str(ts).replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_ts)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None

    def calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic textual similarity.
        Uses normalized word and n-gram overlap vector cosine similarity with 
        domain term weighting for deterministic, reproducible offline accuracy.
        """
        if not text1 or not text2:
            return 0.0

        # Normalize text and replace underscores with spaces
        t1 = text1.lower().replace("_", " ")
        t2 = text2.lower().replace("_", " ")

        # Direct string equality or substring match
        if t1 == t2:
            return 1.0

        # Domain synonym normalization
        synonyms = [
            (r"\bno\s+(confirmation|receipt|order|email|number)\b", "missing"),
            (r"\b(charged|charge|deducted|paid|billing|card|apple pay|apple)\b", "payment"),
            (r"\b(receipt|confirmation email|confirmation|order number)\b", "order"),
            (r"\b(not received|disappeared|failed to arrive|cart error|stuck)\b", "missing"),
            (r"\b(reimbursement|return money)\b", "refund"),
        ]
        for pattern, replacement in synonyms:
            t1 = re.sub(pattern, replacement, t1)
            t2 = re.sub(pattern, replacement, t2)

        # Tokenize words (ignoring punctuation)
        words1 = set(re.findall(r"\b[a-z]{3,}\b", t1))
        words2 = set(re.findall(r"\b[a-z]{3,}\b", t2))

        if not words1 or not words2:
            return 0.0

        # Domain term weights for customer support incident symptoms
        domain_keywords = {
            "payment": 2.5, "order": 2.5, "missing": 3.0,
            "refund": 2.5, "delayed": 2.0, "processing": 1.8, "return": 1.8,
            "subscription": 2.0, "renewal": 1.8, "firmware": 2.5, "bricked": 2.5
        }

        # Weighted Jaccard & Cosine combo
        intersection = words1.intersection(words2)
        union = words1.union(words2)

        weighted_intersection = sum(domain_keywords.get(w, 1.0) for w in intersection)
        weighted_union = sum(domain_keywords.get(w, 1.0) for w in union)

        if weighted_union == 0:
            return 0.0

        jaccard = weighted_intersection / weighted_union

        # Keyword match bonus if both share strong operational failure phrases
        pairs = [
            ({"payment", "order", "missing"}, 0.35),
            ({"payment", "order"}, 0.25),
            ({"payment", "missing"}, 0.25),
            ({"refund", "delayed"}, 0.35),
            ({"refund", "processing"}, 0.25),
            ({"firmware", "bricked"}, 0.35)
        ]

        bonus = 0.0
        for pattern_set, bonus_val in pairs:
            if pattern_set.issubset(words1) and pattern_set.issubset(words2):
                bonus = max(bonus, bonus_val)

        return min(1.0, (jaccard * 0.70) + bonus)


    def calculate_temporal_proximity(self, ts1: Any, ts2: Any) -> float:
        """
        Calculate temporal decay: S_temp = exp(-|t1 - t2| / tau)
        tau = 3600 seconds (1 hour).
        """
        dt1 = self.parse_timestamp(ts1)
        dt2 = self.parse_timestamp(ts2)

        if not dt1 or not dt2:
            return 0.5  # Neutral default if timestamp is missing

        delta_seconds = abs((dt1 - dt2).total_seconds())
        # Exponential decay
        score = math.exp(-delta_seconds / self.tau)
        return max(0.0, min(1.0, score))

    def extract_ticket_entities(self, ticket: Dict[str, Any]) -> Dict[str, Any]:
        """Extract categorical entities from ticket subject, intent, and metadata."""
        entities: Dict[str, Any] = {}
        subject = ticket.get("subject", "").lower()
        intent = ticket.get("intent_category", "")

        entities["intent"] = intent

        # Payment gateways
        if "stripe" in subject or "card" in subject:
            entities["gateway"] = "stripe"
        elif "apple pay" in subject or "apple" in subject:
            entities["gateway"] = "apple_pay"
        elif "paypal" in subject:
            entities["gateway"] = "paypal"

        # Failure symptom type
        if "missing" in subject or "no confirmation" in subject or "cart checkout" in subject:
            entities["failure_type"] = "missing_order_after_payment"
        elif "delayed" in subject or "processing" in subject or "stuck" in subject:
            entities["failure_type"] = "delayed_refund"
        elif "subscription" in subject:
            entities["failure_type"] = "vault_token_error"

        return entities

    def calculate_entity_overlap(self, ent1: Dict[str, Any], ent2: Dict[str, Any]) -> float:
        """Calculate Jaccard overlap on categorical entities."""
        if not ent1 or not ent2:
            return 0.0

        matched_keys = 0.0
        total_keys = len(set(ent1.keys()).union(set(ent2.keys())))

        for k in ["intent", "failure_type", "gateway"]:
            v1 = ent1.get(k)
            v2 = ent2.get(k)
            if v1 and v2:
                if v1 == v2:
                    matched_keys += 1.0
                elif k == "gateway":
                    # Partial match: both are card gateways
                    if set([v1, v2]).issubset({"stripe", "apple_pay"}):
                        matched_keys += 0.6

        return matched_keys / total_keys if total_keys > 0 else 0.0

    def calculate_telemetry_correlation(
        self,
        ticket: Dict[str, Any],
        service_events: List[Dict[str, Any]]
    ) -> Tuple[float, Optional[Dict[str, Any]]]:
        """
        Evaluate correlation with backend service error events.
        Matches failure domain and temporal window.
        """
        if not service_events:
            return 0.0, None

        intent = ticket.get("intent_category", "")
        ticket_time = self.parse_timestamp(ticket.get("created_at"))
        subject = ticket.get("subject", "").lower()

        best_score = 0.0
        best_event: Optional[Dict[str, Any]] = None

        for event in service_events:
            event_service = event.get("service_name", "")
            event_type = event.get("event_type", "")
            event_time = self.parse_timestamp(event.get("created_at"))
            payload = event.get("payload") or {}

            domain_match = 0.0

            # Match 1: Payment Webhook Worker dropping order creations
            if "payment_successful_order_missing" in intent or ("payment" in subject and "missing" in subject):
                if event_service == "payment-webhook-worker" and event_type == "redis_enqueue_timeout":
                    domain_match = 1.0
                elif "webhook" in event_service or "redis" in str(payload).lower():
                    domain_match = 0.8

            # Match 2: Refund settlement cron / banking timeout
            elif "delayed_refund" in intent or ("refund" in subject and "delayed" in subject):
                if event_service == "refund-settlement-cron" and event_type == "banking_settlement_timeout":
                    domain_match = 1.0
                elif "settlement" in event_service:
                    domain_match = 0.8

            # Match 3: Subscription vault token decryption error
            elif "subscription" in intent:
                if event_service == "subscription-billing-vault" and event_type == "token_decryption_error":
                    domain_match = 1.0

            if domain_match > 0:
                # Evaluate time alignment
                time_weight = 1.0
                if ticket_time and event_time:
                    delta_sec = abs((ticket_time - event_time).total_seconds())
                    # Up to 4 hours window for incident impact
                    time_weight = max(0.2, math.exp(-delta_sec / 14400.0))

                candidate_score = domain_match * time_weight
                if candidate_score > best_score:
                    best_score = candidate_score
                    best_event = event

        return round(best_score, 3), best_event

    def compute_pair_correlation(
        self,
        ticket1: Dict[str, Any],
        ticket2: Dict[str, Any],
        service_events: Optional[List[Dict[str, Any]]] = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Compute composite correlation score between two tickets:
        C_ij = 0.25 S_sem + 0.20 S_temp + 0.25 S_ent + 0.30 S_tel
        """
        # 1. Semantic
        text1 = f"{ticket1.get('subject', '')} {ticket1.get('intent_category', '')}"
        text2 = f"{ticket2.get('subject', '')} {ticket2.get('intent_category', '')}"
        s_sem = self.calculate_semantic_similarity(text1, text2)

        # 2. Temporal
        s_temp = self.calculate_temporal_proximity(ticket1.get("created_at"), ticket2.get("created_at"))

        # 3. Entity
        ent1 = self.extract_ticket_entities(ticket1)
        ent2 = self.extract_ticket_entities(ticket2)
        s_ent = self.calculate_entity_overlap(ent1, ent2)

        # 4. Telemetry
        s_tel1, _ = self.calculate_telemetry_correlation(ticket1, service_events or [])
        s_tel2, _ = self.calculate_telemetry_correlation(ticket2, service_events or [])
        s_tel = (s_tel1 + s_tel2) / 2.0

        # Non-incident isolation: if tickets are unrelated or non-systemic
        # e.g., both are general inquiries about completely different topics
        if s_sem < 0.25 and s_ent < 0.25:
            # Drop score to isolate unrelated tickets
            composite = (0.25 * s_sem) + (0.10 * s_temp) + (0.25 * s_ent) + (0.30 * s_tel)
            return round(min(0.35, composite), 3), {
                "semantic": round(s_sem, 3),
                "temporal": round(s_temp, 3),
                "entity": round(s_ent, 3),
                "telemetry": round(s_tel, 3)
            }

        composite = (self.w_sem * s_sem) + (self.w_temp * s_temp) + (self.w_ent * s_ent) + (self.w_tel * s_tel)
        return round(composite, 3), {
            "semantic": round(s_sem, 3),
            "temporal": round(s_temp, 3),
            "entity": round(s_ent, 3),
            "telemetry": round(s_tel, 3)
        }

correlation_service = CorrelationService()
