-- ==============================================================================
-- ResolveX Supabase Row Level Security (RLS) Migration
-- Migration: 20260913000002_rls_policies.sql
-- Description: Multi-tenant organization isolation and RBAC security policies.
-- ==============================================================================

-- Helper function to extract user's current organization
CREATE OR REPLACE FUNCTION current_user_org_id() 
RETURNS UUID AS $$
    SELECT org_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Enable RLS across all domain tables
-- ------------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cx_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_signals ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Multi-Tenant Isolation Policies (Scoped by current_user_org_id())
-- ------------------------------------------------------------------------------

-- Organizations
CREATE POLICY tenant_isolation_organizations ON organizations
    FOR SELECT USING (id = current_user_org_id() OR auth.role() = 'service_role');

-- Users
CREATE POLICY tenant_isolation_users ON users
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

-- Customers & Profiles
CREATE POLICY tenant_isolation_customers ON customers
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_customer_profiles ON customer_profiles
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

-- Tickets & Messages
CREATE POLICY tenant_isolation_tickets ON tickets
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_ticket_messages ON ticket_messages
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

-- Commerce (Products, Orders, Payments, Refunds)
CREATE POLICY tenant_isolation_products ON products
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_orders ON orders
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_order_items ON order_items
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_payments ON payments
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_refunds ON refunds
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_subscriptions ON subscriptions
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

-- Incidents & Intelligence
CREATE POLICY tenant_isolation_incidents ON incidents
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_incident_signals ON incident_signals
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_incident_tickets ON incident_tickets
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_incident_customers ON incident_customers
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

-- Investigations & Findings
CREATE POLICY tenant_isolation_investigations ON investigations
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_investigation_steps ON investigation_steps
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_evidence ON evidence
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_agent_findings ON agent_findings
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

-- Escalations & Governance
CREATE POLICY tenant_isolation_escalations ON escalations
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_action_executions ON action_executions
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

CREATE POLICY tenant_isolation_cx_metrics ON cx_metrics
    FOR ALL USING (org_id = current_user_org_id() OR auth.role() = 'service_role');

-- Global catalog (Agents & Actions) are readable by any authenticated tenant
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_all_agents ON agents FOR SELECT USING (true);

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_all_actions ON actions FOR SELECT USING (true);
