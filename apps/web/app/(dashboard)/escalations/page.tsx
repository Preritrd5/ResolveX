"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Filter,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
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
  const [filteredEscalations, setFilteredEscalations] = useState<EscalationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadEscalations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<EscalationItem[]>("/escalations");
      setEscalations(res.data);
      setFilteredEscalations(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load escalations";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  useEffect(() => {
    let list = [...escalations];
    if (statusFilter !== "all") {
      list = list.filter((e) => e.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (urgencyFilter !== "all") {
      list = list.filter((e) => e.urgency.toLowerCase() === urgencyFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          (e.ticket_number && e.ticket_number.toLowerCase().includes(q)) ||
          (e.customer_name && e.customer_name.toLowerCase().includes(q)) ||
          e.escalation_reason.toLowerCase().includes(q) ||
          e.executive_summary.toLowerCase().includes(q)
      );
    }
    setFilteredEscalations(list);
  }, [statusFilter, urgencyFilter, searchQuery, escalations]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold uppercase tracking-wider text-rose-600">
            <AlertTriangle className="w-4 h-4" /> Human-in-the-Loop Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#24283A] mt-1">
            Escalation & Approval Center
          </h1>
          <p className="text-sm text-[#464B5E] mt-1 font-sans">
            High-value cases, policy boundary exceptions, and complex incident inquiries requiring operator authorization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#24283A] text-white text-xs font-heading font-semibold shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Active Escalations: {escalations.filter((e) => e.status !== "resolved").length}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-[#464B5E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            suppressHydrationWarning
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket #, customer, trigger..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[11px] text-[#24283A] placeholder:text-[#464B5E]/60 focus:outline-none focus:border-[#5B5CE2] focus:ring-1 focus:ring-[#5B5CE2]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-[#464B5E]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[11px] text-[#24283A] font-medium focus:outline-none focus:border-[#5B5CE2] focus:ring-1 focus:ring-[#5B5CE2]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[11px] text-[#24283A] font-medium focus:outline-none focus:border-[#5B5CE2] focus:ring-1 focus:ring-[#5B5CE2]"
          >
            <option value="all">All Urgencies</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading escalation queue..." description="Querying Supabase escalations table." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadEscalations} />
      ) : filteredEscalations.length === 0 ? (
        <EmptyState
          title="No matching escalations"
          description="All high-value cases matching your filter criteria have been resolved or authorized."
        />
      ) : (
        <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
            <thead className="bg-[#FBFAF7] border-b border-[#D8D6CE] text-[#464B5E] uppercase tracking-wider font-heading font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Ticket #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Trigger Reason</th>
                <th className="py-3 px-4">Diagnostic Summary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Escalated At</th>
                <th className="py-3 px-4 text-right">Human Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D6CE] text-[#24283A]">
              {filteredEscalations.map((e) => (
                <tr key={e.id} className="hover:bg-[#FBFAF7]/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-[#24283A]">
                    <Link href={`/cases/${e.ticket_id}`} className="text-[#5052C9] font-bold hover:underline">
                      {e.ticket_number || "TCK-ESC"}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#24283A]">
                    {e.customer_name || "Customer"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-[6px] font-heading font-bold text-[10px] uppercase ${
                        e.urgency === "critical"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : e.urgency === "urgent"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-[#FBFAF7] text-[#464B5E] border border-[#D8D6CE]"
                      }`}
                    >
                      {e.urgency}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#24283A]">
                    <span className="font-mono text-[11px] bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4]/50 px-2 py-0.5 rounded-[6px]">
                      {e.escalation_reason}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-sm text-[#464B5E] truncate font-sans">
                    {e.executive_summary}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold capitalize ${
                        e.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#464B5E] whitespace-nowrap font-mono text-[11px]">
                    {formatDate(e.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/escalations/${e.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6b6dc9] hover:to-[#4143A7] text-white text-xs font-heading font-semibold shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-all whitespace-nowrap cursor-pointer"
                    >
                      <span>Handoff Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
