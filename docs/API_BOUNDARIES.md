# ResolveX — API Boundaries & Contracts Specification
## RESTful Endpoints, Envelopes, and Schemas

---

### 1. STANDARD API PROTOCOLS & ENVELOPES

All ResolveX API endpoints strictly adhere to uniform JSON envelope formatting, JWT authentication, and tenant organization scoping.

#### 1.1 Success Response Envelope
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total_records": 105,
    "timestamp": "2026-09-13T14:25:00Z"
  }
}
```

#### 1.2 Error Response Envelope
```json
{
  "error": {
    "code": "POLICY_LIMIT_EXCEEDED",
    "message": "Automated refund of $120.00 exceeds the $50.00 autonomous safety limit.",
    "details": {
      "requested_amount_cents": 12000,
      "max_allowed_cents": 5000,
      "policy_id": "pol_refund_standard_2026"
    }
  }
}
```

#### 1.3 Standard HTTP Status Codes:
- `200 OK`: Successful retrieval or synchronous operation.
- `201 Created`: Resource successfully created.
- `202 Accepted`: Asynchronous task / agent investigation initiated.
- `400 Bad Request`: Payload failed Pydantic schema validation.
- `401 Unauthorized`: Missing or expired Supabase JWT token.
- `403 Forbidden`: User role lacks required permission (RBAC).
- `404 Not Found`: Target resource does not exist in tenant organization.
- `409 Conflict`: Concurrent modification or duplicate idempotency key.
- `422 Unprocessable Entity`: Semantic business logic validation failure.
- `500 Internal Server Error`: Unhandled system exception.

---

### 2. CORE RESTFUL BOUNDARIES

---

#### 2.1 Health & System Diagnostics
- `GET /api/health`
  - **Purpose:** Liveness probe for containers and monitoring services.
  - **Auth:** Public.
  - **Response:** `{"status": "healthy", "database": "connected", "vector_store": "ready"}`
- `GET /api/version`
  - **Purpose:** System build version and commit hash.
  - **Auth:** Public.

---

#### 2.2 Customer 360
- `GET /api/customers`
  - **Query Params:** `query` (search string), `loyalty_tier`, `page`, `limit`.
  - **Auth:** `support_agent` or higher.
- `GET /api/customers/{id}`
  - **Purpose:** Comprehensive customer detail including profile, lifetime spend, and orders.
  - **Auth:** `support_agent` or higher (or customer accessing their own profile).

---

#### 2.3 Tickets & Support Cases
- `GET /api/tickets`
  - **Query Params:** `status`, `priority`, `incident_id`, `is_escalated`, `page`, `limit`.
  - **Auth:** Authenticated user (scoped by role).
- `POST /api/tickets`
  - **Purpose:** Ingest customer inbound ticket and launch autonomous investigation.
  - **Request Body:**
    ```json
    {
      "subject": "Missing order after successful payment",
      "content": "I paid $49.99 via Stripe 20 minutes ago but received no confirmation.",
      "channel": "portal",
      "customer_id": "cust_4821"
    }
    ```
  - **Response (202 Accepted):** Returns ticket record and initiated `investigation_id`.
- `GET /api/tickets/{id}`
  - **Purpose:** Returns ticket details, messages, and linked active investigation.

---

#### 2.4 Incident Intelligence
- `GET /api/incidents`
  - **Query Params:** `status` (`suspected`, `emerging`, `confirmed`, `resolved`), `severity`.
  - **Auth:** `lead_investigator` or `admin`.
- `GET /api/incidents/{id}`
  - **Purpose:** Returns complete incident entity, supporting signals, linked tickets, and blast radius.
- `GET /api/incidents/{id}/graph`
  - **Purpose:** Returns React Flow graph topology (nodes and edges connecting tickets, service events, and root causes).
- `POST /api/incidents/{id}/remediate`
  - **Purpose:** Trigger batch remediation for all customers in the incident's blast radius.
  - **Request Body:**
    ```json
    {
      "action_type": "REPROCESS_DROPPED_WEBHOOKS",
      "target_customer_ids": ["cust_4821", "cust_4822", "cust_4823"],
      "idempotency_key": "rem_batch_inc_2026_041_01"
    }
    ```
  - **Auth:** `lead_investigator` or `admin`.

---

#### 2.5 Autonomous Investigations & Agent Tracing
- `GET /api/investigations/{id}`
  - **Purpose:** Returns full diagnostic session state, steps executed, and current confidence score.
- `GET /api/investigations/{id}/steps`
  - **Purpose:** Returns chronological list of agent reasoning thoughts, tool calls, and outputs.

---

#### 2.6 Recommendations, Actions & Safe Execution
- `GET /api/recommendations`
  - **Query Params:** `ticket_id`, `status` (`proposed`, `approved`, `executed`).
- `POST /api/actions/execute`
  - **Purpose:** The safe action execution gate. Validates policy and runs remediation.
  - **Request Body:**
    ```json
    {
      "recommendation_id": "rec_9824",
      "ticket_id": "tck_10023",
      "action_type": "recreate_order",
      "parameters": {
        "payment_id": "pay_9842",
        "shipping_method": "expedited_air"
      },
      "idempotency_key": "act_exec_tck_10023_rec_9824"
    }
    ```
  - **Auth:** Enforces RBAC permissions based on action financial threshold.

---

#### 2.7 Escalations & Human Approvals
- `GET /api/escalations`
  - **Query Params:** `status` (`pending`, `in_review`, `resolved`), `urgency`.
- `POST /api/escalations/{id}/claim`
  - **Purpose:** Human agent claims case from the triage queue.
- `POST /api/escalations/{id}/resolve`
  - **Purpose:** Marks escalation resolved with human outcome notes.

---

#### 2.8 Knowledge Base & Policy Search
- `POST /api/knowledge/query`
  - **Purpose:** Vector semantic search across policy documents in ChromaDB.
  - **Request Body:**
    ```json
    {
      "query": "What is the compensation policy for delayed order fulfillment?",
      "top_k": 3,
      "category": "shipping"
    }
    ```

---

#### 2.9 CX Analytics & Reporting
- `GET /api/analytics/metrics`
  - **Query Params:** `start_date`, `end_date`, `interval` (`daily`, `weekly`).
  - **Response:** Daily aggregated time series of autonomous resolution rate, MTTR, and incident counts for Recharts widgets.
