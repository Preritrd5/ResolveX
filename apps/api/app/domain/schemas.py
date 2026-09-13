"""
ResolveX Domain Schemas & Response Envelopes
Pydantic v2 strict models for all domain entities and REST contracts
"""

from typing import Generic, TypeVar, Optional, List, Any, Dict
from enum import Enum
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

class UserRole(str, Enum):
    SUPPORT_AGENT = "support_agent"
    SUPPORT_MANAGER = "support_manager"
    LEAD_INVESTIGATOR = "lead_investigator"
    ADMIN = "admin"

class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    email: str
    full_name: str
    role: str
    is_active: bool = True
    created_at: Optional[str] = None

class UserSessionSchema(BaseModel):
    id: str
    org_id: str
    org_name: str
    email: str
    full_name: str
    role: str
    permissions: List[str] = []
    is_active: bool = True

class OrganizationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    slug: str
    tier: str = "enterprise"
    settings: Dict[str, Any] = {}

class OrganizationDetailSchema(OrganizationSchema):
    users_count: int = 0
    active_incidents_count: int = 0
    open_tickets_count: int = 0
    integrations_count: int = 0

class IntegrationConnectorSchema(BaseModel):
    id: str
    name: str
    category: str
    display_name: str
    description: str
    status: str
    icon: str
    webhook_url: Optional[str] = None
    last_synced_at: Optional[str] = None
    events_processed_count: int = 0
    health_status: str = "healthy"
    config: Dict[str, Any] = {}

class IntegrationEventSchema(BaseModel):
    id: str
    connector_id: str
    event_type: str
    source_system: str
    payload: Dict[str, Any] = {}
    normalized_entity_id: Optional[str] = None
    created_at: str

class IntegrationTestResultSchema(BaseModel):
    connector_id: str
    name: str
    status: str
    latency_ms: float
    message: str
    sample_payload: Dict[str, Any] = {}

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
    resolved_at: Optional[str] = None

class TimelineEventSchema(BaseModel):
    id: str
    event_type: str
    timestamp: str
    title: str
    description: str
    entity_id: Optional[str] = None
    severity: Optional[str] = "info"
    metadata: Dict[str, Any] = {}

class GraphNodeSchema(BaseModel):
    id: str
    type: str = "default"
    position: Dict[str, float]
    data: Dict[str, Any]

class GraphEdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    animated: bool = False
    style: Dict[str, Any] = {}

class IncidentGraphSchema(BaseModel):
    nodes: List[GraphNodeSchema] = []
    edges: List[GraphEdgeSchema] = []

class BlastRadiusSchema(BaseModel):
    reported_customers_count: int = 0
    unreported_customers_count: int = 0
    total_affected_customers: int = 0
    total_financial_exposure_cents: int = 0
    gateways_affected: List[str] = []
    services_affected: List[str] = []

class IncidentExplainabilitySchema(BaseModel):
    summary: str
    why_one_incident: str
    primary_failure_domain: str
    supporting_signals: List[Dict[str, Any]] = []
    confidence_rationale: str

class IncidentDetailSchema(IncidentSchema):
    linked_tickets: List[TicketSchema] = []
    signals: List[Dict[str, Any]] = []
    timeline: List[TimelineEventSchema] = []
    blast_radius: Optional[BlastRadiusSchema] = None
    explainability: Optional[IncidentExplainabilitySchema] = None
    likely_root_cause: Optional[Dict[str, Any]] = None
    confirmed_root_cause: Optional[Dict[str, Any]] = None

class IncidentStatusUpdateSchema(BaseModel):
    status: str
    note: Optional[str] = None

class TicketIncidentCorrelationSchema(BaseModel):
    ticket_id: str
    is_linked: bool = False
    incident_id: Optional[str] = None
    incident_number: Optional[str] = None
    incident_title: Optional[str] = None
    correlation_score: float = 0.0
    incident_status: Optional[str] = None
    incident_severity: Optional[str] = None
    co_affected_count: int = 0
    root_cause_summary: Optional[str] = None

class IncidentDetectionResponseSchema(BaseModel):
    scanned_tickets_count: int
    scanned_events_count: int
    incidents_created_count: int
    incidents_updated_count: int
    incidents: List[IncidentSchema] = []


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
    autonomous_resolutions: int = 0
    assisted_resolutions: int = 0
    pending_approvals: int = 0
    verified_actions: int = 0
    predicted_impacted_customers: int = 0
    active_early_warnings: int = 0
    proactive_support_tasks: int = 0
    recent_tickets: List[TicketSchema] = []
    recent_escalations: List[EscalationSchema] = []

# ------------------------------------------------------------------------------
# Phase 5: Autonomous Resolution & Intelligent Escalation Schemas
# ------------------------------------------------------------------------------

class ActionRegistryItemSchema(BaseModel):
    action_type: str
    name: str
    description: str
    required_permissions: List[str] = []
    risk_level: str  # "LOW", "MEDIUM", "HIGH"
    allowed_conditions: List[str] = []
    required_evidence: List[str] = []
    requires_human_approval: bool = False
    rollback_strategy: str
    verification_strategy: str
    idempotency_strategy: str
    enabled: bool = True

class PolicyCheckResultSchema(BaseModel):
    allowed: bool
    reason: str
    policy_sources: List[str] = []
    required_approval: bool = False
    risk_level: str = "LOW"
    violations: List[str] = []

class ResolutionDecisionSchema(BaseModel):
    decision: str  # "AUTO_RESOLVE", "ASSISTED_RESOLUTION", "ESCALATE", "INSUFFICIENT_INFORMATION"
    recommended_action: Optional[str] = None
    confidence: float = 0.0
    reason: str
    policy_check: PolicyCheckResultSchema
    risk_level: str = "LOW"
    parameters: Dict[str, Any] = {}
    requires_human_approval: bool = False

class ActionExecutionRequestSchema(BaseModel):
    action_type: str
    parameters: Dict[str, Any] = {}
    reason: Optional[str] = None
    dry_run: bool = False

class ActionExecutionResultSchema(BaseModel):
    action_id: str
    action_type: str
    execution_status: str  # "preview", "pending_approval", "success", "failed", "rolled_back"
    verified: bool = False
    verification_message: str
    before_state: Dict[str, Any] = {}
    after_state: Dict[str, Any] = {}
    idempotency_key: str
    executed_at: str
    executed_by: Optional[str] = None
    requires_human_approval: bool = False
    approval_id: Optional[str] = None
    customer_response: Optional[str] = None

class ActionApprovalRequestSchema(BaseModel):
    approved: bool = True
    note: Optional[str] = None
    notes: Optional[str] = None


class HumanHandoffPackageSchema(BaseModel):
    escalation_id: str
    ticket_id: str
    customer_summary: Dict[str, Any]
    issue_summary: str
    detected_intent: str
    investigation_timeline: List[Dict[str, Any]] = []
    evidence: List[Dict[str, Any]] = []
    orders: List[Dict[str, Any]] = []
    payments: List[Dict[str, Any]] = []
    linked_incident: Optional[Dict[str, Any]] = None
    agent_findings: List[Dict[str, Any]] = []
    actions_attempted: List[Dict[str, Any]] = []
    policy_checks: List[Dict[str, Any]] = []
    root_cause_assessment: str
    recommendation: str
    escalation_score: float
    escalation_reasons: List[str] = []

class BulkActionTargetSchema(BaseModel):
    ticket_id: str
    ticket_number: str
    customer_name: str
    is_eligible: bool
    exclusion_reason: Optional[str] = None
    policy_allowed: bool = True
    risk_level: str = "LOW"
    requires_approval: bool = False

class BulkActionEvaluationSchema(BaseModel):
    incident_id: str
    action_type: str
    total_targets: int
    eligible_count: int
    excluded_count: int
    targets: List[BulkActionTargetSchema] = []

class BulkActionExecutionRequestSchema(BaseModel):
    action_type: str
    target_ticket_ids: List[str] = []
    parameters: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None


class BulkActionExecutionResultSchema(BaseModel):
    incident_id: str
    action_type: str
    total_executed: int
    successful_count: int
    failed_count: int
    results: List[ActionExecutionResultSchema] = []


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

class InvestigationStepSchema(BaseModel):
    id: str
    investigation_id: str
    step_number: int
    agent_name: str
    action_type: str
    status: str = "completed"
    finding_summary: Optional[str] = None
    thought_process: Optional[str] = None
    tool_name: Optional[str] = None
    tool_input: Dict[str, Any] = {}
    tool_output: Dict[str, Any] = {}
    confidence: Optional[float] = None
    evidence_refs: List[str] = []
    duration_ms: Optional[int] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error: Optional[str] = None
    created_at: Optional[str] = None

class AgentRunSchema(BaseModel):
    id: str
    investigation_id: str
    agent_id: str
    agent_name: Optional[str] = None
    input_state_hash: str
    tokens_used: int = 0
    duration_ms: Optional[int] = None
    status: str = "completed"
    confidence: Optional[float] = None
    finding_summary: Optional[str] = None
    evidence_ids: List[str] = []
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: Optional[str] = None

class AgentWithStatsSchema(BaseModel):
    id: str
    name: str
    role_description: str
    model_name: str
    is_active: bool = True
    total_runs: int = 0
    successful_runs: int = 0
    failed_runs: int = 0
    last_run_at: Optional[str] = None
    latest_run: Optional[AgentRunSchema] = None

class SupervisorDecision(BaseModel):
    selected_specialists: List[str]
    reason: str
    confidence: float = Field(ge=0.0, le=1.0)
    required_context: List[str] = []

class InvestigationResult(BaseModel):
    investigation_id: str
    ticket_id: str
    status: str = "completed"
    summary: str
    overall_confidence: float = Field(ge=0.0, le=1.0)
    intent: IntentClassification
    routing: RoutingDecision
    supervisor_decision: Optional[SupervisorDecision] = None
    findings: List[SpecialistFinding] = []
    evidence: List[EvidenceItem] = []
    relevant_policies: List[KnowledgeSnippet] = []
    investigation_steps: List[InvestigationStepSchema] = []
    agent_runs: List[AgentRunSchema] = []
    ai_response: Optional[AIResponse] = None
    recommended_next_step: str
    started_at: str
    completed_at: Optional[str] = None
    trace_metadata: Dict[str, Any] = {}


# ------------------------------------------------------------------------------
# Phase 6: Predictive & Proactive Customer Intelligence Schemas
# ------------------------------------------------------------------------------

class CustomerClassificationEnum(str, Enum):
    CONFIRMED_AFFECTED = "CONFIRMED_AFFECTED"
    LIKELY_AFFECTED = "LIKELY_AFFECTED"
    POTENTIALLY_AFFECTED = "POTENTIALLY_AFFECTED"
    NOT_AFFECTED = "NOT_AFFECTED"

class ImpactScoreLevelEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class EarlyWarningStatusEnum(str, Enum):
    NEW = "NEW"
    INVESTIGATING = "INVESTIGATING"
    LINKED_TO_INCIDENT = "LINKED_TO_INCIDENT"
    DISMISSED = "DISMISSED"
    RESOLVED = "RESOLVED"

class ProactivePolicyStatusEnum(str, Enum):
    ALLOW = "ALLOW"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    BLOCK = "BLOCK"

class ProactiveNotificationStatusEnum(str, Enum):
    DRAFTED = "DRAFTED"
    APPROVED = "APPROVED"
    SENT = "SENT"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class CustomerEvidenceSignal(BaseModel):
    signal_name: str
    matched: bool
    description: str
    source: str = "operational_telemetry"
    timestamp: Optional[str] = None

class CustomerImpactPredictionSchema(BaseModel):
    id: str
    incident_id: str
    customer_id: str
    customer_name: str
    customer_email: str
    classification: str  # CONFIRMED_AFFECTED, LIKELY_AFFECTED, POTENTIALLY_AFFECTED, NOT_AFFECTED
    evidence_confidence: float = Field(ge=0.0, le=1.0)
    risk_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    impact_score: float
    reason: str
    evidence: List[CustomerEvidenceSignal] = []
    observed_facts: List[str] = []
    predicted_impact: List[str] = []
    recommended_action: str
    communication_status: str = "DRAFTED"
    method: str = "rule_based_incident_pattern_match"
    model_version: str = "1.0"
    created_at: str

class EarlyWarningSchema(BaseModel):
    id: str
    organization_id: str
    warning_type: str
    affected_service: str
    affected_product: Optional[str] = None
    severity: str  # critical, high, medium, low
    signal_count: int
    baseline_rate: float
    current_rate: float
    change_percentage: float
    anomaly_score: float
    confidence: str  # HIGH, MEDIUM, LOW
    reason: str
    evidence: List[Dict[str, Any]] = []
    status: str = "NEW"  # NEW, INVESTIGATING, LINKED_TO_INCIDENT, DISMISSED, RESOLVED
    created_at: str
    linked_incident_id: Optional[str] = None

class ImpactTrendPointSchema(BaseModel):
    timestamp: str
    affected_customers: int
    related_tickets: int
    impacted_transactions: int

class ImpactForecastSchema(BaseModel):
    has_sufficient_data: bool
    current_affected: int
    estimated_near_term_low: Optional[int] = None
    estimated_near_term_high: Optional[int] = None
    horizon_minutes: int = 30
    confidence: str = "MEDIUM"
    method: str = "linear_velocity_extrapolation"
    assumptions: List[str] = []
    notice: Optional[str] = None

class SupportLoadEstimateSchema(BaseModel):
    has_sufficient_data: bool
    current_ticket_rate_per_hour: float
    baseline_ticket_rate_per_hour: float
    projected_tickets_next_hour: Optional[int] = None
    method: str = "rate_ratio_projection"
    confidence: str = "MEDIUM"
    assumptions: List[str] = []
    notice: Optional[str] = None

class ProactiveRecommendationSchema(BaseModel):
    id: str
    incident_id: str
    customer_id: str
    customer_name: str
    action_type: str
    target: str
    reason: str
    evidence_summary: str
    confidence: float
    policy_status: str  # ALLOW, REQUIRE_APPROVAL, BLOCK
    policy_reason: str
    status: str = "DRAFTED"  # DRAFTED, APPROVED, SENT, FAILED, CANCELLED
    suggested_message: Optional[str] = None
    recommended_timing: str = "immediate"
    created_at: str

class PredictionFeedbackMetricsSchema(BaseModel):
    predictions_generated: int = 0
    confirmed_predictions: int = 0
    likely_predictions: int = 0
    evaluated_predictions: int = 0
    precision: Optional[float] = None
    recall: Optional[float] = None
    false_positives: int = 0
    false_negatives: int = 0
    proactive_recommendations_count: int = 0
    proactive_sent_count: int = 0
    status_message: str = "Not enough evaluated outcomes to calculate prediction accuracy."

class CustomerRiskResponseSchema(BaseModel):
    customer_id: str
    classification: str
    risk_level: str
    confidence: float
    impact_score: float
    reasons: List[str] = []
    evidence: List[CustomerEvidenceSignal] = []
    observed_facts: List[str] = []
    predicted_impact: List[str] = []
    linked_incident: Optional[Dict[str, Any]] = None
    recommended_action: Optional[str] = None
    method: str = "rule_based_incident_pattern_match"
    timestamp: str

class IncidentImpactOverviewSchema(BaseModel):
    incident_id: str
    incident_number: str
    title: str
    severity: str
    status: str
    total_predicted_customers: int
    confirmed_affected_count: int
    likely_affected_count: int
    potentially_affected_count: int
    not_affected_count: int
    predictions: List[CustomerImpactPredictionSchema] = []
    trend: List[ImpactTrendPointSchema] = []
    forecast: ImpactForecastSchema
    support_load: SupportLoadEstimateSchema
    recommendations: List[ProactiveRecommendationSchema] = []

# ============================================================
# PHASE 7 — FINAL CX INTELLIGENCE & HACKATHON POLISH SCHEMAS
# ============================================================

class CategoryCountSchema(BaseModel):
    category: str
    count: int
    percentage: float = 0.0

class CXTrendPointSchema(BaseModel):
    timestamp: str
    date_label: str
    tickets_created: int
    tickets_resolved: int
    incidents_active: int
    escalations_count: int

class AdvancedCXAnalyticsSchema(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    resolution_rate_percentage: float
    avg_resolution_time_minutes: Optional[float] = None
    avg_resolution_time_notice: Optional[str] = None
    escalation_rate_percentage: float
    autonomous_resolution_rate_percentage: float
    assisted_resolution_rate_percentage: float
    repeat_contact_rate_percentage: float
    total_customers: int
    total_orders: int
    total_revenue_cents: int
    active_incidents_count: int
    intent_distribution: List[CategoryCountSchema] = []
    service_failure_distribution: List[CategoryCountSchema] = []
    resolution_breakdown: Dict[str, int] = {}
    escalation_breakdown: Dict[str, Any] = {}
    proactive_funnel: Dict[str, int] = {}
    trends: List[CXTrendPointSchema] = []
    top_incidents: List[Dict[str, Any]] = []

class GlobalSearchResultSchema(BaseModel):
    query: str
    total_results: int
    customers: List[Dict[str, Any]] = []
    tickets: List[Dict[str, Any]] = []
    incidents: List[Dict[str, Any]] = []
    orders: List[Dict[str, Any]] = []
    payments: List[Dict[str, Any]] = []

class DemoResetResponseSchema(BaseModel):
    success: bool
    message: str
    seed: int
    reset_at: str
    records_restored: Dict[str, int]

class DemoStatusSchema(BaseModel):
    demo_mode: bool = True
    organization_id: str
    organization_name: str
    seed: int = 42
    flagship_incident_id: str
    flagship_incident_number: str
    flagship_case_id: str
    flagship_case_number: str
    flagship_customer_name: str
    recommended_flow: List[Dict[str, str]] = []

class SystemComponentHealth(BaseModel):
    status: str
    latency_ms: float
    details: Dict[str, Any] = {}

class SystemHealthDetailedSchema(BaseModel):
    status: str
    timestamp: str
    components: Dict[str, SystemComponentHealth]

# ------------------------------------------------------------------------------
# Customer Public Intake Schemas
# ------------------------------------------------------------------------------

class CustomerSupportIntakeRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=255)
    order_id: Optional[str] = Field(None, max_length=50)
    subject: Optional[str] = Field(None, max_length=200)
    message: str = Field(..., min_length=10, max_length=3000)
    category: Optional[str] = Field("general", max_length=50)

class CustomerSupportIntakeResponse(BaseModel):
    ticket_id: str
    ticket_number: str
    subject: str
    status: str
    customer_name: str
    customer_email: str
    created_at: str
    confirmation_code: str
    message: str




