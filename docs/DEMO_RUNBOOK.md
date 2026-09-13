# ResolveX — 90-Second Hackathon Demo Runbook
## Hack Briven — Build Bengaluru 2026 (Customer Support Track)

---

### EXECUTIVE SUMMARY & CORE NARRATIVE

ResolveX fundamentally transforms enterprise customer support from **reactive symptom ticketing** into **autonomous incident intelligence**.

**The Pitch Narrative:**
> *"When Stripe webhook drops occur, support teams are inundated with dozens of customers asking 'Where is my order?'. Traditional support agents investigate each case in isolation. ResolveX correlates disparate customer symptoms into systemic operational incidents, maps blast radius to detect silent victims, executes safe remediation, and escalates complex edge cases with complete contextual evidence."*

---

### TIMELINE & LIVE DEMO SCRIPT (90 SECONDS)

```
[00:00 - 00:15] Executive Overview & Live Telemetry
[00:15 - 00:30] Customer Case & Multi-Agent Investigation
[00:30 - 00:45] Ticket-to-Incident Correlation & Root Cause
[00:45 - 00:60] Predictive Blast Radius & Silent Victims
[00:60 - 00:75] Policy-Governed Autonomous Actions & Escalation Desk
[00:75 - 00:90] CX Intelligence, System Diagnostics & Closing
```

---

#### Step 1 (00:00 - 00:15): The Command Center (`/overview`)
- **Action:** Open `http://localhost:3000/overview`.
- **What to say:**
  > *"Welcome to ResolveX. Right now, Acme Commerce is running with 520 active customers and 315 tickets. Notice the top banner: an Early Warning anomaly has just flagged a +42.9% surge in payment verification failures. Instead of waiting for queues to explode, ResolveX is already tracking the emerging blast radius."*
- **Visual anchors:**
  - Early Warning Anomaly banner with rate surge (`+42.9%`).
  - Metric counters: 42 Predicted Impacted Customers, 18 Autonomous Resolves, 3 Active Escalations.
  - Quick Search bar (`Ctrl+K` / `Cmd+K`).

---

#### Step 2 (00:15 - 00:30): Multi-Agent Investigation (`/cases/tck_acme_1001`)
- **Action:** Click "Cases" in nav or the Guided Demo Strip -> Select Marcus Vance (`TCK-1001`).
- **What to say:**
  > *"Here is customer Marcus Vance: 'Payment deducted via credit card, but order still shows pending in portal.' Our Multi-Agent Orchestrator dispatched specialized agents: Intent, Routing, Payment Specialist, and Policy Evaluator. Notice the confidence score of 0.94 and concrete evidence attachment: Charge `ch_stripe_98234` succeeded in Stripe, but Order `ord_acme_2026_1001` never received the webhook confirmation."*
- **Visual anchors:**
  - Multi-agent execution timeline (Intent, Routing, Specialist, Policy).
  - Concrete Evidence Cards with external Stripe transaction IDs.
  - Linked Systemic Incident badge: `INC-2026-041`.

---

#### Step 3 (00:30 - 00:45): Ticket-to-Incident Correlation (`/incidents/inc_acme_041`)
- **Action:** Click on the incident badge `INC-2026-041` or navigate via "Incidents".
- **What to say:**
  > *"Marcus isn't an isolated case. ResolveX correlated 14 distinct tickets across payment, shipping, and cart categories to Incident INC-2026-041: Stripe Webhook Gateway Timeout. It isolated the exact root cause: AWS us-east-1 webhook endpoint returned HTTP 504. Rather than 14 agents repeating the same diagnosis, ResolveX clustered them in 1.4 seconds."*
- **Visual anchors:**
  - Incident Correlation Graph & Severity level (`P1 - Critical`).
  - Root Cause Analysis card with HTTP 504 trace citations.
  - Financial impact metrics: $2,450 GMV at risk.

---

#### Step 4 (00:45 - 00:60): Predictive Blast Radius (`/incidents/inc_acme_041#blast-radius` & `/proactive`)
- **Action:** Scroll to the Blast Radius tab on the incident, then click "Open Proactive Queue".
- **What to say:**
  > *"Here is the game-changer: ResolveX analyzed transaction telemetry and discovered 42 additional customers who were charged during the webhook drop but HAVE NOT YET FILED A TICKET. They are silent victims. ResolveX generated proactive outreach tasks with drafted multi-channel emails to resolve their orders before they ever complain."*
- **Visual anchors:**
  - Blast radius breakdown (Confirmed: 14, Likely: 28, Potential: 14).
  - Proactive Communication Queue with drafted email/SMS previews and delivery dispatch buttons.

---

#### Step 5 (00:60 - 00:75): Policy Gates & Escalation Desk (`/escalations`)
- **Action:** Click "Escalations" in the top navigation.
- **What to say:**
  > *"ResolveX is governed by strict safety gates. Low-risk actions auto-execute, but any financial concession over $50 or irreversible action requires human authorization. Here is an escalation for an affected VIP customer: full contextual synthesis, root cause citations, and a one-click operator approval button with an immutable audit trail."*
- **Visual anchors:**
  - Escalation cards with urgency badges and AI reasoning synthesis.
  - Safety Policy Gate indicator ($50.00 ceiling).
  - Operator action buttons: "Approve & Execute Resolution" with instant audit logging.

---

#### Step 6 (00:75 - 00:90): CX Intelligence & Clean Demo Reset (`/analytics` & `/settings`)
- **Action:** Click "Analytics" -> then "Settings".
- **What to say:**
  > *"Finally, CX Intelligence: our real-time dashboard tracks resolution rates, repeat contact drop, and service failure trends calculated directly from Supabase. In Settings, our live diagnostic monitor confirms sub-50ms latency across 6 subsystems. And with one click of 'Reset Demo Baseline', the entire database is deterministically restored to seed=42 for the next evaluation."*
- **Visual anchors:**
  - Recharts chronological trend line & service failure pie chart.
  - 6-Component Live System Diagnostics monitor in Settings.
  - One-click Deterministic Demo Reset button.

---

### CRITICAL ENTITY IDENTIFIERS

| Entity | ID / Value | Purpose |
| :--- | :--- | :--- |
| **Flagship Customer** | `Marcus Vance` (`cust_acme_1001`) | Primary demo case actor |
| **Flagship Ticket** | `TCK-1001` (`tck_acme_1001`) | Payment captured, order missing |
| **Flagship Incident** | `INC-2026-041` (`inc_acme_041`) | Payment Gateway Webhook Timeout |
| **Charge ID** | `ch_stripe_98234` | Succeeded payment trace |
| **Order ID** | `ord_acme_2026_1001` | Missing order state |
| **Confidence Score** | `0.94` ($c \ge 0.70$) | Verified high confidence |
| **Random Seed** | `seed=42` | Deterministic reproducibility |

---

### CONTINGENCY & FALLBACK PROCEDURES

1. **Gemini API Rate Limit / Network Outage:**
   - ResolveX contains built-in deterministic heuristic fallbacks in both `agent_service.py` and `gemini_client.py`.
   - If external LLM calls timeout or fail, the system automatically engages rule-based intent classification and specialist findings.
   - The UI displays calibrated confidence scores and never crashes or hangs.

2. **Accidental Database Mutation During Practice:**
   - Click **"Reset Demo Data Baseline"** on the top demo banner or in `/settings`.
   - Or run the CLI command:
     ```bash
     python -m apps.api.scripts.reset_demo_db --seed=42
     ```
   - Restores all 520 customers, 315 tickets, 510 orders, and 525 payments in under 2 seconds.

3. **Global Search (`Ctrl+K` / `Cmd+K`):**
   - Press `Ctrl+K` at any time to demonstrate instant cross-entity searching across tickets, incidents, customers, orders, and payments.
