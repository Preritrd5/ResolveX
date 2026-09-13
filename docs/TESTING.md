# ResolveX — Comprehensive Testing & Quality Assurance Strategy
## Unit, Integration, AI Guardrails, and End-to-End Verification

---

### 1. TESTING PHILOSOPHY & TEST PYRAMID

ResolveX combines deterministic software testing (FastAPI, React, Supabase) with AI evaluation methodologies (eval benchmarks, structured schema validation, fallback simulation).

```
          / \
         / E2E \       Playwright: Marcus Vance Flagship Demo Flow
        /-------\
       /   AI    \     LLM Evals, Grounding Checks, Schema Adherence, Fallbacks
      /-----------\
     / Integration \   API Routes, Supabase RLS, Correlation Engine, Escalation
    /---------------\
   /   Unit Tests    \ Pytest & Vitest: Math Scoring, Policy Gates, Zod Schemas
  /-------------------\
```

---

### 2. UNIT TESTING (PYTEST & VITEST)

#### 2.1 Backend Unit Tests (Pytest)
- **Routing & Intent Classification (`test_intent_routing.py`):**
  - Verify keyword and semantic fallback rules map intents correctly without external network calls.
- **Incident Correlation Scoring (`test_correlation_matrix.py`):**
  - Test mathematical formulas for $S_{sem}$, $S_{temp}$, $S_{ent}$, and $S_{tel}$.
  - Verify temporal exponential decay correctly suppresses tickets older than 2 hours.
- **Deterministic Policy Engine (`test_policy_gates.py`):**
  - Verify that a refund proposal of \$50.01 is automatically flagged as `REQUIRES_HUMAN_APPROVAL`.
  - Verify idempotency check rejects duplicate execution attempts with identical keys.
- **Case Context State Machine (`test_case_context.py`):**
  - Test transitions: `INITIALIZED` -> `INVESTIGATING` -> `ACTION_PENDING` -> `RESOLVED`.
  - Validate that unsupplied data fields raise explicit `UNAVAILABLE` errors rather than silent `None` bugs.

#### 2.2 Frontend Unit Tests (Vitest & React Testing Library)
- Test Zod validation schemas for all inbound API payloads.
- Test React Flow custom node components render proper status colors (green, amber, red).
- Test UI error boundaries and loading skeleton states.

---

### 3. INTEGRATION TESTING

- **Ticket Ingestion to Investigation Launch:**
  - Mock Supabase database test container; post ticket payload; verify ticket row created and investigation session initialized.
- **Incident Promotion Flow:**
  - Ingest 3 correlated tickets + 1 service error event in quick succession; verify incident candidate transitions from `SUSPECTED` to `CONFIRMED`.
- **Safe Action Execution:**
  - Propose action, verify policy evaluation gate passes, call mock payment gateway, verify audit record created in `action_executions`.
- **Human Escalation Queue:**
  - Simulate low-confidence agent output ($c = 0.55$); verify ticket is moved to `escalated` status and appears in `/api/escalations`.

---

### 4. AI GUARDRAILS & EVALUATION TESTS

- **Structured Output Conformance:**
  - Test 50 synthetic customer inputs against Gemini structured output mode; verify 100% parse into valid Pydantic models with zero schema errors.
- **Evidence Grounding Verification:**
  - Assert that every finding returned by specialist agents cites at least one valid database ID present in `CaseContext`.
  - Detect and fail any test where an agent references an unverified entity ID (zero hallucination test).
- **Graceful Fallback & Outage Simulation:**
  - Simulate Gemini HTTP 429 (rate limit) and HTTP 500 (outage); verify system switches to deterministic fallback without crashing the user interface.
- **Confidence Calibration Test:**
  - Assert that ambiguous customer text yields confidence $< 0.70$ and clear factual text yields $\ge 0.85$.

---

### 5. END-TO-END (E2E) & DEMO DETERMINISM TESTS

- **Flagship Scenario Automation (Playwright):**
  - Headless browser automated script executing the exact 17 steps of the Marcus Vance story:
    1. Log in as support agent.
    2. Ingest customer chat message: *"Payment was successful but my order is missing"*.
    3. Verify live investigation steps appear in reasoning drawer.
    4. Assert incident `INC-2026-041` is detected on Incident Graph canvas.
    5. Assert blast radius displays 15 affected customers.
    6. Click "Approve Safe Order Recreation".
    7. Verify order creation confirmation badge and updated CX analytics.
- **Demo Seed Determinism Test:**
  - Execute `reset_demo_db.py` twice; assert database diff between runs is exactly zero bytes.

---

### 6. SECURITY & TENANT ISOLATION TESTING

- **Cross-Tenant Leakage Test:**
  - Authenticate User A (Org 1); attempt to read ticket ID belonging to Org 2 via API; assert HTTP 404/403 returned.
- **Service Role Exposure Scan:**
  - Automated CI script scanning client-side build bundles (`.next/static`) to ensure `SUPABASE_SERVICE_ROLE_KEY` is completely absent.
