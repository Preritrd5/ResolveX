"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

interface EscalationItem {
  id: string;
  ticket_id: string;
  ticket_number?: string;
  customer_name?: string;
  escalation_reason: string;
  executive_summary: string;
  recommended_resolution?: string;
  urgency: string;
  status: string;
  created_at?: string;
}

export default function EscalationsPage() {
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEscalations() {
      try {
        setLoading(true);
        const res = await fetchApi<EscalationItem[]>("/escalations");
        setEscalations(res.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load escalations";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadEscalations();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600">
          <AlertTriangle className="w-4 h-4" /> Human-in-the-Loop Governance
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Escalation & Approval Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          High-value cases, policy boundary exceptions, and complex incident inquiries requiring operator sign-off.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading escalation queue..." description="Querying Supabase escalations table." />
      ) : error ? (
        <ErrorState message={error} />
      ) : escalations.length === 0 ? (
        <EmptyState title="No active escalations" description="All high-value cases have been resolved or authorized." />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Ticket #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Escalation Trigger</th>
                <th className="py-3 px-4">Diagnostic Summary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Escalated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {escalations.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    <Link href={`/cases/${e.ticket_id}`} className="text-indigo-600 hover:underline">
                      {e.ticket_number || "TCK-ESC"}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {e.customer_name || "Customer"}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                      e.urgency === "critical" ? "bg-rose-100 text-rose-800" :
                      e.urgency === "urgent" ? "bg-amber-100 text-amber-800" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {e.urgency}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      {e.escalation_reason}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-sm text-slate-600 truncate">
                    {e.executive_summary}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-amber-50 text-amber-700 border border-amber-200">
                      {e.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {formatDate(e.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
