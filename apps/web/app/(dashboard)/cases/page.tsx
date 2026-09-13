"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, ArrowLeft, ArrowRight, User, AlertCircle, Bot, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

interface TicketItem {
  id: string;
  ticket_number: string;
  subject: string;
  customer_name?: string;
  customer_email?: string;
  status: string;
  priority: string;
  intent_category?: string;
  sentiment_score?: number;
  ai_confidence?: number;
  recommended_team?: string;
  ai_resolvable?: boolean;
  complexity?: string;
  created_at?: string;
}

export default function CasesPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [intentFilter, setIntentFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [aiResolvableFilter, setAiResolvableFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      let queryParams = `?page=${page}&limit=15`;
      if (statusFilter) queryParams += `&status=${encodeURIComponent(statusFilter)}`;
      if (priorityFilter) queryParams += `&priority=${encodeURIComponent(priorityFilter)}`;
      if (intentFilter) queryParams += `&intent=${encodeURIComponent(intentFilter)}`;
      if (teamFilter) queryParams += `&team=${encodeURIComponent(teamFilter)}`;
      if (aiResolvableFilter) queryParams += `&ai_resolvable=${aiResolvableFilter === "true"}`;
      if (searchQuery) queryParams += `&query=${encodeURIComponent(searchQuery)}`;

      const res = await fetchApi<TicketItem[]>(`/tickets${queryParams}`);
      setTickets(res.data);
      if (res.meta) {
        setTotal(res.meta.total || 0);
        setTotalPages(res.meta.total_pages || 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tickets";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [page, statusFilter, priorityFilter, intentFilter, teamFilter, aiResolvableFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTickets();
  };

  const clearFilters = () => {
    setStatusFilter("");
    setPriorityFilter("");
    setIntentFilter("");
    setTeamFilter("");
    setAiResolvableFilter("");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Live Support Cases
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-semibold border border-indigo-200/60">
              Phase 2 AI Enhanced
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time ticket stream with intent classification, intelligent routing, and AI confidence ({total} cases found)
          </p>
        </div>
      </div>

      {/* Filter Bar with AI Filters */}
      <div className="p-4 bg-white rounded-lg border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket #, subject, or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </form>

          {(statusFilter || priorityFilter || intentFilter || teamFilter || aiResolvableFilter || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          {/* Intent Filter */}
          <select
            value={intentFilter}
            onChange={(e) => {
              setIntentFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All AI Intents</option>
            <option value="payment_successful_order_missing">Payment Missing Order</option>
            <option value="delayed_refund">Delayed Refund</option>
            <option value="subscription">Subscription Inquiry</option>
            <option value="account">Account Security</option>
            <option value="technical">Technical / Hardware</option>
            <option value="general_inquiry">General Inquiry</option>
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => {
              setTeamFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Teams</option>
            <option value="Billing">Billing</option>
            <option value="Order Operations">Order Operations</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Account Security">Account Security</option>
            <option value="Customer Escalations">Customer Escalations</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="waiting_customer">Waiting on Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          {/* AI Resolvable Filter */}
          <select
            value={aiResolvableFilter}
            onChange={(e) => {
              setAiResolvableFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Resolvability</option>
            <option value="true">AI Resolvable</option>
            <option value="false">Human Review Mandated</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <LoadingState message="Querying live cases from Supabase..." description="Applying AI intent, team routing, and status filters." />
      ) : error ? (
        <ErrorState title="Failed to load cases" message={error} onRetry={loadTickets} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No cases match your filters"
          description="Try broadening your search query or resetting filters."
          action={
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md border border-indigo-200/60 transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">AI Intent</th>
                  <th className="py-3 px-4">AI Confidence</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Resolvability</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      <Link href={`/cases/${t.id}`} className="hover:underline">
                        {t.ticket_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {t.customer_name || "Customer"}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-900 font-medium">
                      <Link href={`/cases/${t.id}`} className="hover:text-indigo-600">
                        {t.subject}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                        {t.intent_category || "general"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {t.ai_confidence ? (
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          t.ai_confidence >= 0.90 ? "bg-emerald-50 text-emerald-700" :
                          t.ai_confidence >= 0.70 ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        }`}>
                          {Math.round(t.ai_confidence * 100)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans text-[10px]">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {t.recommended_team || "General Triage"}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        t.priority === "urgent" || t.priority === "high" ? "bg-rose-50 text-rose-700 border border-rose-200/60" :
                        t.priority === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200/60" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {t.ai_resolvable === false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200/60">
                          <XCircle className="w-3 h-3 text-rose-600" /> Human Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> AI Resolvable
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] capitalize font-medium ${
                        t.status === "open" ? "text-blue-600" :
                        t.status === "investigating" ? "text-amber-600 font-semibold" :
                        t.status === "resolved" ? "text-emerald-600" :
                        "text-slate-500"
                      }`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page <span className="font-semibold text-slate-900">{page}</span> of{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span> ({total} cases total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
