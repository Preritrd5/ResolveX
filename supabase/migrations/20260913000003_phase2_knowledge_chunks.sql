-- ==============================================================================
-- ResolveX Supabase Database Schema Migration
-- Migration: 20260913000003_phase2_knowledge_chunks.sql
-- Description: Knowledge chunks for RAG and AI intelligence attributes for tickets.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Knowledge Chunks Table
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policy_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    section VARCHAR(150),
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_org ON knowledge_chunks(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_policy ON knowledge_chunks(policy_id);

-- Enable Row Level Security
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Multi-tenant isolation policy
DROP POLICY IF EXISTS "knowledge_chunks_org_isolation" ON knowledge_chunks;
CREATE POLICY "knowledge_chunks_org_isolation" ON knowledge_chunks
    FOR ALL
    USING (
        org_id = current_user_org_id()
        OR current_user_role() = 'service_role'
    );

-- ------------------------------------------------------------------------------
-- 2. Extend Tickets Table with AI Intelligence Fields
-- ------------------------------------------------------------------------------

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2) DEFAULT 0.00;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS recommended_team VARCHAR(100);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ai_resolvable BOOLEAN DEFAULT TRUE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS complexity VARCHAR(20) DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS idx_tickets_org_intent ON tickets(org_id, intent_category);
CREATE INDEX IF NOT EXISTS idx_tickets_org_team ON tickets(org_id, recommended_team);
CREATE INDEX IF NOT EXISTS idx_tickets_org_ai_resolvable ON tickets(org_id, ai_resolvable);
