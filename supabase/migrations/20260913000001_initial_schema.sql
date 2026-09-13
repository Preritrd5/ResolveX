-- ==============================================================================
-- ResolveX Supabase Database Schema Migration
-- Migration: 20260913000001_initial_schema.sql
-- Description: Core 35 domain entities for autonomous customer incident intelligence.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Organizations & Identity
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(50) NOT NULL DEFAULT 'enterprise',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'support_agent', 'lead_investigator', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_org_email UNIQUE (org_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_org_role ON users(org_id, role);

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_customer_id VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    full_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'flagged_for_fraud')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customers_org_email UNIQUE (org_id, email)
);
CREATE INDEX IF NOT EXISTS idx_customers_org_status ON customers(org_id, status);
CREATE INDEX IF NOT EXISTS idx_customers_org_external ON customers(org_id, external_customer_id);

CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID UNIQUE NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    lifetime_value_cents BIGINT NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    loyalty_tier VARCHAR(50) NOT NULL DEFAULT 'bronze' CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'vip')),
    total_orders_count INT NOT NULL DEFAULT 0,
    total_tickets_count INT NOT NULL DEFAULT 0,
    churn_risk_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    sentiment_trend VARCHAR(50) NOT NULL DEFAULT 'neutral',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. Commerce & Catalog
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price_cents INT NOT NULL CHECK (price_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_products_org_sku UNIQUE (org_id, sku)
);
CREATE INDEX IF NOT EXISTS idx_products_org_category ON products(org_id, category);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'failed')),
    total_amount_cents INT NOT NULL CHECK (total_amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    fulfillment_center_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_orders_org_order_number UNIQUE (org_id, order_number)
);
CREATE INDEX IF NOT EXISTS idx_orders_org_customer ON orders(org_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_org_status ON orders(org_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_org_created ON orders(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
    subtotal_cents INT NOT NULL CHECK (subtotal_cents >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    gateway_transaction_id VARCHAR(150) NOT NULL,
    gateway_name VARCHAR(50) NOT NULL CHECK (gateway_name IN ('stripe', 'razorpay', 'paypal', 'adyen', 'mock_gateway')),
    amount_cents INT NOT NULL CHECK (amount_cents >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('initiated', 'authorized', 'captured', 'failed', 'refunded', 'disputed')),
    failure_code VARCHAR(100),
    failure_message TEXT,
    raw_gateway_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_org_gateway_txn ON payments(org_id, gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_customer ON payments(org_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_status ON payments(org_id, status);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('requested', 'pending_approval', 'processing', 'completed', 'failed', 'rejected')),
    reason VARCHAR(255) NOT NULL,
    is_automated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refunds_org_payment ON refunds(org_id, payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_org_status ON refunds(org_id, status);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'past_due', 'paused', 'cancelled', 'expired')),
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'quarterly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_customer ON subscriptions(org_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_status ON subscriptions(org_id, status);

-- ------------------------------------------------------------------------------
-- 3. Telemetry, Events & Knowledge Base
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    trace_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_events_org_service_created ON service_events(org_id, service_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_events_org_severity ON service_events(org_id, severity);

CREATE TABLE IF NOT EXISTS product_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    event_name VARCHAR(100) NOT NULL,
    page_url TEXT,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_events_org_customer ON product_events(org_id, customer_id);

CREATE TABLE IF NOT EXISTS policy_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('refund', 'shipping', 'warranty', 'cancellation', 'escalation')),
    content_markdown TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_policy_docs_org_category ON policy_documents(org_id, category);

CREATE TABLE IF NOT EXISTS knowledge_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policy_documents(id) ON DELETE SET NULL,
    source_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    chroma_collection_name VARCHAR(100) NOT NULL,
    total_chunks INT NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. Incidents & Signals (Ticket-to-Incident Intelligence Foundation)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_investigator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('suspected', 'emerging', 'confirmed', 'resolved', 'dismissed')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    root_cause_hypothesis TEXT,
    confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    impact_estimate_customers INT NOT NULL DEFAULT 0,
    financial_exposure_cents BIGINT NOT NULL DEFAULT 0,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_incidents_org_number UNIQUE (org_id, incident_number)
);
CREATE INDEX IF NOT EXISTS idx_incidents_org_status ON incidents(org_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_org_severity ON incidents(org_id, severity);
CREATE INDEX IF NOT EXISTS idx_incidents_org_detected ON incidents(org_id, detected_at DESC);

CREATE TABLE IF NOT EXISTS incident_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    service_event_id UUID REFERENCES service_events(id) ON DELETE SET NULL,
    signal_type VARCHAR(50) NOT NULL CHECK (signal_type IN ('semantic_cluster', 'temporal_spike', 'service_error_match', 'entity_collision')),
    strength_score NUMERIC(3,2) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_incident_signals_incident ON incident_signals(incident_id);

-- ------------------------------------------------------------------------------
-- 5. Tickets & Interactions
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    ticket_number VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'waiting_customer', 'escalated', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    intent_category VARCHAR(100),
    sentiment_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    is_escalated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tickets_org_number UNIQUE (org_id, ticket_number)
);
CREATE INDEX IF NOT EXISTS idx_tickets_org_status ON tickets(org_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_org_priority ON tickets(org_id, priority);
CREATE INDEX IF NOT EXISTS idx_tickets_org_customer ON tickets(org_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org_incident ON tickets(org_id, incident_id);
CREATE INDEX IF NOT EXISTS idx_tickets_org_created ON tickets(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('customer', 'human_agent', 'ai_assistant', 'system')),
    content TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at ASC);

CREATE TABLE IF NOT EXISTS customer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL CHECK (channel IN ('chat', 'email', 'phone', 'portal', 'api')),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    summary TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customer_interactions_customer ON customer_interactions(customer_id);

CREATE TABLE IF NOT EXISTS incident_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    correlation_score NUMERIC(3,2) NOT NULL,
    relevance_reason TEXT,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_incident_tickets UNIQUE (incident_id, ticket_id)
);

CREATE TABLE IF NOT EXISTS incident_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    has_reported_ticket BOOLEAN NOT NULL DEFAULT FALSE,
    proactive_outreach_status VARCHAR(50) NOT NULL DEFAULT 'none' CHECK (proactive_outreach_status IN ('none', 'queued', 'sent', 'acknowledged')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_incident_customers UNIQUE (incident_id, customer_id)
);

-- ------------------------------------------------------------------------------
-- 6. Autonomous Investigation, Agents & Evidence
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'completed', 'failed', 'paused_for_human')),
    summary TEXT,
    overall_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investigations_org_ticket ON investigations(org_id, ticket_id);

CREATE TABLE IF NOT EXISTS investigation_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    thought_process TEXT,
    tool_name VARCHAR(100),
    tool_input JSONB NOT NULL DEFAULT '{}'::jsonb,
    tool_output JSONB NOT NULL DEFAULT '{}'::jsonb,
    duration_ms INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_investigation_steps_inv ON investigation_steps(investigation_id, step_number ASC);

CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('payment_record', 'order_log', 'service_event', 'policy_rule', 'customer_profile')),
    source_entity_id VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    relevance_score NUMERIC(3,2) NOT NULL,
    sha256_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_investigation ON evidence(investigation_id);

CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    role_description TEXT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
    input_state_hash VARCHAR(64) NOT NULL,
    tokens_used INT NOT NULL DEFAULT 0,
    duration_ms INT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    agent_run_id UUID REFERENCES agent_runs(id) ON DELETE SET NULL,
    finding_type VARCHAR(100) NOT NULL,
    conclusion TEXT NOT NULL,
    confidence NUMERIC(3,2) NOT NULL,
    evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_findings_inv ON agent_findings(investigation_id);

-- ------------------------------------------------------------------------------
-- 7. Recommendations, Actions & Safe Execution
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('recreate_order', 'issue_refund', 'apply_courtesy_credit', 'resend_webhook', 'escalate_human')),
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    justification TEXT NOT NULL,
    estimated_risk VARCHAR(20) NOT NULL CHECK (estimated_risk IN ('low', 'medium', 'high')),
    requires_human_approval BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'executed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recommendations_ticket ON recommendations(ticket_id);

CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_key VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    max_financial_limit_cents INT NOT NULL DEFAULT 0,
    is_reversible BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE RESTRICT,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE RESTRICT,
    executed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    execution_status VARCHAR(50) NOT NULL CHECK (execution_status IN ('success', 'failed', 'rolled_back')),
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    payload_sent JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_received JSONB NOT NULL DEFAULT '{}'::jsonb,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_action_executions_org_ticket ON action_executions(org_id, ticket_id);

-- ------------------------------------------------------------------------------
-- 8. Escalation & Governance
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    investigation_id UUID REFERENCES investigations(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    escalation_reason VARCHAR(100) NOT NULL CHECK (escalation_reason IN ('policy_limit_exceeded', 'low_confidence', 'high_sentiment_distress', 'unconfirmed_incident', 'customer_request')),
    executive_summary TEXT NOT NULL,
    recommended_resolution TEXT,
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('normal', 'urgent', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_escalations_org_status ON escalations(org_id, status);
CREATE INDEX IF NOT EXISTS idx_escalations_org_urgency ON escalations(org_id, urgency);

CREATE TABLE IF NOT EXISTS escalation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    escalation_id UUID NOT NULL REFERENCES escalations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unread',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. CX Analytics & Retention
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cx_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_cases INT NOT NULL DEFAULT 0,
    autonomous_resolutions INT NOT NULL DEFAULT 0,
    human_escalations INT NOT NULL DEFAULT 0,
    average_resolution_time_seconds INT NOT NULL DEFAULT 0,
    incidents_detected INT NOT NULL DEFAULT 0,
    csat_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cx_metrics_org_date UNIQUE (org_id, metric_date)
);

CREATE TABLE IF NOT EXISTS churn_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    risk_score NUMERIC(3,2) NOT NULL,
    primary_driver VARCHAR(100) NOT NULL,
    suggested_retention_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_churn_signals_org_customer ON churn_signals(org_id, customer_id);
