# ResolveX — AGENTS.md
## Autonomous Customer Incident Intelligence

---

### 1. PROJECT PURPOSE & MISSION

**Project Name:** ResolveX — Autonomous Customer Incident Intelligence  
**Hackathon:** Hack Briven — Build Bengaluru 2026  
**Track:** Customer Support  
**Official Problem Statement:**  
> *"Build an autonomous AI customer support system capable of understanding customer intent, investigating issues across multiple data sources, taking appropriate actions, and escalating complex cases to human agents with complete context."*

#### Core Innovation: Ticket-to-Incident Intelligence
Traditional customer support treats customer tickets as isolated, independent events. When an infrastructure failure or operational glitch occurs (e.g., payment gateway webhook timeout, warehouse inventory mismatch), support queues are flooded with dozens or hundreds of tickets expressing distinct customer symptoms ("Where is my order?", "I was charged twice", "Cart checkout error"). Support agents repeatedly investigate symptoms in isolation, leading to redundant work, slow resolution, inconsistent replies, and delayed engineering escalation.

**ResolveX fundamentally changes this paradigm:**
ResolveX investigates customer cases by correlating disparate signals across customer tickets, transaction logs, payment gateway traces, warehouse events, and system telemetry to determine whether individual complaints are symptoms of an underlying systemic operational incident. It autonomously uncovers root causes, predicts blast radius, executes safe remediation, and escalates complex incidents with full contextual evidence to human operators.

---

### 2. ENGINEERING & CODE QUALITY RULES

1. **TypeScript Strict Mode:**
   - Frontend must run with `"strict": true` in `tsconfig.json`.
   - Explicit typing on all function signatures, component props, and API payloads.
   - Zero tolerance for `any` types; use `unknown` with type guards or strict discriminated unions.

2. **Python Typing & Validation:**
   - Python backend must enforce strict typing with Pydantic v2 schemas and type annotations.
   - All API inputs, outputs, and internal agent state transfers must validate through Pydantic models.

3. **Modular Architecture & Separation of Concerns:**
   - Enforce strict layer boundaries: UI -> API Client -> FastAPI Router -> Domain Service -> Data Access Layer / Supabase.
   - AI orchestration must be encapsulated in domain services; API routers must never embed raw LLM prompt strings or inline agent loops.
   - Zero duplicated business logic between frontend and backend.

4. **Secrets & Security Hygiene:**
   - Never commit credentials, private keys, or API tokens to source control.
   - `SUPABASE_SERVICE_ROLE_KEY` is strictly server-side. It must NEVER be exposed to Next.js client bundles or prefixed with `NEXT_PUBLIC_`.
   - Frontend accesses Supabase solely using `NEXT_PUBLIC_SUPABASE_ANON_KEY` protected by Row Level Security (RLS).

5. **Deterministic Logic vs. Heuristics:**
   - Never hardcode production-like business decisions or heuristic magic numbers without domain rationale.
   - Configuration values, thresholds, and feature flags must be driven by environment variables or database-backed configurations.

6. **Structured Logging & Observability:**
   - All backend events, agent invocations, and tool executions must emit structured JSON logs with correlation IDs (`case_id`, `ticket_id`, `incident_id`, `trace_id`).
   - Log levels must be respected (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`).

7. **Error Handling & Resilience:**
   - Standardized API error format:
     ```json
     {
       "error": {
         "code": "RESOURCE_NOT_FOUND",
         "message": "Human-readable explanation",
         "details": {}
       }
     }
     ```
   - All network calls and AI calls must include timeouts, exponential backoff, and circuit breakers.

8. **Preservation & Incremental Modification:**
   - Inspect existing files before modifying.
   - Reuse existing utilities, design tokens, and components rather than recreating parallel implementations.

---

### 3. AI ORCHESTRATION & REASONING RULES

1. **Structured Outputs Only:**
   - Every LLM invocation must return strictly validated structured data (JSON schemas matching Pydantic models).
   - Unstructured conversational output is forbidden inside reasoning pipelines; only customer-facing synthesis or human handoff summaries may be text, and even those must be packaged in structured envelopes.

2. **Grounding & Evidence Attachment:**
   - AI agents must cite concrete evidence for every assertion or hypothesis.
   - Every finding must link to specific entity IDs (e.g., `payment_id: "pay_98234"`, `log_event_id: "evt_4412"`, `timestamp: "2026-09-13T14:22:10Z"`).
   - **Zero Hallucination Tolerance:** Never invent, extrapolate, or fabricate database records, customer orders, or payment states.

3. **Appropriate Model Usage:**
   - Use deterministic logic where sufficient (e.g., checking order status enum, calculating refund window eligibility, verifying signature hashes).
   - Use LLMs strictly where reasoning, classification, unstructured extraction, synthesis, or semantic correlation adds genuine cognitive value.

4. **Confidence Representation:**
   - Every AI agent output must include a calibrated confidence score ($0.0 \le c \le 1.0$) alongside explicit reasoning for why confidence is high, medium, or degraded.
   - Low confidence ($< 0.70$) must automatically trigger fallback heuristics or human escalation.

5. **Graceful Fallbacks & Offline Resilience:**
   - If the Gemini API or LLM provider is unavailable (rate limit, timeout, HTTP 500), the system must fallback to deterministic rule-based triage.
   - The user experience must never crash or display an infinite spinner due to an AI failure.

6. **Shared Case Context Contract:**
   - All specialized reasoning agents must read from and append findings to a canonical, structured `CaseContext`.
   - No agent may independently hallucinate context or make unrecorded state modifications.

7. **Safety Gates for Sensitive Actions:**
   - An LLM must NEVER directly execute database mutations or external actions (e.g., issuing refunds, triggering order reshipment, cancelling subscriptions).
   - The execution pipeline is strictly:
     $$\text{LLM Recommendation} \longrightarrow \text{Schema Validation} \longrightarrow \text{Policy Gate} \longrightarrow \text{RBAC Authorization} \longrightarrow \text{Action Executor} \longrightarrow \text{Audit Log}$$
   - Consequential or high-value actions ($> \$50$ or irreversible status changes) mandate explicit human authorization.

---

### 4. UI & DESIGN SYSTEM RULES

1. **Enterprise SaaS Aesthetic:**
   - Clean, professional, high-density interface inspired by Stripe, Datadog, and Linear.
   - Neutral palette with semantic accents (slate/zinc, indigo/blue primary, emerald for success, amber for suspected/warning, rose for critical incidents).
   - Consistent typographic hierarchy using Inter / Geist Sans with crisp tabular numbers for metrics.

2. **Zero "Fake AI" Gimmicks:**
   - No meaningless pulsing neon gradients, glowing orbs, or fake animated typing effects that waste time.
   - Display real agent reasoning steps, explicit execution timelines, tool calls, and evidence payloads.

3. **High Information Density & Usability:**
   - Maximize screen real estate for incident correlation graphs, customer context, and investigation traces.
   - Support keyboard navigation, quick search, and responsive layout across desktop and laptop viewports.

4. **Meaningful UI States:**
   - Every component must gracefully handle `loading`, `empty`, `partial`, and `error` states.
   - Zero dead buttons, non-functional navigation items, or placeholder "lorem ipsum" text.

---

### 5. DEMO & EVALUATION RULES

1. **Deterministic & Reproducible:**
   - All synthetic demo data (Acme Commerce) must be generated using a fixed random seed (`seed=42`) with reproducible scripts.
   - A single reset command must return the database to the exact starting state for demo evaluation.

2. **Self-Contained Architecture:**
   - The hackathon presentation must not depend on external live enterprise integrations (e.g., live Stripe webhooks or actual Shopify stores).
   - Payment gateways, warehouse management systems, and carrier tracking must be simulated locally with realistic payloads and latency.

3. **Flagship Scenario Guarantee:**
   - The flagship demo scenario ("Payment was successful but my order is missing") must have deterministic mock fallback paths to ensure an airtight live demo under any network condition.
