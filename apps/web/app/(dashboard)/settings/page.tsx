"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Database,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Cpu,
  Server,
  AlertCircle,
  Terminal,
  Sliders,
  Lock,
  FileText,
  Check,
  Zap
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface ComponentHealth {
  status: string;
  latency_ms: number;
  details: Record<string, unknown>;
}

interface SystemHealthDetailed {
  status: string;
  timestamp: string;
  components: Record<string, ComponentHealth>;
}

interface DemoResetResponse {
  success: boolean;
  message: string;
  seed: number;
  reset_at: string;
  records_restored: Record<string, number>;
}

export default function SettingsPage() {
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<DemoResetResponse | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const [healthData, setHealthData] = useState<SystemHealthDetailed | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const res = await fetchApi<SystemHealthDetailed>("/system/health");
      setHealthData(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load system health";
      setHealthError(msg);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const handleResetDemo = async () => {
    setResetting(true);
    setResetError(null);
    try {
      const res = await fetchApi<DemoResetResponse>("/demo/reset", {
        method: "POST",
        body: JSON.stringify({ seed: 42, reset_mode: "full" })
      });
      setResetResult(res.data);
      await loadHealth();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset demo baseline";
      setResetError(msg);
    } finally {
      setResetting(false);
    }
  };

  const componentLabels: Record<string, { label: string; desc: string; icon: React.ComponentType<{ className?: string }> }> = {
    backend_api: { label: "FastAPI Backend Core", desc: "Uvicorn ASGI runner & API routes", icon: Server },
    database: { label: "Supabase DB & Fixtures", desc: "PostgreSQL with row-level security", icon: Database },
    ai_orchestration: { label: "Multi-Agent Orchestrator", desc: "Gemini 2.0 Flash + Deterministic fallback", icon: Cpu },
    agent_orchestration: { label: "Multi-Agent Orchestrator", desc: "Gemini 2.0 Flash + Deterministic fallback", icon: Cpu },
    knowledge_rag: { label: "Knowledge Graph & Policies", desc: "Inverted index vector retrieval engine", icon: FileText },
    prediction_engine: { label: "Blast Radius & Prediction", desc: "Correlation engine & customer impact scoring", icon: Zap },
    proactive_transport: { label: "Proactive Transport Layer", desc: "Multi-channel simulated notification queue", icon: Activity }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-[#24283A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-[1.5px] border-[#D8D6CE] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-[#5052C9]">
            <Settings className="w-4 h-4" /> Administration & Demo Controls
          </div>
          <h1 className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A] mt-1">
            Tenant & System Settings
          </h1>
          <p className="text-xs text-[#464B5E] mt-1 font-medium">
            Manage live system diagnostics, deterministic evaluation baseline, and enterprise AI guardrails.
          </p>
        </div>

        <button
          onClick={loadHealth}
          disabled={healthLoading}
          className="unify-btn-secondary h-10 text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#5052C9] ${healthLoading ? "animate-spin" : ""}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {/* Live System Health & Diagnostics Panel (Unify Card Styling) */}
      <div className="unify-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b-[1.5px] border-[#D8D6CE] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5E4EE] text-[#5052C9] flex items-center justify-center border border-[#BFC1E4]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-heading font-bold text-[#24283A]">Live System Diagnostics</h2>
                {healthData && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md tracking-wide ${
                    healthData.status === "healthy" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {healthData.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#464B5E] font-medium">Continuous health telemetry across 6 core subsystems</p>
            </div>
          </div>
          {healthData && (
            <span className="text-[11px] font-mono text-[#464B5E] hidden sm:inline">
              Checked at: {new Date(healthData.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        {healthError ? (
          <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-200 flex items-center gap-3 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Telemetry error: {healthError}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {Object.entries(healthData?.components || {}).map(([key, comp]) => {
              const meta = componentLabels[key] || { label: key, desc: "Subsystem", icon: Activity };
              const Icon = meta.icon;
              const isHealthy = comp.status === "healthy";

              return (
                <div key={key} className="p-4 rounded-[14px] border-[1.5px] border-[#D8D6CE] bg-[#FBFAF7] hover:bg-[#EDEBE5]/60 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[10px] bg-[#F8F7F3] border border-[#C6C5BE] flex items-center justify-center text-[#5052C9]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#24283A]">{meta.label}</h4>
                        <p className="text-[10px] text-[#464B5E]">{meta.desc}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold rounded-md uppercase ${
                      isHealthy ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {comp.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#D8D6CE] flex items-center justify-between text-[11px]">
                    <span className="text-[#464B5E]">Latency:</span>
                    <span className="font-mono font-bold text-[#24283A]">{comp.latency_ms} ms</span>
                  </div>

                  {Object.keys(comp.details).length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-[#D8D6CE]/60 text-[10px] text-[#464B5E] space-y-0.5 font-mono truncate">
                      {Object.entries(comp.details).slice(0, 2).map(([dKey, dVal]) => (
                        <div key={dKey} className="flex justify-between">
                          <span className="text-[#464B5E]">{dKey}:</span>
                          <span className="text-[#24283A] font-semibold truncate max-w-[120px]">{String(dVal)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demo Environment Reset Card */}
        <div className="unify-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5E4EE] text-[#5052C9] flex items-center justify-center border border-[#BFC1E4]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-[#24283A]">Deterministic Demo Data Reset</h3>
              <p className="text-xs text-[#464B5E]">Restore Acme Commerce starting baseline (seed=42)</p>
            </div>
          </div>

          <p className="text-xs text-[#464B5E] leading-relaxed font-medium">
            Instantly restores all 520 customers, 315 tickets, 510 orders, and 525 payments to the exact clean demo baseline for presentation evaluation. Rebuilds mock caches and resets simulation state.
          </p>

          {resetError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[11px]">
              {resetError}
            </div>
          )}

          {resetResult && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[12px] space-y-2">
              <div className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {resetResult.message}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-emerald-900 pt-1">
                <div>Customers: {resetResult.records_restored.customers}</div>
                <div>Tickets: {resetResult.records_restored.tickets}</div>
                <div>Orders: {resetResult.records_restored.orders}</div>
                <div>Payments: {resetResult.records_restored.payments}</div>
                <div>Incidents: {resetResult.records_restored.incidents}</div>
                <div>Audits: {resetResult.records_restored.action_executions}</div>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="unify-btn-primary text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetting ? "animate-spin" : ""}`} />
              <span>{resetting ? "Resetting Demo Baseline..." : "Reset Demo Data Baseline"}</span>
            </button>
          </div>

          <div className="p-3 bg-[#FBFAF7] rounded-[11px] border border-[#D8D6CE] font-mono text-[11px] text-[#464B5E]">
            <div className="flex items-center gap-1.5 text-[#464B5E] mb-1">
              <Terminal className="w-3.5 h-3.5 text-[#5052C9]" /> Deterministic CLI Reset:
            </div>
            <code className="text-[#5052C9] font-bold">python -m apps.api.scripts.reset_demo_db --seed=42</code>
          </div>
        </div>

        {/* AI Guardrails & Policy Gates Card */}
        <div className="unify-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5E4EE] text-[#5052C9] flex items-center justify-center border border-[#BFC1E4]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-[#24283A]">AI Guardrails & Policy Gates</h3>
              <p className="text-xs text-[#464B5E]">Calibrated decision boundaries & execution safety</p>
            </div>
          </div>

          <p className="text-xs text-[#464B5E] leading-relaxed font-medium">
            ResolveX enforces strict algorithmic guardrails. No AI recommendation executes mutations without traversing validation schemas and policy authorization gates.
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-[12px] bg-[#FBFAF7] flex items-center justify-between border border-[#D8D6CE]">
              <div>
                <div className="font-semibold text-[#24283A]">Auto-Resolution Threshold</div>
                <div className="text-[10px] text-[#464B5E]">Calibrated confidence floor for zero-touch remediation</div>
              </div>
              <span className="font-mono font-bold text-[#5052C9] bg-[#E5E4EE] px-2.5 py-1 rounded-md border border-[#BFC1E4]">
                c ≥ 0.70
              </span>
            </div>

            <div className="p-3 rounded-[12px] bg-[#FBFAF7] flex items-center justify-between border border-[#D8D6CE]">
              <div>
                <div className="font-semibold text-[#24283A]">Human Escalation Gate</div>
                <div className="text-[10px] text-[#464B5E]">Transactions exceeding ceiling mandate supervisor approval</div>
              </div>
              <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                &gt; $50.00
              </span>
            </div>

            <div className="p-3 rounded-[12px] bg-[#FBFAF7] flex items-center justify-between border border-[#D8D6CE]">
              <div>
                <div className="font-semibold text-[#24283A]">Output Validation</div>
                <div className="text-[10px] text-[#464B5E]">Unstructured reasoning forbidden; strict JSON schemas only</div>
              </div>
              <span className="font-semibold text-emerald-700 flex items-center gap-1 font-mono">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Pydantic v2
              </span>
            </div>

            <div className="p-3 rounded-[12px] bg-[#FBFAF7] flex items-center justify-between border border-[#D8D6CE]">
              <div>
                <div className="font-semibold text-[#24283A]">Deterministic Fallback</div>
                <div className="text-[10px] text-[#464B5E]">Graceful rule-based triage on network or LLM quota exhaustion</div>
              </div>
              <span className="font-semibold text-emerald-700 flex items-center gap-1 font-mono">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Active (Offline-Ready)
              </span>
            </div>
          </div>
        </div>

        {/* Security & Credentials Isolation Card */}
        <div className="unify-card p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-heading font-bold text-[#24283A]">Security & Multi-Tenant Isolation</h3>
              <p className="text-xs text-[#464B5E]">Verified zero-leakage security boundaries and credential controls</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-[12px] bg-[#FBFAF7] border border-[#D8D6CE] space-y-1">
              <span className="text-[10px] font-bold text-[#464B5E] uppercase tracking-wider font-mono">Tenant Scope</span>
              <div className="font-semibold text-[#24283A]">Acme Commerce</div>
              <div className="text-[10px] font-mono text-[#464B5E]">org_acme_corp_001</div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#FBFAF7] border border-[#D8D6CE] space-y-1">
              <span className="text-[10px] font-bold text-[#464B5E] uppercase tracking-wider font-mono">Service Role Key</span>
              <div className="font-semibold text-emerald-700 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Server-Side Only
              </div>
              <div className="text-[10px] text-[#464B5E]">Zero client-side leakage</div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#FBFAF7] border border-[#D8D6CE] space-y-1">
              <span className="text-[10px] font-bold text-[#464B5E] uppercase tracking-wider font-mono">Row-Level Security</span>
              <div className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enforced (35 Tables)
              </div>
              <div className="text-[10px] text-[#464B5E]">Postgres policies active</div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#FBFAF7] border border-[#D8D6CE] space-y-1">
              <span className="text-[10px] font-bold text-[#464B5E] uppercase tracking-wider font-mono">Audit Log Immutability</span>
              <div className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Append-Only
              </div>
              <div className="text-[10px] text-[#464B5E]">action_executions table</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
