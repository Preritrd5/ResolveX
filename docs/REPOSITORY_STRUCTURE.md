# ResolveX — Repository Structure Specification
## Monorepo Layout, Ownership Boundaries, and Dependency Flow

---

### 1. DIRECTORY TREE

```
😎_ResolveX_😎/
├── .env.example                     # Environment template (Frontend, Backend, AI)
├── AGENTS.md                        # Root project governance and engineering rules
├── README.md                        # Project introduction & Hackathon quickstart
│
├── apps/
│   ├── web/                         # Next.js 15 App Router Frontend
│   │   ├── app/                     # Routes: (auth), (dashboard), api proxy
│   │   │   ├── (dashboard)/
│   │   │   │   ├── overview/
│   │   │   │   ├── cases/
│   │   │   │   ├── incidents/
│   │   │   │   ├── investigations/
│   │   │   │   ├── customers/
│   │   │   │   ├── knowledge/
│   │   │   │   ├── agents/
│   │   │   │   ├── escalations/
│   │   │   │   ├── analytics/
│   │   │   │   └── settings/
│   │   ├── components/              # UI components (shadcn/ui, React Flow canvas, Recharts)
│   │   ├── hooks/                   # Custom React hooks & TanStack Query mutations
│   │   ├── lib/                     # Supabase client (anon), API client, utility functions
│   │   └── package.json
│   │
│   └── api/                         # FastAPI Backend (Python 3.13)
│       ├── app/
│       │   ├── api/v1/              # API Routers (tickets, incidents, customers, actions)
│       │   ├── core/                # Config, Supabase client (service role), logging
│       │   ├── domain/              # Domain entities, value objects, pure business rules
│       │   ├── services/            # Case orchestration, correlation engine, action executor
│       │   ├── repositories/        # Database access abstractions
│       │   └── main.py              # FastAPI application entrypoint
│       ├── requirements.txt         # FastAPI, pydantic, supabase, langchain, langgraph
│       └── scripts/                 # CLI utility scripts (db reset, fixture seed)
│
├── packages/
│   ├── types/                       # Shared TypeScript interfaces for API & CaseContext
│   │   └── src/
│   └── shared-schemas/              # Pydantic & JSON Schema definitions matching types
│
├── ai/
│   ├── agents/                      # 12 Specialist Agent definitions & logic
│   ├── workflows/                   # LangGraph state graph definitions
│   ├── tools/                       # Reusable agent tool definitions
│   ├── prompts/                     # System prompts & few-shot examples
│   └── schemas/                     # Pydantic input/output schemas for agents
│
├── data/
│   ├── fixtures/                    # Deterministic JSON fixtures for Acme Commerce
│   └── seed/                        # Idempotent Python & SQL seed scripts (seed=42)
│
├── supabase/
│   ├── migrations/                  # Versioned PostgreSQL schema migrations
│   └── seed.sql                     # Base SQL seed for local / remote Supabase
│
└── docs/                            # Comprehensive Phase 0 Architectural Specifications
    ├── ARCHITECTURE.md              # System overview, layer boundaries, data flow
    ├── DOMAIN_MODEL.md              # Conceptual schema for all 34 domain entities
    ├── CASE_CONTEXT.md              # Shared Case Context contract & state machine
    ├── AI_ORCHESTRATION.md          # 12 Specialist agents & Supervisor specs
    ├── INCIDENT_INTELLIGENCE.md     # Multi-signal correlation engine & blast radius
    ├── DEMO_DATA.md                 # Acme Commerce synthetic dataset strategy
    ├── DEMO_SCENARIO.md             # Flagship 17-step Marcus Vance walkthrough
    ├── UI_INFORMATION_ARCHITECTURE.md# 10 Screen specifications & user workflows
    ├── API_BOUNDARIES.md            # REST API endpoints & payload envelopes
    ├── SECURITY.md                  # RLS, service-role isolation & safe AI actions
    ├── TESTING.md                   # Unit, integration, AI evals & Playwright E2E
    └── REPOSITORY_STRUCTURE.md      # This file
```

---

### 2. OWNERSHIP & DEPENDENCY DIRECTION

```
[apps/web (Frontend)] ─────────► [packages/types]
       │                               ▲
       ▼                               │
[apps/api (Backend)] ──────────► [packages/shared-schemas]
       │
       ├───► [ai/* (Orchestration & Agents)]
       ├───► [data/* (Fixtures & Seeds)]
       └───► [supabase/* (Database & Migrations)]
```

- **Strict Downward Dependency:** `apps/web` depends on `packages/types`. It never imports directly from `apps/api` or `ai/`.
- **Backend Domain Independence:** `apps/api/app/domain` has zero dependencies on external HTTP frameworks or AI models; it contains pure business rules and data models.
- **AI Layer Modularity:** `ai/` contains reasoning logic and prompt templates that consume `CaseContext` schemas.
- **Zero Circular Dependencies:** Python modules and TypeScript packages are strictly structured to prevent circular imports.
