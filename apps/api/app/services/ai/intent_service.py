"""
ResolveX Intent Understanding Service
Coordinates Gemini 2.0 Flash structured generation with DeterministicFallbackEngine
"""

from typing import List, Dict, Any, Optional
from apps.api.app.domain.schemas import IntentClassification, SentimentAnalysis
from apps.api.app.services.ai.gemini_client import gemini_client
from apps.api.app.services.ai.fallback_engine import fallback_engine
from apps.api.app.core.logging import logger

class IntentService:
    async def classify_ticket_intent(
        self,
        subject: str,
        messages: List[str],
        customer_context: Optional[Dict[str, Any]] = None
    ) -> IntentClassification:
        """
        Classifies ticket intent, urgency, sentiment, and complexity.
        Uses Gemini 2.0 Flash with fallback to DeterministicFallbackEngine.
        """
        # 1. Attempt Gemini structured generation if available
        if gemini_client.is_available:
            prompt = f"""
Analyze the following inbound customer support inquiry for Acme Commerce:

Subject: {subject}
Conversation Messages:
{chr(10).join(f"- {m}" for m in messages)}

Customer Context:
{customer_context or {}}

Determine:
1. intent (one of: 'payment_successful_order_missing', 'delayed_refund', 'subscription_renewal_inquiry', 'account_lockout', 'product_troubleshooting', 'order_management', 'general_inquiry')
2. confidence (0.0 to 1.0)
3. urgency ('low', 'medium', 'high', 'critical')
4. sentiment ('positive', 'neutral', 'frustrated', 'angry')
5. complexity ('low', 'medium', 'high')
6. extracted_entities (dictionary of key facts like amounts, product names, charge IDs)
7. reasoning_summary (1-2 sentence explanation of why this intent was selected)
"""
            try:
                res = await gemini_client.generate_structured(
                    prompt=prompt,
                    response_model=IntentClassification,
                    system_instruction="You are ResolveX Intent Classifier. Output strictly factual, calibrated classifications."
                )
                if res:
                    res.provider = "gemini"
                    return res
            except Exception as e:
                logger.warning(f"Gemini intent classification encountered error: {str(e)}. Using fallback engine.")

        # 2. Deterministic Fallback Engine
        return fallback_engine.classify_intent(subject, messages)

    def analyze_sentiment(self, text: str) -> SentimentAnalysis:
        return fallback_engine.analyze_sentiment(text)

intent_service = IntentService()
