"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Inbox,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Package,
  ShieldCheck,
  Cpu,
  ShieldAlert,
  Zap,
  Radio,
  Sparkles
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface OverviewData {
  total_customers: number;
  open_cases: number;
  investigating_cases: number;
  pending_resolution: number;
  active_escalations: number;
  total_orders: number;
  total_revenue_cents: number;
  system_status: string;
  active_critical_incidents: number;
  autonomous_resolutions?: number;
  assisted_resolutions?: number;
  pending_approvals?: number;
  verified_actions?: number;
  predicted_impacted_customers?: number;
  active_early_warnings?: number;
  proactive_support_tasks?: number;
  recent_tickets: Array<{
    id: string;
    ticket_number: string;
    subject: string;
    customer_name?: string;
    status: string;
    priority: string;
    created_at?: string;
  }>;
  recent_escalations: Array<{
    id: string;
    ticket_number?: string;
    customer_name?: string;
    urgency: string;
    escalation_reason: string;
    status: string;
    created_at?: string;
  }>;
}

interface EarlyWarning {
  id: string;
  component: string;
  alert_level: string;
  rate_increase_percentage: number;
  signal_count: number;
  summary: string;
  status: string;
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ovRes, warnRes] = await Promise.all([
        fetchApi<OverviewData>("/analytics/overview"),
        fetchApi<EarlyWarning[]>("/early-warnings").catch(() => ({ data: [] })),
      ]);
      setData(ovRes.data);
      setWarnings(warnRes.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load overview data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading) {
    return (
      <LoadingState
        message="Loading Command Center metrics..."
        description="Aggregating live customer operations and predictive telemetry from Supabase."
      />
    );
  }

  if (error) {
    return <ErrorState title="Unable to load Command Center" message={error} onRetry={loadOverview} />;
  }

  if (!data) return null;

  const activeAlarms = warnings.filter((w) => w.status === "active");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-[#24283A]">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-[1.5px] border-[#D8D6CE] pb-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            ResolveX Command Center
          </h1>
          <p className="text-xs text-[#464B5E] mt-1 font-medium">Customer operations overview — live operational telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-[11px] bg-[#F8F7F3] border-[1.5px] border-[#BDBCB5] shadow-2xs text-[#24283A]">
            <span
              className={`w-2 h-2 rounded-full ${
                data.system_status.includes("Operational") ? "bg-emerald-500" : "bg-amber-500"
              }`}
            ></span>
            <span>Status: {data.system_status}</span>
          </div>
        </div>
      </div>

      {/* Emerging Anomaly Alert Banner (Unify AI Container Style) */}
      {activeAlarms.length > 0 && (
        <div className="unify-ai-insight p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-[11px] bg-white text-[#5052C9] border border-[#BFC1E4] shrink-0">
              <Radio className="w-5 h-5 animate-pulse text-[#5052C9]" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A]">
                  Early Warning Anomaly Detected
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  {activeAlarms[0].component}
                </span>
                <span className="text-xs font-mono font-bold text-rose-700">
                  +{activeAlarms[0].rate_increase_percentage.toFixed(1)}% surge
                </span>
              </div>
              <p className="text-xs text-[#464B5E] mt-1 font-medium">
                {activeAlarms[0].summary} ({activeAlarms[0].signal_count} anomalous events recorded).
              </p>
            </div>
          </div>
          <Link
            href="/proactive"
            className="unify-btn-primary h-9 px-4 text-xs shrink-0"
          >
            <span>Review Proactive Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metric Cards Grid (Unify Card Specification: #F8F7F3, 1.5px #C6C5BE, 20px radius) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="unify-card p-5 hover:border-[#5052C9] transition-all">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-[#5052C9]" />
          </div>
          <div className="text-2xl font-mono font-bold tracking-tight text-[#24283A] mt-2">
            {data.total_customers.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#464B5E] mt-1">Acme Commerce active user base</p>
        </div>

        {/* Open Cases */}
        <div className="unify-card p-5 hover:border-[#5052C9] transition-all">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Open Cases</span>
            <Inbox className="w-4 h-4 text-[#5052C9]" />
          </div>
          <div className="text-2xl font-mono font-bold tracking-tight text-[#24283A] mt-2">
            {data.open_cases.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#464B5E] mt-1">Awaiting triage &amp; resolution</p>
        </div>

        {/* Pending Resolution */}
        <div className="unify-card p-5 hover:border-[#5052C9] transition-all">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Resolution</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono font-bold tracking-tight text-[#24283A] mt-2">
            {data.pending_resolution.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#464B5E] mt-1">Investigating &amp; customer wait</p>
        </div>

        {/* Active Escalations */}
        <div className="unify-card p-5 hover:border-[#5052C9] transition-all">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Escalations</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-mono font-bold tracking-tight text-[#24283A] mt-2">
            {data.active_escalations.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#464B5E] mt-1">Requires human operator sign-off</p>
        </div>
      </div>

      {/* Predictive & Proactive Telemetry */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#5052C9]" /> Predictive &amp; Proactive Intelligence Telemetry
          </h2>
          <span className="text-[10px] font-mono text-[#464B5E]">Pre-Ticket Blast Radius Awareness</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-[16px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)]">
            <div className="flex items-center justify-between text-[#464B5E]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Predicted Impacted</span>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#24283A] mt-1.5">
              {(data.predicted_impacted_customers ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#464B5E] mt-1">Telemetry-correlated silent victims</p>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)]">
            <div className="flex items-center justify-between text-[#464B5E]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Early Warnings</span>
              <Radio className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#24283A] mt-1.5">
              {(data.active_early_warnings ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#464B5E] mt-1">Statistical rate anomaly triggers</p>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)]">
            <div className="flex items-center justify-between text-[#464B5E]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Proactive Outreach Tasks</span>
              <Zap className="w-4 h-4 text-[#5052C9]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#24283A] mt-1.5">
              {(data.proactive_support_tasks ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#464B5E] mt-1">Policy-governed communication queue</p>
          </div>
        </div>
      </div>

      {/* Autonomous Resolution & Safe Execution Telemetry */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#5052C9]" /> Autonomous Resolution &amp; Safe Execution Telemetry
          </h2>
          <span className="text-[10px] font-mono text-[#464B5E]">Zero Hallucination Policy Gates</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-[16px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)]">
            <div className="flex items-center justify-between text-emerald-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Autonomous Resolves</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#24283A] mt-1.5">
              {(data.autonomous_resolutions ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#464B5E] mt-1">Zero-touch policy verified execution</p>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)]">
            <div className="flex items-center justify-between text-[#5052C9]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Assisted Resolves</span>
              <Cpu className="w-4 h-4 text-[#5052C9]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#24283A] mt-1.5">
              {(data.assisted_resolutions ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#464B5E] mt-1">Operator reviewed &amp; approved</p>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)]">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[11px] font-bold uppercase tracking-wider">Pending Approvals</span>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#24283A] mt-1.5">
              {(data.pending_approvals ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#464B5E] mt-1">Consequential actions &gt; $50 boundary</p>
          </div>

          <div className="p-4 rounded-[16px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)]">
            <div className="flex items-center justify-between text-[#5052C9]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Verified Actions</span>
              <ShieldCheck className="w-4 h-4 text-[#5052C9]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#24283A] mt-1.5">
              {(data.verified_actions ?? 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-[#464B5E] mt-1">DB mutated &amp; state verified</p>
          </div>
        </div>
      </div>

      {/* Support Workload Summary Banner (Unify High-Contrast Dark Card) */}
      <div className="p-6 bg-[#24283A] text-white rounded-[20px] shadow-[0_2px_12px_rgba(35,39,55,0.12)] border-[1.5px] border-[#464B5E]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7779D8] uppercase tracking-widest font-mono">
            <TrendingUp className="w-4 h-4" /> Live Operational Pulse
          </div>
          <h3 className="text-lg font-heading font-bold text-white mt-1.5">
            {data.total_orders} Total Orders Processed ({formatCurrency(data.total_revenue_cents)})
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed font-medium">
            {data.investigating_cases} customer complaints currently undergoing automated background investigation. Real-time telemetry monitoring 3 microservice worker streams.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Link
            href="/cases"
            className="unify-btn-primary h-10 px-5 text-xs justify-center"
          >
            <span>View Live Cases</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/escalations"
            className="h-10 px-5 rounded-[12px] bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Escalation Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Activity Grid: Open Cases & Escalations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="unify-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#D8D6CE] pb-3">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#5052C9]" />
              Active Customer Cases ({data.recent_tickets.length})
            </h3>
            <Link href="/cases" className="text-xs text-[#5052C9] hover:underline font-bold">
              View all
            </Link>
          </div>

          <div className="divide-y divide-[#D8D6CE]">
            {data.recent_tickets.length === 0 ? (
              <p className="text-xs text-[#464B5E] py-4 text-center">No active customer cases in queue.</p>
            ) : (
              data.recent_tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/cases/${t.id}`}
                  className="py-3 block hover:bg-[#EDEBE5]/70 -mx-2 px-2 rounded-[11px] transition-colors text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-bold text-[#5052C9]">{t.ticket_number}</span>
                    <span
                      className={`capitalize px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        t.priority === "urgent"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : t.priority === "high"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-[#EDEBE5] text-[#24283A] border border-[#C6C5BE]"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div className="font-semibold text-[#24283A] truncate mt-1">{t.subject}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#464B5E] mt-1 font-medium">
                    <span>{t.customer_name || "Anonymous Customer"}</span>
                    <span>{formatDate(t.created_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Active Escalation Desk */}
        <div className="unify-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b-[1.5px] border-[#D8D6CE] pb-3">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Escalation Desk — Awaiting Human Review ({data.recent_escalations.length})
            </h3>
            <Link href="/escalations" className="text-xs text-[#5052C9] hover:underline font-bold">
              View all
            </Link>
          </div>

          <div className="divide-y divide-[#D8D6CE]">
            {data.recent_escalations.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#24283A]">Zero pending human escalations.</p>
                <p className="text-[11px] text-[#464B5E] mt-0.5">Automated triage queue running cleanly.</p>
              </div>
            ) : (
              data.recent_escalations.map((e) => (
                <Link
                  key={e.id}
                  href={`/escalations/${e.id}`}
                  className="py-3 block hover:bg-[#EDEBE5]/70 -mx-2 px-2 rounded-[11px] transition-colors text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-bold text-rose-700">{e.ticket_number || "Incident"}</span>
                    <span
                      className={`capitalize px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        e.urgency === "immediate"
                          ? "bg-rose-100 text-rose-800 border border-rose-300 font-bold"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {e.urgency}
                    </span>
                  </div>
                  <div className="font-semibold text-[#24283A] mt-1 line-clamp-1">{e.escalation_reason}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#464B5E] mt-1 font-medium">
                    <span>{e.customer_name || "High-Impact Case"}</span>
                    <span>{formatDate(e.created_at)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
