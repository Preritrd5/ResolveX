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

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<OverviewData>("/analytics/overview");
      setData(res.data);
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
    return <LoadingState message="Loading Command Center metrics..." description="Aggregating live customer operations telemetry from Supabase." />;
  }

  if (error) {
    return <ErrorState title="Unable to load Command Center" message={error} onRetry={loadOverview} />;
  }

  if (!data) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Subtitle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">ResolveX Command Center</h1>
          <p className="text-sm text-slate-500 mt-1">Customer operations overview — live operational telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-slate-200 shadow-sm text-slate-700">
            <span className={`w-2 h-2 rounded-full ${data.system_status.includes("Operational") ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            Status: {data.system_status}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="p-5 bg-white rounded-lg border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2 font-mono">
            {data.total_customers.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Acme Commerce active user base</p>
        </div>

        {/* Open Cases */}
        <div className="p-5 bg-white rounded-lg border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Open Cases</span>
            <Inbox className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2 font-mono">
            {data.open_cases.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Awaiting triage & resolution</p>
        </div>

        {/* Pending Resolution */}
        <div className="p-5 bg-white rounded-lg border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Resolution</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2 font-mono">
            {data.pending_resolution.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Investigating & customer wait</p>
        </div>

        {/* Active Escalations */}
        <div className="p-5 bg-white rounded-lg border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Active Escalations</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2 font-mono">
            {data.active_escalations.toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">Requires human operator sign-off</p>
        </div>
      </div>

      {/* Support Workload Summary Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
            <TrendingUp className="w-4 h-4" /> Live Operational Pulse
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            {data.total_orders} Total Orders Processed ({formatCurrency(data.total_revenue_cents)})
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {data.investigating_cases} customer complaints currently undergoing automated background investigation. Real-time telemetry monitoring 3 microservice worker streams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/cases"
            className="px-4 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1.5"
          >
            View Live Cases <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/incidents"
            className="px-4 py-2 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Incident Intelligence
          </Link>
        </div>
      </div>

      {/* Two-Column Grid: Recent Cases & Recent Escalations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Cases */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Cases</h3>
            <Link href="/cases" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              All Cases <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recent_tickets.map((t) => (
              <Link
                key={t.id}
                href={`/cases/${t.id}`}
                className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-3 px-3 rounded transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-700">{t.ticket_number}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      t.priority === "urgent" ? "bg-rose-100 text-rose-700" :
                      t.priority === "high" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-900 truncate mt-0.5">{t.subject}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{t.customer_name || "Customer"} • {formatDate(t.created_at)}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[11px] font-medium capitalize px-2 py-0.5 rounded-full ${
                    t.status === "open" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    t.status === "investigating" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {t.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Escalations */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Recent Escalations</h3>
            <Link href="/escalations" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              All Escalations <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recent_escalations.map((e) => (
              <div key={e.id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-700">{e.ticket_number || "TCK-ESC"}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      {e.urgency}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 mt-1 font-medium">{e.escalation_reason}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{e.customer_name || "Customer"} • {formatDate(e.created_at)}</div>
                </div>
                <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
