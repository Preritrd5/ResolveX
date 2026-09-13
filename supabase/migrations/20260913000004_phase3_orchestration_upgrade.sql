-- ==============================================================================
-- ResolveX Supabase Database Schema Migration
-- Migration: 20260913000004_phase3_orchestration_upgrade.sql
-- Description: Phase 3 Multi-Agent Orchestration & Investigation Trace Schema Upgrades
-- ==============================================================================

-- 1. Expand investigations status check constraint
DO $$ 
BEGIN
    ALTER TABLE investigations DROP CONSTRAINT IF EXISTS investigations_status_check;
    ALTER TABLE investigations ADD CONSTRAINT investigations_status_check 
        CHECK (status IN ('queued', 'running', 'waiting_for_agent', 'aggregating', 'completed', 'partial', 'failed', 'active', 'paused_for_human'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. Upgrade investigation_steps table with execution metadata & status
ALTER TABLE investigation_steps 
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'skipped')),
    ADD COLUMN IF NOT EXISTS finding_summary TEXT,
    ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS evidence_refs JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS error TEXT;

-- 3. Upgrade agent_runs table with audit & timing columns
ALTER TABLE agent_runs
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS finding_summary TEXT,
    ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS error TEXT,
    ADD COLUMN IF NOT EXISTS evidence_ids JSONB DEFAULT '[]'::jsonb;

-- 4. Upgrade agents table with live execution statistics tracking
ALTER TABLE agents
    ADD COLUMN IF NOT EXISTS total_runs INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS successful_runs INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS failed_runs INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- 5. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_investigation_steps_status ON investigation_steps(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_investigation ON agent_runs(investigation_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id);
