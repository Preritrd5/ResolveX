"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Inbox,
  Users,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Zap,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  DollarSign,
  PieChart as PieIcon
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface CategoryCount {
  category: string;
  count: number;
  percentage: number;
}

interface CXTrendPoint {
  timestamp: string;
  date_label: string;
  tickets_created: number;
  tickets_resolved: number;
  incidents_active: number;
  escalations_count: number;
}

interface AdvancedCXAnalytics {
  total_tickets: number;
  open_tickets: number;
  resolved_tickets: number;
  resolution_rate_percentage: number;
  avg_resolution_time_minutes: number | null;
  avg_resolution_time_notice: string | null;
  escalation_rate_percentage: number;
  autonomous_resolution_rate_percentage: number;
  assisted_resolution_rate_percentage: number;
  repeat_contact_rate_percentage: number;
  total_customers: number;
  total_orders: number;
  total_revenue_cents: number;
  active_incidents_count: number;
  intent_distribution: CategoryCount[];
  service_failure_distribution: CategoryCount[];
  resolution_breakdown: Record<string, number>;
  escalation_breakdown: Record<string, any>;
  proactive_funnel: Record<string, number>;
  trends: CXTrendPoint[];
  top_incidents: Array<{
    id: string;
    incident_number: string;
    title: string;
    severity: string;
    status: string;
    confidence_score: number;
    impact_estimate_customers: number;
    financial_exposure_cents: number;
    linked_tickets_count: number;
    detected_at?: string;
  }>;
}

const PIE_COLORS = ["#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AdvancedCXAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"ALL" | "INCIDENT_FOCUS" | "BILLING">("ALL");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<AdvancedCXAnalytics>("/analytics/cx");
      setData(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load CX intelligence";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <LoadingState
        message="Loading Executive CX Analytics..."
        description="Aggregating ticket resolution rates, service error distributions, and blast radius funnels from Supabase."
      />
    );
  }

  if (error || !data) {
    return <ErrorState message={error || "Failed to load analytics"} onRetry={loadAnalytics} />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Title & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold uppercase tracking-wider text-[#5052C9]">
            <BarChart3 className="w-4 h-4" /> Customer Experience Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#24283A] mt-1">
            Executive CX &amp; Operational Analytics
          </h1>
          <p className="text-sm text-[#464B5E] mt-1 font-sans">
            Deterministic resolution velocities, support intent distribution, and proactive prevention telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#FBFAF7] border border-[#D8D6CE] p-1 rounded-[12px] text-xs font-medium">
            {(["ALL", "INCIDENT_FOCUS", "BILLING"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-3 py-1.5 rounded-[8px] font-heading font-semibold transition-all cursor-pointer ${
                  filterMode === m
                    ? "bg-[#5052C9] text-white shadow-xs"
                    : "text-[#464B5E] hover:text-[#24283A]"
                }`}
              >
                {m === "ALL" ? "All Telemetry" : m === "INCIDENT_FOCUS" ? "Incident Window" : "Billing Focus"}
              </button>
            ))}
          </div>

          <button
            onClick={loadAnalytics}
            className="p-2.5 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] hover:border-[#D8D6CE] text-[#464B5E] shadow-xs cursor-pointer"
            title="Refresh analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Metric Cards: 4 High-Level Executive Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Resolution Rate */}
        <div className="p-5 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-xs font-heading font-bold uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#24283A] mt-2 font-mono">
            {data.resolution_rate_percentage.toFixed(1)}%
          </div>
          <p className="text-xs text-[#464B5E] mt-1 font-sans">
            {data.resolved_tickets} of {data.total_tickets} cases closed
          </p>
        </div>

        {/* Autonomous Resolution Rate */}
        <div className="p-5 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-xs font-heading font-bold uppercase tracking-wider">Autonomous Velocity</span>
            <Cpu className="w-4 h-4 text-[#5052C9]" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#5052C9] mt-2 font-mono">
            {data.autonomous_resolution_rate_percentage.toFixed(1)}%
          </div>
          <p className="text-xs text-[#464B5E] mt-1 font-sans">
            Zero-touch + {data.assisted_resolution_rate_percentage.toFixed(1)}% operator-assisted
          </p>
        </div>

        {/* Escalation Rate */}
        <div className="p-5 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-xs font-heading font-bold uppercase tracking-wider">Escalation Rate</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#24283A] mt-2 font-mono">
            {data.escalation_rate_percentage.toFixed(1)}%
          </div>
          <p className="text-xs text-[#464B5E] mt-1 font-sans">
            Safety gates diverted to human operator
          </p>
        </div>

        {/* Repeat Contact Rate */}
        <div className="p-5 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-xs font-heading font-bold uppercase tracking-wider">Repeat Contact Rate</span>
            <Users className="w-4 h-4 text-[#5052C9]" />
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#24283A] mt-2 font-mono">
            {data.repeat_contact_rate_percentage.toFixed(1)}%
          </div>
          <p className="text-xs text-[#464B5E] mt-1 font-sans">
            Customers with &gt; 1 support inquiry
          </p>
        </div>
      </div>

      {/* Average Resolution Time & Insufficient Data Guard */}
      <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#24283A]">
          <Clock className="w-4 h-4 text-[#5052C9] shrink-0" />
          <div>
            <span className="font-heading font-bold">Average Case Resolution Time: </span>
            {data.avg_resolution_time_minutes !== null ? (
              <span className="font-mono font-bold text-[#5052C9]">
                {data.avg_resolution_time_minutes} minutes
              </span>
            ) : (
              <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-[6px] font-medium">
                Insufficient data (statistical guard: &lt; 3 resolved tickets with timestamps)
              </span>
            )}
          </div>
        </div>
        <div className="text-[#464B5E] text-[11px] font-mono">
          Acme Commerce Customer Base: {data.total_customers.toLocaleString()} &bull; Total Orders: {data.total_orders.toLocaleString()}
        </div>
      </div>

      {/* Chronological Time-Series Chart */}
      <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-heading font-bold text-[#24283A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#5052C9]" />
              Chronological Ticket Ingestion vs. Resolution Velocity
            </h3>
            <p className="text-xs text-[#464B5E] mt-0.5 font-sans">
              Real-time progression derived from actual ticket timestamps in Supabase.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#5052C9]" />
              <span className="text-[#464B5E] font-medium font-sans">Tickets Created</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[#464B5E] font-medium font-sans">Tickets Resolved</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5052C9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#5052C9" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#D8D6CE" vertical={false} />
              <XAxis dataKey="date_label" tick={{ fontSize: 11, fill: "#464B5E" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#464B5E" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#24283A", borderRadius: "10px", border: "none", color: "#fff", fontSize: "12px" }}
              />
              <Area type="monotone" dataKey="tickets_created" name="Created" stroke="#5052C9" strokeWidth={2} fill="url(#colorCreated)" />
              <Area type="monotone" dataKey="tickets_resolved" name="Resolved" stroke="#10b981" strokeWidth={2} fill="url(#colorResolved)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2-Column: Customer Intent Distribution & Service Failure Domains */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Customer Intent Distribution */}
        <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-3">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <Inbox className="w-4 h-4 text-[#5052C9]" />
              Customer Intent Distribution
            </h3>
            <span className="text-[11px] font-mono text-[#464B5E]">Total {data.total_tickets} Tickets</span>
          </div>

          <div className="space-y-3 pt-1">
            {data.intent_distribution.map((item, idx) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-semibold text-[#24283A]">{item.category}</span>
                  <span className="font-mono text-[#464B5E]">
                    {item.count} tickets ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#D8D6CE]/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Service Failure Breakdown */}
        <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-3">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-rose-600" />
              Operational Service Failure Domains
            </h3>
            <span className="text-[11px] font-mono text-[#464B5E]">Microservice Events</span>
          </div>

          <div className="space-y-3 pt-1">
            {data.service_failure_distribution.map((svc, idx) => (
              <div key={svc.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-[#24283A]">{svc.category}</span>
                  <span className="font-mono text-[#464B5E]">
                    {svc.count} events ({svc.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#D8D6CE]/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${svc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Proactive Funnel & Execution Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Proactive Funnel (Phase 6) */}
        <div className="lg:col-span-7 bg-[#24283A] text-white rounded-[20px] p-6 shadow-sm border border-[#353b52] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#7779D8] flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Proactive Intelligence Funnel
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Pre-Ticket Blast Radius</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-[12px] bg-white/5 border border-white/10">
              <span className="text-[10px] uppercase font-heading font-bold text-slate-400">Evaluated</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {data.proactive_funnel.total_evaluated_candidates ?? 0}
              </div>
              <span className="text-[10px] text-slate-400 font-sans">Candidates</span>
            </div>

            <div className="p-3.5 rounded-[12px] bg-amber-950/40 border border-amber-600/40">
              <span className="text-[10px] uppercase font-heading font-bold text-amber-400">Likely Affected</span>
              <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                {data.proactive_funnel.likely_affected ?? 0}
              </div>
              <span className="text-[10px] text-amber-400/80 font-sans">Silent Victims</span>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#1b1e2b] border border-[#5052C9]/40">
              <span className="text-[10px] uppercase font-heading font-bold text-[#7779D8]">Policy Approved</span>
              <div className="text-xl font-bold font-mono text-[#7779D8] mt-1">
                {data.proactive_funnel.policy_approved ?? 0}
              </div>
              <span className="text-[10px] text-indigo-300/80 font-sans">Outreach Tasks</span>
            </div>

            <div className="p-3.5 rounded-[12px] bg-emerald-950/40 border border-emerald-600/40">
              <span className="text-[10px] uppercase font-heading font-bold text-emerald-400">Dispatched</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                {data.proactive_funnel.notifications_sent ?? 0}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-sans">Simulated Safe</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-700 font-sans">
            <strong className="text-white">Anti-Spam Deduplication Guard:</strong> {data.proactive_funnel.deduplications_prevented ?? 0} duplicate customer notifications suppressed across flap intervals.
          </p>
        </div>

        {/* Phase 5 Action Resolution Matrix */}
        <div className="lg:col-span-5 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Resolution Execution Integrity
            </h3>
            <span className="text-[10px] font-mono text-[#464B5E]">Policy Gates</span>
          </div>

          <div className="divide-y divide-[#D8D6CE] text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#464B5E] font-sans">Autonomous Resolves (Zero-Touch)</span>
              <span className="font-mono font-bold text-emerald-700">
                {data.resolution_breakdown.autonomous_resolutions ?? 0}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#464B5E] font-sans">Assisted Resolves (Human Approved)</span>
              <span className="font-mono font-bold text-[#5052C9]">
                {data.resolution_breakdown.assisted_resolutions ?? 0}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#464B5E] font-sans">Pending Operator Approvals</span>
              <span className="font-mono font-bold text-amber-700">
                {data.resolution_breakdown.pending_approvals ?? 0}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#464B5E] font-sans">Post-Execution DB Verified Actions</span>
              <span className="font-mono font-bold text-[#24283A]">
                {data.resolution_breakdown.verified_actions ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top High-Impact Systemic Incidents Table */}
      <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] overflow-hidden space-y-0">
        <div className="p-4 border-b border-[#D8D6CE] flex items-center justify-between bg-[#FBFAF7]">
          <div>
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Active Systemic Incidents ({data.top_incidents.length})
            </h3>
            <p className="text-[11px] text-[#464B5E] font-sans">
              Operational failure clusters correlating customer complaints and backend traces.
            </p>
          </div>
          <Link href="/incidents" className="text-xs font-heading font-semibold text-[#5052C9] hover:underline">
            View All Incidents &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[720px]">
            <thead className="bg-[#FBFAF7] border-b border-[#D8D6CE] text-[#464B5E] text-[10px] uppercase font-heading font-semibold">
              <tr>
                <th className="py-2.5 px-4">Incident</th>
                <th className="py-2.5 px-4">Title &amp; Root Cause</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Impact Exposure</th>
                <th className="py-2.5 px-4">Confidence</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D6CE]">
              {data.top_incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-[#FBFAF7]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#5052C9]">
                    {inc.incident_number}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-heading font-bold text-[#24283A]">{inc.title}</div>
                    <div className="text-[11px] text-[#464B5E] capitalize font-sans">Status: {inc.status}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-heading font-bold uppercase ${
                        inc.severity === "critical"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono font-semibold text-[#24283A]">
                      {formatCurrency(inc.financial_exposure_cents)}
                    </div>
                    <div className="text-[10px] text-[#464B5E] font-sans">
                      {inc.impact_estimate_customers} customers impacted
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#5052C9]">
                    {Math.round(inc.confidence_score * 100)}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/incidents/${inc.id}`}
                      className="px-3 py-1.5 bg-[#FBFAF7] hover:bg-[#D8D6CE]/30 border border-[#D8D6CE] text-[#24283A] rounded-[8px] text-xs font-heading font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Command Center <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
