# ResolveX — UI Information Architecture
## Screen Hierarchy, Workflows, and Data Dependencies

---

### 1. NAVIGATION TAXONOMY & DESIGN SYSTEM OVERVIEW

The ResolveX console is structured around an enterprise SaaS layout with a persistent collapsible left sidebar, an active incident status bar, and contextual sliding inspection drawers.

```
ResolveX Console
├── 1. Overview (/overview)
├── 2. Live Cases (/cases)
├── 3. Incident Intelligence (/incidents)
├── 4. Investigations (/investigations)
├── 5. Customers (/customers)
├── 6. Knowledge & Policies (/knowledge)
├── 7. AI Agents (/agents)
├── 8. Escalations & Approvals (/escalations)
├── 9. CX Analytics (/analytics)
└── 10. Settings (/settings)
```

---

### 2. DETAILED SCREEN SPECIFICATIONS

---

#### 1. Overview (`/overview`)
- **Purpose:** Executive command center providing real-time situational awareness of operational health, active incidents, queue velocity, and autonomous resolution rate.
- **Primary User:** Customer Support Director, VP of Operations, On-Call Engineering Lead.
- **Key Workflows:**
  - View live incident alert banner (e.g., "Active Critical Incident INC-2026-041: Stripe Webhook Dropping Orders").
  - Monitor real-time KPIs: Autonomous Resolution Rate (e.g., 78%), Average MTTR, Total Active Cases.
  - One-click jump to active critical incidents or pending high-value escalations.
- **Required Data:** Summary counts from `incidents`, `tickets`, `investigations`, and aggregate metrics from `cx_metrics`.
- **Why It Exists:** Eliminates fragmented monitoring; allows leadership to verify at a single glance whether customer support is currently impacted by an infrastructure outage.

---

#### 2. Live Cases (`/cases`)
- **Purpose:** Omnichannel support inbox displaying inbound customer tickets with live sentiment badges, intent tags, and real-time autonomous investigation status.
- **Primary User:** Frontline Support Agent, Triage Supervisor.
- **Key Workflows:**
  - Filter tickets by status (`investigating`, `waiting_customer`, `escalated`, `resolved`), priority, and intent.
  - View real-time streaming badge showing whether an AI specialist is currently analyzing the case.
  - Click into ticket detail view (`/cases/[id]`) to view conversation chronology alongside the live agent reasoning drawer.
- **Required Data:** `tickets`, `customers`, `customer_interactions`, `investigations`.
- **Why It Exists:** Enables support staff to track case progression without getting in the way of autonomous background resolution.

---

#### 3. Incident Intelligence (`/incidents`)
- **Purpose:** The crown jewel of ResolveX — a visual intelligence workspace displaying correlated incidents, root-cause timelines, blast radius counts, and an interactive **React Flow** graph canvas.
- **Primary User:** Lead Incident Investigator, Engineering On-Call Lead.
- **Key Workflows:**
  - Inspect the **Ticket-to-Incident Graph Canvas**: Visual nodes connecting customer tickets to systemic service events, shared SKUs, and payment gateway logs.
  - Review blast radius: List of reported vs. unreported customers affected by the incident.
  - Trigger "Batch Proactive Remediation" with 1-click execution (e.g., reprocess dropped webhooks for all 15 victims).
  - Transition incident status (`SUSPECTED` -> `EMERGING` -> `CONFIRMED` -> `RESOLVED`).
- **Required Data:** `incidents`, `incident_tickets`, `incident_customers`, `incident_signals`, `service_events`.
- **Why It Exists:** Directly solves the official hackathon problem by turning isolated tickets into actionable systemic incident intelligence.

---

#### 4. Investigations (`/investigations`)
- **Purpose:** Diagnostic workbench for deep-diving into individual autonomous case investigations.
- **Primary User:** AI Quality Auditor, Tier 2 Support Specialist.
- **Key Workflows:**
  - Step-by-step replay of the Supervisor and specialist reasoning trail (thought process, tool input, tool output, duration).
  - Inspect verified evidence nodes (tamper-evident SHA-256 hashes, source database rows).
  - Inspect confidence calibration curve and conflict reconciliation logs.
- **Required Data:** `investigations`, `investigation_steps`, `evidence`, `agent_findings`.
- **Why It Exists:** Guarantees absolute explainability and transparency into why the AI arrived at a specific conclusion or recommended action.

---

#### 5. Customers (`/customers`)
- **Purpose:** Customer 360 profile portal detailing customer lifetime value, historical orders, past support tickets, and AI churn risk indicators.
- **Primary User:** VIP Account Manager, Customer Success Lead.
- **Key Workflows:**
  - Search customer by email, phone, or external account ID.
  - Review timeline of all historical orders, captured payments, and previous support complaints.
  - View AI-generated churn risk score and suggested retention actions.
- **Required Data:** `customers`, `customer_profiles`, `orders`, `payments`, `churn_signals`.
- **Why It Exists:** Provides holistic context so agents and autonomous systems treat high-value VIP customers with appropriate urgency.

---

#### 6. Knowledge & Policies (`/knowledge`)
- **Purpose:** Enterprise policy repository and semantic vector search explorer.
- **Primary User:** Support Operations Manager, Legal / Compliance Officer.
- **Key Workflows:**
  - Author and edit markdown policy documents (e.g., "Return Policy 2026", "Outage Compensation Guidelines").
  - View ChromaDB vector indexing status and trigger manual chunk re-indexing.
  - Test semantic search queries to preview chunk retrieval and similarity scores.
- **Required Data:** `policy_documents`, `knowledge_sources`, ChromaDB vector collection.
- **Why It Exists:** Ensures that all autonomous decisions are strictly grounded in authoritative, easily auditable enterprise policies.

---

#### 7. AI Agents (`/agents`)
- **Purpose:** Control plane for the fleet of 12 specialized AI reasoning agents.
- **Primary User:** AI Architect, Support Engineering Lead.
- **Key Workflows:**
  - View health status, active execution runs, token consumption, and latency metrics for each agent.
  - Toggle agent autonomy modes (e.g., `Fully Autonomous`, `Require Approval`, `Disabled / Fallback Only`).
  - Configure tool access permissions and confidence thresholds.
- **Required Data:** `agents`, `agent_runs`, system telemetry logs.
- **Why It Exists:** Provides administrative governance and circuit-breaker controls over AI capabilities.

---

#### 8. Escalations & Approvals (`/escalations`)
- **Purpose:** Human-in-the-loop governance inbox for high-risk, consequential, or low-confidence cases.
- **Primary User:** Senior Support Lead, Financial Operations Approver.
- **Key Workflows:**
  - Review structured "Escalation Briefs" prepared by the AI (executive summary, facts, evidence links).
  - One-click action approval/rejection cards (e.g., "Approve \$120 Refund" or "Approve Order Reshipment").
  - Claim an escalated case for direct human intervention with warm transfer history.
- **Required Data:** `escalations`, `escalation_events`, `recommendations`, `tickets`.
- **Why It Exists:** Enforces the strict security rule that AI never mutates high-value transactions without human authorization.

---

#### 9. CX Analytics (`/analytics`)
- **Purpose:** Business intelligence dashboard tracking customer satisfaction trends, SLA compliance, resolution times, and cost savings.
- **Primary User:** Chief Customer Officer, Head of Support.
- **Key Workflows:**
  - Interactive **Recharts** visualizations: MTTR reduction trends, ticket volume vs. incident correlation, sentiment distribution.
  - Analyze repeat ticket rate and churn prevention ROI generated by autonomous resolutions.
  - Export executive CX summary reports.
- **Required Data:** `cx_metrics`, `churn_signals`, `tickets`, `action_executions`.
- **Why It Exists:** Delivers quantitative proof of the business impact of autonomous incident intelligence.

---

#### 10. Settings (`/settings`)
- **Purpose:** Tenant configuration, API credentials, webhook endpoints, and demo simulation controls.
- **Primary User:** System Administrator, Hackathon Presenter.
- **Key Workflows:**
  - Configure Supabase credentials, Gemini API keys, and notification channels (Slack, Email).
  - Toggle **Demo Mode** and trigger the 1-click **Reset Acme Commerce Baseline Data** button.
  - Manage staff users and assign RBAC roles (`customer`, `support_agent`, `lead_investigator`, `admin`).
- **Required Data:** `organizations`, `users`, system environment variables.
- **Why It Exists:** Essential for hackathon demonstration resilience and multi-tenant configuration.
