"""
ResolveX Intelligent Ticket Router
Hybrid routing engine combining intent semantics with deterministic policy mapping
Always provides explicit human-readable justification for team assignment.
"""

from typing import Optional, Dict, Any
from apps.api.app.domain.schemas import RoutingDecision, IntentClassification, SentimentAnalysis
from apps.api.app.services.ai.fallback_engine import fallback_engine

class RouterService:
    def determine_route(
        self,
        intent: IntentClassification,
        sentiment: SentimentAnalysis,
        customer_status: str = "active",
        loyalty_tier: str = "bronze"
    ) -> RoutingDecision:
        """
        Determines the optimal specialist team and priority for a ticket.
        Applies deterministic constraints and explains the rationale.
        """
        # Rule 1: Confidence degradation threshold (< 0.70 triggers human review)
        if intent.confidence < 0.70:
            return RoutingDecision(
                recommended_team="Customer Escalations",
                recommended_agent="Escalation Agent",
                priority="high",
                ai_resolvable=False,
                reason=f"Assigned to Customer Escalations because AI intent classification confidence ({intent.confidence:.2f}) degraded below the 0.70 automated threshold.",
                confidence=intent.confidence,
                provider="hybrid"
            )

        # Rule 2: Critical sentiment / churn threat from VIP or Gold tier
        if loyalty_tier in ["vip", "gold"] and sentiment.churn_risk == "severe":
            return RoutingDecision(
                recommended_team="Customer Escalations",
                recommended_agent="Escalation Agent",
                priority="urgent",
                ai_resolvable=False,
                reason=f"Assigned to Customer Escalations due to high-risk churn signals from a {loyalty_tier.upper()} customer with severe distress.",
                confidence=0.96,
                provider="hybrid"
            )

        # Standard deterministic policy routing
        return fallback_engine.route_ticket(
            intent=intent.intent,
            urgency=intent.urgency,
            sentiment=sentiment,
            complexity=intent.complexity,
            customer_status=customer_status,
            loyalty_tier=loyalty_tier
        )

router_service = RouterService()
