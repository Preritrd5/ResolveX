"""
ResolveX Shared Case Context Contract
Single canonical source of truth for single-case investigation
Adheres to docs/CASE_CONTEXT.md and Phase 2 specifications.
"""

from typing import Optional, List, Dict, Any, Generic, TypeVar
from pydantic import BaseModel, Field, ConfigDict
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
    ServiceEventSchema,
    IntentClassification,
    SentimentAnalysis,
    SpecialistFinding,
    EvidenceItem,
    KnowledgeSnippet,
    RoutingDecision,
    AIResponse
)

T = TypeVar("T")

class DataAvailability(BaseModel, Generic[T]):
    status: str = "AVAILABLE"  # 'AVAILABLE', 'UNAVAILABLE', 'PENDING'
    data: Optional[T] = None
    reason: Optional[str] = None
    fetched_at: Optional[str] = None

class CaseContext(BaseModel):
    """
    Normalized, strongly typed single-case investigation context.
    Strictly forbids hallucinated data: unverified fields must be None or empty.
    """
    model_config = ConfigDict(from_attributes=True)
    
    # Case Identification & Core Ticket
    case_id: str
    ticket: TicketDetailSchema
    customer: CustomerSchema
    customer_profile: Optional[CustomerProfileSchema] = None
    conversation: List[TicketMessageSchema] = []
    
    # Classification & Perception
    intent: Optional[IntentClassification] = None
    urgency: str = "medium"
    sentiment: Optional[SentimentAnalysis] = None
    
    # Commerce & Operational Data
    orders: List[OrderSchema] = []
    payments: List[PaymentSchema] = []
    refunds: List[RefundSchema] = []
    subscriptions: List[SubscriptionSchema] = []
    product_context: List[ProductSchema] = []
    
    # System Telemetry & External Logs
    service_events: List[ServiceEventSchema] = []
    
    # Knowledge & Policy Grounding
    relevant_policies: List[KnowledgeSnippet] = []
    knowledge_context: List[KnowledgeSnippet] = []
    
    # Historical Customer Context
    customer_history: Dict[str, Any] = {}
    previous_tickets: List[Dict[str, Any]] = []
    
    # Single-Case Reasoning & Evidence Trail
    agent_findings: Dict[str, SpecialistFinding] = {}
    evidence: List[EvidenceItem] = []
    overall_confidence: float = 0.0
    
    routing: Optional[RoutingDecision] = None
    suggested_response: Optional[AIResponse] = None
    recommended_next_step: Optional[str] = None
    current_state: str = "assembled"

    @property
    def linked_payment(self) -> Optional[PaymentSchema]:
        if not self.payments:
            return None
        orphaned = [p for p in self.payments if not p.order_id]
        if orphaned:
            return sorted(orphaned, key=lambda p: p.created_at or "", reverse=True)[0]
        return sorted(self.payments, key=lambda p: p.created_at or "", reverse=True)[0]

    @property
    def linked_order(self) -> Optional[OrderSchema]:
        if not self.orders:
            return None
        lp = self.linked_payment
        if lp:
            if not lp.order_id:
                return None
            matching = [o for o in self.orders if o.id == lp.order_id]
            if matching:
                return matching[0]
        return self.orders[0]


