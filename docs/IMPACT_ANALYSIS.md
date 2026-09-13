# ResolveX — Incident Impact Analysis & Near-Term Demand Forecasting
## Chronological Blast Radius Progression, Support Load Projections & Data Integrity Guards

---

### 1. OVERVIEW & PURPOSE

During an active infrastructure or operational incident, support leadership requires answer to two critical questions:
1. *What is the real blast radius right now (both reported and unreported)?*
2. *What will our support ticket load look like in the next 30–60 minutes if this is uncontained?*

The **ResolveX Impact Analytics Service** continuously computes:
- Chronological progression of affected customers vs. submitted customer tickets at 5-minute intervals.
- The "Unreported Gap" — victims of the failure who have not yet reached out to customer support.
- Near-term customer exposure projections with explicit uncertainty intervals.
- Support load estimates (projected ticket arrival rate per hour).

---

### 2. DATA INTEGRITY & INSUFFICIENT DATA GUARDS

**Non-Negotiable Production Principle:**  
ResolveX will **never** fabricate a forecast curve or present arbitrary lines when historical telemetry is sparse.

- If the number of historical chronological data points $N < 3$:
  - `has_sufficient_data` is strictly set to `False`.
  - The UI presents an amber **Insufficient Historical Data** badge:
    > *"Insufficient historical data for reliable projection. A minimum of 3 chronological intervals is required before generating statistical projections."*
  - The system exposes the raw count of currently affected customers without speculative bounds.

---

### 3. MATHEMATICAL FORECASTING FORMULATION

When $N \ge 3$ intervals exist, the short-term impact growth velocity $v = \frac{\Delta \text{customers}}{\Delta t}$ is computed using weighted moving average regression across the active incident window:

$$\hat{y}(t + \Delta t) = y(t) + v \cdot \Delta t$$

#### Confidence Bounds
Given the variance $\sigma_v^2$ of recent interval velocity:
$$\text{Lower Bound} = \max\left(y(t), \, \hat{y} - 1.96 \cdot \sigma_v \sqrt{\Delta t}\right)$$
$$\text{Upper Bound} = \hat{y} + 1.96 \cdot \sigma_v \sqrt{\Delta t}$$

#### Support Load Estimation
Support ticket arrival rate $\lambda_{\text{projected}}$ is calculated as:
$$\lambda_{\text{projected}} = \lambda_{\text{baseline}} + \alpha \cdot \text{Unreported Customers}$$
Where:
- $\alpha \in [0.15, 0.40]$ is the empirical ticket-filing propensity factor within the first 60 minutes of operational failure.
- $\lambda_{\text{baseline}}$ is the historical 30-day hourly ticket arrival rate for the affected component.
