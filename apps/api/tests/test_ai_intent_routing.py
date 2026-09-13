"""
Tests for AI Intent Understanding & Intelligent Routing
Verifies intent classification, sentiment analysis, deterministic fallback, and routing justification.
"""

import pytest
from apps.api.app.services.ai.intent_service import intent_service
from apps.api.app.services.ai.router_service import router_service
from apps.api.app.domain.schemas import IntentClassification, SentimentAnalysis

@pytest.mark.anyio
async def test_intent_classification_payment_missing():
    subj = "Payment was successful but my order is missing"
    msgs = ["My bank says $49.99 was charged by Acme, but my orders page is empty!"]
    
    intent = await intent_service.classify_ticket_intent(subj, msgs)
    assert intent.intent == "payment_successful_order_missing"
    assert intent.confidence >= 0.90
    assert intent.urgency == "high"
    assert intent.provider in ["gemini", "deterministic_fallback"]

@pytest.mark.anyio
async def test_intent_classification_delayed_refund():
    subj = "Where is my refund for returned item?"
    msgs = ["The tracking says returned headphones arrived 8 days ago, refund still stuck on processing."]
    
    intent = await intent_service.classify_ticket_intent(subj, msgs)
    assert intent.intent == "delayed_refund"
    assert intent.confidence >= 0.88

@pytest.mark.anyio
async def test_sentiment_distress_detection():
    text = "This is ridiculous, money left my account urgently and your app is empty, I will dispute this chargeback!"
    sentiment = intent_service.analyze_sentiment(text)
    assert sentiment.polarity < 0.0
    assert sentiment.churn_risk in ["elevated", "severe"]
    assert len(sentiment.distress_markers) >= 2

def test_routing_billing_justification():
    intent = IntentClassification(
        intent="payment_successful_order_missing",
        confidence=0.94,
        urgency="high",
        sentiment="frustrated",
        complexity="medium",
        provider="deterministic_fallback"
    )
    sentiment = SentimentAnalysis(polarity=-0.6, sentiment_label="frustrated", churn_risk="elevated")
    
    route = router_service.determine_route(intent, sentiment, customer_status="active", loyalty_tier="vip")
    assert route.recommended_team == "Billing"
    assert "transaction" in route.reason.lower() or "billing" in route.reason.lower()
    assert route.ai_resolvable is True

def test_routing_low_confidence_escalation():
    intent = IntentClassification(
        intent="general_inquiry",
        confidence=0.62, # Low confidence degraded below 0.70
        urgency="medium",
        sentiment="neutral",
        complexity="medium"
    )
    sentiment = SentimentAnalysis(polarity=0.0, sentiment_label="neutral", churn_risk="low")
    
    route = router_service.determine_route(intent, sentiment)
    assert route.recommended_team == "Customer Escalations"
    assert route.ai_resolvable is False
    assert "degraded below" in route.reason
