# ResolveX — Autonomous Customer Incident Intelligence

> **Hack Briven — Build Bengaluru 2026**  
> **Track:** Customer Support  
> **Mission:** Transform reactive, isolated customer support into proactive, systemic incident intelligence.

---

## 🌟 The Core Innovation: Ticket-to-Incident Intelligence

Traditional customer support treats tickets independently. When an infrastructure or operational failure occurs, support queues are flooded with dozens or hundreds of tickets reporting symptoms of the exact same root cause.

**ResolveX** connects the dots:
- **Understands Customer Intent** with calibrated confidence and emotional distress signals.
- **Investigates Across Disparate Data Sources** (payments, order management, warehouse events, backend telemetry).
- **Correlates Multiple Signals** (semantic similarity, temporal proximity, shared entities, service error events) into cohesive systemic incidents.
- **Predicts Blast Radius** to proactively identify uncontacted customers who were affected before they even submit a ticket.
- **Executes Safe Remediation** through deterministic policy gates and human-in-the-loop authorization.
- **Escalates Complex Cases** with complete diagnostic briefs and one-click action recommendations.

---

## 📚 Phase 0 Architectural Documentation

This repository contains the complete Phase 0 architectural foundation:

| Specification Document | Purpose |
| :--- | :--- |
| **[AGENTS.md](./AGENTS.md)** | Root governance, engineering rules, AI contracts, UI rules, and demo standards |
| **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | High-level system architecture, layered boundaries, and technology stack |
| **[docs/DOMAIN_MODEL.md](./docs/DOMAIN_MODEL.md)** | Conceptual schema for all 34 domain entities and relational map |
| **[docs/CASE_CONTEXT.md](./docs/CASE_CONTEXT.md)** | Canonical `CaseContext` schema, state machine, and anti-hallucination rules |
| **[docs/AI_ORCHESTRATION.md](./docs/AI_ORCHESTRATION.md)** | 12 Specialist Reasoning Agents and LangGraph Supervisor workflow |
| **[docs/INCIDENT_INTELLIGENCE.md](./docs/INCIDENT_INTELLIGENCE.md)** | Multi-signal correlation mathematical formulas, evidence tiers, and lifecycle |
| **[docs/DEMO_DATA.md](./docs/DEMO_DATA.md)** | Acme Commerce simulation, 3 evidence-grounded incidents, and seed strategy |
| **[docs/DEMO_SCENARIO.md](./docs/DEMO_SCENARIO.md)** | Flagship 17-step Marcus Vance walkthrough and judge "wow" moments |
| **[docs/UI_INFORMATION_ARCHITECTURE.md](./docs/UI_INFORMATION_ARCHITECTURE.md)** | 10 Primary application screens, workflows, and data dependencies |
| **[docs/API_BOUNDARIES.md](./docs/API_BOUNDARIES.md)** | RESTful API endpoints, request/response envelopes, and error formats |
| **[docs/SECURITY.md](./docs/SECURITY.md)** | Supabase Auth, RLS, service-role isolation, RBAC, and safe action execution |
| **[docs/TESTING.md](./docs/TESTING.md)** | Unit, integration, AI guardrails, Playwright E2E, and tenant isolation tests |
| **[docs/REPOSITORY_STRUCTURE.md](./docs/REPOSITORY_STRUCTURE.md)** | Monorepo layout, ownership boundaries, and dependency flow |
| **[.env.example](./.env.example)** | Environment variable template and configuration guide |

---

## 🚦 Phase Boundary Enforcement

- **Phase 0:** Architecture, Domain Contracts, Specifications, and Governance (**COMPLETE**).
- **Phase 1:** Core Data Models, Supabase Schema Migrations, Synthetic Acme Commerce Seed, FastAPI Base CRUD & Auth Middleware, Next.js Base App Shell.
- **Phase 2:** Shared Case Context Runtime, Core AI Specialist Agents & LangGraph Supervisor.
- **Phase 3:** Ticket-to-Incident Intelligence Engine, Multi-Signal Correlation Matrix, Incident Graph Canvas.
- **Phase 4:** Autonomous Resolution Engine, Safe Action Execution Pipeline, Escalation Center & CX Analytics.
