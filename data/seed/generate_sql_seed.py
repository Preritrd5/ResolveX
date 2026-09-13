"""
Convert acme_commerce_fixtures.json to supabase/seed.sql
Includes 7 policies, knowledge sources, knowledge chunks, and AI ticket attributes
"""

import json

def sql_quote(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        s = json.dumps(val).replace("'", "''")
        return f"'{s}'::jsonb"
    s = str(val).replace("'", "''")
    return f"'{s}'"

def generate_sql():
    with open("data/fixtures/acme_commerce_fixtures.json", encoding="utf-8") as f:
        data = json.load(f)
        
    lines = [
        "-- ==============================================================================",
        "-- ResolveX Supabase Seed SQL",
        "-- Deterministic Seed Data (seed=42) for Acme Commerce",
        "-- ==============================================================================",
        "BEGIN;",
        ""
    ]
    
    # 1. Organizations
    lines.append("-- Organizations")
    for org in data["organizations"]:
        lines.append(f"INSERT INTO organizations (id, name, slug, tier, settings) VALUES ({sql_quote(org['id'])}, {sql_quote(org['name'])}, {sql_quote(org['slug'])}, {sql_quote(org['tier'])}, {sql_quote(org['settings'])}) ON CONFLICT (slug) DO NOTHING;")
    lines.append("")
    
    # 2. Users
    lines.append("-- Users")
    for u in data["users"]:
        lines.append(f"INSERT INTO users (id, org_id, email, full_name, role, is_active) VALUES ({sql_quote(u['id'])}, {sql_quote(u['org_id'])}, {sql_quote(u['email'])}, {sql_quote(u['full_name'])}, {sql_quote(u['role'])}, {sql_quote(u['is_active'])}) ON CONFLICT (org_id, email) DO NOTHING;")
    lines.append("")
    
    # 3. Products
    lines.append("-- Products")
    for p in data["products"]:
        lines.append(f"INSERT INTO products (id, org_id, sku, name, category, price_cents, currency, is_active) VALUES ({sql_quote(p['id'])}, {sql_quote(p['org_id'])}, {sql_quote(p['sku'])}, {sql_quote(p['name'])}, {sql_quote(p['category'])}, {sql_quote(p['price_cents'])}, {sql_quote(p['currency'])}, {sql_quote(p['is_active'])}) ON CONFLICT (org_id, sku) DO NOTHING;")
    lines.append("")

    # 4. Customers (Sample of first 100 for SQL seed)
    lines.append("-- Customers (Sample of first 100 for SQL seed)")
    for c in data["customers"][:100]:
        lines.append(f"INSERT INTO customers (id, org_id, external_customer_id, email, phone, full_name, status) VALUES ({sql_quote(c['id'])}, {sql_quote(c['org_id'])}, {sql_quote(c['external_customer_id'])}, {sql_quote(c['email'])}, {sql_quote(c['phone'])}, {sql_quote(c['full_name'])}, {sql_quote(c['status'])}) ON CONFLICT (org_id, email) DO NOTHING;")
    lines.append("")

    # 5. Customer Profiles
    lines.append("-- Customer Profiles")
    for cp in data["customer_profiles"][:100]:
        lines.append(f"INSERT INTO customer_profiles (id, org_id, customer_id, lifetime_value_cents, currency, loyalty_tier, total_orders_count, total_tickets_count, churn_risk_score, sentiment_trend) VALUES ({sql_quote(cp['id'])}, {sql_quote(cp['org_id'])}, {sql_quote(cp['customer_id'])}, {sql_quote(cp['lifetime_value_cents'])}, {sql_quote(cp['currency'])}, {sql_quote(cp['loyalty_tier'])}, {sql_quote(cp['total_orders_count'])}, {sql_quote(cp['total_tickets_count'])}, {sql_quote(cp['churn_risk_score'])}, {sql_quote(cp['sentiment_trend'])}) ON CONFLICT (customer_id) DO NOTHING;")
    lines.append("")

    # 6. Service Events
    lines.append("-- Service Events")
    for se in data["service_events"]:
        lines.append(f"INSERT INTO service_events (id, org_id, service_name, event_type, severity, payload, trace_id, created_at) VALUES ({sql_quote(se['id'])}, {sql_quote(se['org_id'])}, {sql_quote(se['service_name'])}, {sql_quote(se['event_type'])}, {sql_quote(se['severity'])}, {sql_quote(se['payload'])}, {sql_quote(se['trace_id'])}, {sql_quote(se['created_at'])}) ON CONFLICT DO NOTHING;")
    lines.append("")

    # 7. Tickets & Messages (First 50 including Cases A through E)
    lines.append("-- Tickets (First 50 with AI attributes)")
    for t in data["tickets"][:50]:
        lines.append(f"INSERT INTO tickets (id, org_id, customer_id, assigned_agent_id, ticket_number, subject, status, priority, intent_category, sentiment_score, is_escalated, ai_confidence, recommended_team, ai_resolvable, complexity, created_at) VALUES ({sql_quote(t['id'])}, {sql_quote(t['org_id'])}, {sql_quote(t['customer_id'])}, {sql_quote(t['assigned_agent_id'])}, {sql_quote(t['ticket_number'])}, {sql_quote(t['subject'])}, {sql_quote(t['status'])}, {sql_quote(t['priority'])}, {sql_quote(t['intent_category'])}, {sql_quote(t['sentiment_score'])}, {sql_quote(t['is_escalated'])}, {sql_quote(t.get('ai_confidence', 0.85))}, {sql_quote(t.get('recommended_team', 'General Triage'))}, {sql_quote(t.get('ai_resolvable', True))}, {sql_quote(t.get('complexity', 'medium'))}, {sql_quote(t['created_at'])}) ON CONFLICT (org_id, ticket_number) DO NOTHING;")
    lines.append("")

    # 8. AI Agents
    lines.append("-- AI Agents")
    for ag in data["agents"]:
        lines.append(f"INSERT INTO agents (id, name, role_description, model_name, is_active) VALUES ({sql_quote(ag['id'])}, {sql_quote(ag['name'])}, {sql_quote(ag['role_description'])}, {sql_quote(ag['model_name'])}, {sql_quote(ag['is_active'])}) ON CONFLICT (name) DO NOTHING;")
    lines.append("")

    # 9. Actions
    lines.append("-- Actions")
    for act in data["actions"]:
        lines.append(f"INSERT INTO actions (id, action_key, description, max_financial_limit_cents, is_reversible) VALUES ({sql_quote(act['id'])}, {sql_quote(act['action_key'])}, {sql_quote(act['description'])}, {sql_quote(act['max_financial_limit_cents'])}, {sql_quote(act['is_reversible'])}) ON CONFLICT (action_key) DO NOTHING;")
    lines.append("")

    # 10. Policy Documents (7 documents)
    lines.append("-- Policy Documents")
    for pol in data["policy_documents"]:
        lines.append(f"INSERT INTO policy_documents (id, org_id, title, category, content_markdown, version, is_active) VALUES ({sql_quote(pol['id'])}, {sql_quote(pol['org_id'])}, {sql_quote(pol['title'])}, {sql_quote(pol['category'])}, {sql_quote(pol['content_markdown'])}, {sql_quote(pol['version'])}, {sql_quote(pol['is_active'])}) ON CONFLICT DO NOTHING;")
    lines.append("")

    # 11. Knowledge Sources & Chunks
    lines.append("-- Knowledge Sources")
    for ks in data.get("knowledge_sources", []):
        lines.append(f"INSERT INTO knowledge_sources (id, org_id, policy_id, source_type, title, chroma_collection_name, total_chunks, last_synced_at) VALUES ({sql_quote(ks['id'])}, {sql_quote(ks['org_id'])}, {sql_quote(ks['policy_id'])}, {sql_quote(ks['source_type'])}, {sql_quote(ks['title'])}, {sql_quote(ks['chroma_collection_name'])}, {sql_quote(ks['total_chunks'])}, {sql_quote(ks['last_synced_at'])}) ON CONFLICT DO NOTHING;")
    lines.append("")

    lines.append("-- Knowledge Chunks")
    for kc in data.get("knowledge_chunks", []):
        lines.append(f"INSERT INTO knowledge_chunks (id, org_id, source_id, policy_id, chunk_index, title, section, content, metadata) VALUES ({sql_quote(kc['id'])}, {sql_quote(kc['org_id'])}, {sql_quote(kc['source_id'])}, {sql_quote(kc['policy_id'])}, {sql_quote(kc['chunk_index'])}, {sql_quote(kc['title'])}, {sql_quote(kc['section'])}, {sql_quote(kc['content'])}, {sql_quote(kc['metadata'])}) ON CONFLICT DO NOTHING;")
    lines.append("")

    lines.append("COMMIT;")
    
    with open("supabase/seed.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("Generated supabase/seed.sql successfully.")

if __name__ == "__main__":
    generate_sql()
