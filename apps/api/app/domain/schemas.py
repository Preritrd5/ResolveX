"""
ResolveX Domain Schemas & Response Envelopes
Pydantic v2 strict models for all domain entities and REST contracts
"""

from typing import Generic, TypeVar, Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")

# ------------------------------------------------------------------------------
# Standard API Envelopes
# ------------------------------------------------------------------------------

class PaginationMeta(BaseModel):
    page: int = 1
    limit: int = 20
    total: int = 0
    total_pages: int = 0

class ApiResponse(BaseModel, Generic[T]):
    data: T
    meta: Optional[Dict[str, Any]] = None

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None

class ApiErrorResponse(BaseModel):
    error: ErrorDetail

# ------------------------------------------------------------------------------
# Domain Entity Schemas
# ------------------------------------------------------------------------------

class OrganizationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    slug: str
    tier: str = "enterprise"
    settings: Dict[str, Any] = {}

class CustomerProfileSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    customer_id: str
    lifetime_value_cents: int = 0
    currency: str = "USD"
    loyalty_tier: str = "bronze"
    total_orders_count: int = 0
    total_tickets_count: int = 0
    churn_risk_score: float = 0.0
    sentiment_trend: str = "neutral"

class CustomerSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    external_customer_id: Optional[str] = None
    email: str
    phone: Optional[str] = None
    full_name: str
    status: str = "active"
    created_at: Optional[str] = None

class CustomerDetailSchema(CustomerSchema):
    profile: Optional[CustomerProfileSchema] = None
    recent_tickets: List[Dict[str, Any]] = []
    recent_orders: List[Dict[str, Any]] = []
    recent_payments: List[Dict[str, Any]] = []

class ProductSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    sku: str
    name: str
    category: Optional[str] = None
    price_cents: int
    currency: str = "USD"
    is_active: bool = True

class OrderItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    order_id: str
    product_id: str
    product_name: Optional[str] = None
    quantity: int
    unit_price_cents: int
    subtotal_cents: int

class OrderSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    customer_id: str
    customer_name: Optional[str] = None
    order_number: str
    status: str
    total_amount_cents: int
    currency: str = "USD"
    shipping_address: Dict[str, Any] = {}
    fulfillment_center_id: Optional[str] = None
    created_at: Optional[str] = None

class OrderDetailSchema(OrderSchema):
    items: List[OrderItemSchema] = []
    payments: List[Dict[str, Any]] = []

class PaymentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    customer_id: str
    customer_name: Optional[str] = None
    order_id: Optional[str] = None
    gateway_transaction_id: str
    gateway_name: str
    amount_cents: int
    currency: str = "USD"
    status: str
    failure_code: Optional[str] = None
    failure_message: Optional[str] = None
    created_at: Optional[str] = None

class RefundSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    payment_id: str
    order_id: Optional[str] = None
    customer_id: str
    amount_cents: int
    currency: str = "USD"
    status: str
    reason: str
    is_automated: bool = False
    created_at: Optional[str] = None

class TicketMessageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    ticket_id: str
    sender_type: str
    sender_user_id: Optional[str] = None
    content: str
    attachments: List[Any] = []
    metadata: Dict[str, Any] = {}
    created_at: Optional[str] = None

class TicketSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    incident_id: Optional[str] = None
    ticket_number: str
    subject: str
    status: str
    priority: str
    intent_category: Optional[str] = None
    sentiment_score: float = 0.0
    is_escalated: bool = False
    ai_confidence: float = 0.0
    recommended_team: Optional[str] = None
    ai_resolvable: bool = True
    complexity: str = "medium"
    created_at: Optional[str] = None

class TicketDetailSchema(TicketSchema):
    messages: List[TicketMessageSchema] = []
    customer: Optional[CustomerSchema] = None
    customer_profile: Optional[CustomerProfileSchema] = None
    linked_order: Optional[OrderSchema] = None
    linked_payment: Optional[PaymentSchema] = None

class ServiceEventSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    service_name: str
    event_type: str
    severity: str
    payload: Dict[str, Any] = {}
    trace_id: Optional[str] = None
    created_at: Optional[str] = None

class IncidentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    incident_number: str
    title: str
    status: str
    severity: str
    root_cause_hypothesis: Optional[str] = None
    confidence_score: float = 0.0
    impact_estimate_customers: int = 0
    financial_exposure_cents: int = 0
    detected_at: Optional[str] = None

class EscalationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    ticket_id: str
    ticket_number: Optional[str] = None
    customer_name: Optional[str] = None
    escalation_reason: str
    executive_summary: str
    recommended_resolution: Optional[str] = None
    urgency: str
    status: str
    created_at: Optional[str] = None

class AgentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    role_description: str
    model_name: str
    is_active: bool = True

class ActionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    action_key: str
    description: Optional[str] = None
    max_financial_limit_cents: int = 0
    is_reversible: bool = False

class PolicyDocumentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    title: str
    category: str
    content_markdown: str
    version: int = 1
    is_active: bool = True

class OverviewMetricsSchema(BaseModel):
    total_customers: int
    open_cases: int
    investigating_cases: int
    pending_resolution: int
    active_escalations: int
    total_orders: int
    total_revenue_cents: int
    system_status: str
    active_critical_incidents: int
    recent_tickets: List[TicketSchema] = []
    recent_escalations: List[EscalationSchema] = []

# ------------------------------------------------------------------------------
# Phase 2 AI & Single-Case Investigation Schemas
# ------------------------------------------------------------------------------

class SubscriptionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    customer_id: str
    product_id: str
    status: str
    billing_interval: str
    current_period_start: str
    current_period_end: str
    cancel_at_period_end: bool = False
    created_at: Optional[str] = None

class IntentClassification(BaseModel):
    intent: str
    confidence: float = Field(ge=0.0, le=1.0)
    urgency: str = "medium"
    sentiment: str = "neutral"
    complexity: str = "medium"
    extracted_entities: Dict[str, Any] = {}
    provider: str = "gemini"
    reasoning_summary: Optional[str] = None

class SentimentAnalysis(BaseModel):
    polarity: float = Field(ge=-1.0, le=1.0)
    sentiment_label: str = "neutral"
    churn_risk: str = "low"
    distress_markers: List[str] = []

class RoutingDecision(BaseModel):
    recommended_team: str
    recommended_agent: Optional[str] = None
    priority: str = "medium"
    ai_resolvable: bool = True
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)
    provider: str = "hybrid"

class EvidenceItem(BaseModel):
    id: str
    type: str
    source_entity_id: str
    description: str
    timestamp: Optional[str] = None
    relevance_score: float = Field(ge=0.0, le=1.0)
    raw_data: Dict[str, Any] = {}
    sha256_hash: Optional[str] = None

class SpecialistFinding(BaseModel):
    specialist_name: str
    finding_type: str
    status: str = "VERIFIED"
    conclusion: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_refs: List[str] = []
    data: Dict[str, Any] = {}

class KnowledgeSnippet(BaseModel):
    id: str
    source_id: str
    document_title: str
    section: str
    category: str
    content: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    version: int = 1

class AIResponse(BaseModel):
    suggested_response: str
    reasoning_summary: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_ids: List[str] = []
    policy_sources: List[str] = []
    recommended_next_step: str
    provider: str = "gemini"

class InvestigationResult(BaseModel):
    investigation_id: str
    ticket_id: str
    status: str = "completed"
    summary: str
    overall_confidence: float = Field(ge=0.0, le=1.0)
    intent: IntentClassification
    routing: RoutingDecision
    findings: List[SpecialistFinding] = []
    evidence: List[EvidenceItem] = []
    relevant_policies: List[KnowledgeSnippet] = []
    ai_response: Optional[AIResponse] = None
    recommended_next_step: str
    started_at: str
    completed_at: Optional[str] = None
