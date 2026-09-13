# ResolveX — Autonomous Customer Incident Intelligence

> **Hack Briven — Build Bengaluru 2026**  
> **Track:** Customer Support  
> **Mission:** Transform reactive, isolated customer support into autonomous, predictive incident intelligence.

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 15](https://img.shields.io/badge/next.js-15-black.svg)](https://nextjs.org/)
[![TypeScript Strict](https://img.shields.io/badge/typescript-strict-blue.svg)](https://www.typescriptlang.org/)
[![Pydantic v2](https://img.shields.io/badge/pydantic-v2-red.svg)](https://docs.pydantic.dev/)
[![Supabase](https://img.shields.io/badge/database-supabase-emerald.svg)](https://supabase.com/)
[![Gemini 2.5](https://img.shields.io/badge/ai-gemini%202.5%20flash-orange.svg)](https://ai.google.dev/)
[![Tests Passing](https://img.shields.io/badge/tests-93%2F93%20passed-brightgreen.svg)]()

---

## 🌟 The Core Innovation: Ticket-to-Incident Intelligence

Traditional customer support treats tickets as isolated, independent events. When an infrastructure failure or operational glitch occurs (e.g., payment gateway webhook timeout, warehouse inventory mismatch), support queues are flooded with dozens or hundreds of tickets reporting distinct customer symptoms (*"Where is my order?"*, *"I was charged twice"*, *"Cart checkout error"*). Support agents repeatedly investigate symptoms in isolation, leading to redundant work, slow resolution, inconsistent replies, and delayed engineering escalation.

**ResolveX fundamentally changes this paradigm:**
ResolveX investigates customer cases by correlating disparate signals across customer tickets, transaction logs, payment gateway traces, warehouse events, and system telemetry to determine whether individual complaints are symptoms of an underlying systemic operational incident. It autonomously uncovers root causes, predicts blast radius to discover uncontacted silent victims, executes safe remediation, and escalates complex incidents with full contextual evidence to human operators.

```
       Disparate Customer Tickets & Symptoms
       [ "Where's my order?" ] [ "Card charged twice" ] [ "Pending in portal" ]
                                   │
                                   ▼
                   ResolveX Multi-Agent Orchestrator
             (Intent, Specialist Investigation, RAG Policies)
                                   │
                                   ▼
                   Ticket-to-Incident Correlation
               (INC-2026-041: Stripe Webhook Dropped)
                                   │
                                   ▼
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
Predictive Blast Radius                             Safe Execution Engine
(42 Silent Victims Identified)                     (Policy Gates & Concession Ceilings)
         │                                                   │
         ▼                                                   ▼
Proactive Customer Outreach                         Human Escalation Desk
(Pre-ticket resolution via email/SMS)              (Contextual Briefs for Consequential Actions)
```

---

## 🚀 Key Capabilities Across the 7 Phases

1. **Autonomous Multi-Agent Investigation:**
   - Specialized agents for Intent, Routing, Payment, Logistics, Policy, and Supervisor synthesis.
   - Grounded evidence attachment linking concrete transaction IDs (`ch_stripe_...`), order states, and webhook logs.
   - Calibrated confidence scores ($0.0 \le c \le 1.0$) with automatic fallback to deterministic rules.

2. **Multi-Signal Incident Correlation:**
   - Clusters disparate tickets into systemic operational incidents using temporal proximity, semantic embeddings, shared entities, and error code telemetry.
   - Interactive incident dependency canvas and root cause isolation.

3. **Predictive Blast Radius & Silent Victim Discovery:**
   - Queries telemetry and order logs to detect customers affected by the incident who **have not yet submitted a ticket**.
   - Classifies victims into Confirmed, Likely, and Potential impact tiers.

4. **Proactive Customer Outreach:**
   - Autonomous queue drafting personalized communication (email, SMS, in-app push) explaining the issue and providing automatic remediation before the customer complains.

5. **Safe Policy-Governed Remediation:**
   - Zero-touch auto-execution for low-risk actions under calibrated thresholds.
   - Hard policy gate requiring supervisor authorization for financial concessions exceeding $50.00.
   - Append-only immutable audit logging (`action_executions`).

6. **CX Intelligence & Command Center:**
   - Real-time resolution rates, repeat contact drop, service failure distributions, and operational volume trends.
   - Organization-scoped global search (`Ctrl+K` / `Cmd+K`) across tickets, incidents, customers, orders, and payments.

7. **Deterministic Evaluation & Demo Rig:**
   - Fully reproducible Acme Commerce evaluation dataset (`seed=42`).
   - One-click demo baseline reset from the web UI or CLI.
   - Guided 8-step interactive demo banner for 90-second presentations.

---

## 🛠️ Architecture & Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript (`strict: true`, zero `any`), Tailwind CSS, Lucide Icons, Recharts.
- **Backend API:** FastAPI (Python 3.11+), Uvicorn, Pydantic v2 schemas, strict type annotations.
- **Data Layer:** Supabase PostgreSQL with Row Level Security (RLS) across 35 tables, server-side-only service role isolation.
- **AI Orchestration:** Google Gemini 2.5 Flash with structured JSON schema outputs + deterministic heuristic fallbacks for offline resilience.
- **Observability:** Structured JSON logging with correlation IDs (`case_id`, `ticket_id`, `incident_id`, `trace_id`).

---

## ⚡ Quickstart & Local Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Git

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Reset database to deterministic demo baseline (seed=42)
python -m apps.api.scripts.reset_demo_db --seed=42

# Start the FastAPI server (Port 8000)
python -m uvicorn apps.api.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# Navigate to web application
cd apps/web

# Install npm packages
npm install

# Run development server (Port 3000)
npm run dev

# Or run optimized production build
npm run build
npm run start -p 3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 90-Second Hackathon Demo Walkthrough

Read the complete second-by-second script in **[docs/DEMO_RUNBOOK.md](./docs/DEMO_RUNBOOK.md)**.

| Step | Time | View | What to Demonstrate |
| :--- | :--- | :--- | :--- |
| **1** | `00:00 - 00:15` | `/overview` | Command Center & emerging early warning banner (+42.9% payment anomaly). |
| **2** | `00:15 - 00:30` | `/cases/tck_acme_1001` | Marcus Vance case, multi-agent reasoning trace, Stripe charge `ch_stripe_98234` evidence. |
| **3** | `00:30 - 00:45` | `/incidents/inc_acme_041` | Incident `INC-2026-041`, 14 correlated tickets, AWS us-east-1 webhook HTTP 504 root cause. |
| **4** | `00:45 - 00:60` | `/incidents/...#blast-radius` | Blast radius tab showing 42 uncontacted silent victims & proactive outreach queue. |
| **5** | `00:60 - 00:75` | `/escalations` | Human Escalation Desk, $50 policy gate, one-click authorization with immutable audit log. |
| **6** | `00:75 - 00:90` | `/analytics` & `/settings` | Real CX metrics, live 6-component system diagnostics, and one-click demo reset (`seed=42`). |

---

## 🧪 Testing & Verification

ResolveX features comprehensive unit and integration testing:
```bash
# Run complete test suite (93/93 passing)
python -m pytest tests apps/api/tests -v

# Run frontend TypeScript typecheck
npm run typecheck --prefix apps/web
```

---

## 🔒 Security & Credential Hygiene

- `SUPABASE_SERVICE_ROLE_KEY` is strictly server-side; never exposed to Next.js client bundles.
- Row-Level Security (RLS) policies isolate multi-tenant data by `organization_id`.
- Consequential mutations traverse strict schema validation, authorization gates, and audit logs.
- Deterministic fallbacks ensure zero downtime even during third-party LLM outages.

---

## 📄 License & Hackathon Attribution

Developed for **Hack Briven — Build Bengaluru 2026** (Customer Support Track).  
All mock data generated for Acme Commerce evaluation with fixed `seed=42`.
