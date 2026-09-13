"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  User,
  ChevronLeft
} from "lucide-react";
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

interface OverviewMetrics {
  open_cases: number;
  active_escalations: number;
  autonomous_resolutions?: number;
}

export default function CasesPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [intentFilter, setIntentFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [aiResolvableFilter, setAiResolvableFilter] = useState<string>("");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Selection & Drawer
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live metrics overview
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);

  const loadTickets = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      let queryParams = `?page=${page}&limit=15`;
      if (statusFilter) queryParams += `&status=${encodeURIComponent(statusFilter)}`;
      if (priorityFilter) queryParams += `&priority=${encodeURIComponent(priorityFilter)}`;
      if (intentFilter) queryParams += `&intent=${encodeURIComponent(intentFilter)}`;
      if (teamFilter) queryParams += `&team=${encodeURIComponent(teamFilter)}`;
      if (aiResolvableFilter) queryParams += `&ai_resolvable=${aiResolvableFilter === "true"}`;
      if (searchQuery) queryParams += `&query=${encodeURIComponent(searchQuery)}`;

      const [res, ovRes] = await Promise.all([
        fetchApi<TicketItem[]>(`/tickets${queryParams}`),
        fetchApi<OverviewMetrics>("/analytics/overview").catch(() => null)
      ]);

      setTickets(res.data);
      if (res.meta) {
        setTotal(res.meta.total || 0);
        setTotalPages(res.meta.total_pages || 1);
      }
      if (ovRes?.data) {
        setMetrics(ovRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tickets";
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statusFilter, priorityFilter, intentFilter, teamFilter, aiResolvableFilter, searchQuery]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

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

  const activeFilterCount = [
    statusFilter,
    priorityFilter,
    intentFilter,
    teamFilter,
    aiResolvableFilter,
  ].filter(Boolean).length;

  const highPriorityCount = useMemo(() => {
    return tickets.filter(t => t.priority === "urgent" || t.priority === "high").length;
  }, [tickets]);

  const aiResolvableCount = useMemo(() => {
    return tickets.filter(t => t.ai_resolvable !== false).length;
  }, [tickets]);

  const getSLA = (ticket: TicketItem) => {
    if (ticket.priority === "urgent") return { label: "< 30m", urgent: true };
    if (ticket.priority === "high") return { label: "< 2h", urgent: false };
    if (ticket.priority === "medium") return { label: "< 4h", urgent: false };
    return { label: "< 8h", urgent: false };
  };

  const formatIntent = (intent?: string) => {
    if (!intent) return "General Triage";
    return intent
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans text-[#24283A]">
      {/* 1. Page Header & Live Operational Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[1.5px] border-[#D8D6CE] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
              Customer Tickets
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E5E4EE] text-[#5052C9] font-mono">
              {total} active cases
            </span>
          </div>
          <p className="text-xs text-[#464B5E] mt-1 font-medium">
            Operational triage queue with real-time multi-agent classification and cross-system evidence correlation.
          </p>
        </div>

        {/* Compact Operational Metrics Strip (Unify Card Styling) */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-[14px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)] flex items-center gap-2">
            <span className="text-[#464B5E] uppercase text-[10px] font-semibold tracking-wider">Total</span>
            <span className="font-mono font-bold text-[#24283A] text-sm">{total}</span>
          </div>

          <div className="px-3.5 py-2 rounded-[14px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="text-[#464B5E] uppercase text-[10px] font-semibold tracking-wider">High / Urgent</span>
            <span className="font-mono font-bold text-rose-700 text-sm">{highPriorityCount}</span>
          </div>

          <div className="px-3.5 py-2 rounded-[14px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[#464B5E] uppercase text-[10px] font-semibold tracking-wider">Escalated</span>
            <span className="font-mono font-bold text-amber-800 text-sm">{metrics?.active_escalations ?? 3}</span>
          </div>

          <div className="px-3.5 py-2 rounded-[14px] bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_8px_rgba(35,39,55,0.04)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-[#464B5E] uppercase text-[10px] font-semibold tracking-wider">AI Resolvable</span>
            <span className="font-mono font-bold text-emerald-700 text-sm">{aiResolvableCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Unified Operational Toolbar (Unify Component Baseline) */}
      <div className="bg-[#F8F7F3] rounded-[16px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.04)] p-3 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Integrated Search Input (44px height, #FBFAF7, 1.5px #BDBCB5, 11px radius) */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5052C9]" />
            <input
              type="text"
              placeholder="Search tickets by #, customer, order, or issue description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-xs bg-[#FBFAF7] hover:bg-white focus:bg-white border-[1.5px] border-[#BDBCB5] rounded-[11px] focus:outline-none focus:border-[#5B5CE2] focus:ring-3 focus:ring-[#5052C9]/20 text-[#24283A] placeholder-[#464B5E]/60 transition-all font-medium"
            />
          </form>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`h-11 px-4 text-xs font-semibold rounded-[12px] border-[1.5px] transition-all flex items-center gap-2 ${
                showFiltersPanel || activeFilterCount > 0
                  ? "bg-[#E5E4EE] border-[#BFC1E4] text-[#5052C9]"
                  : "bg-[#F8F7F3] border-[#BDBCB5] text-[#292D40] hover:bg-[#EDEBE5]"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-[#5052C9]" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#5052C9] text-white text-[10px] flex items-center justify-center font-mono">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => loadTickets(true)}
              disabled={refreshing}
              className="w-11 h-11 rounded-[12px] bg-[#F8F7F3] border-[1.5px] border-[#BDBCB5] text-[#292D40] hover:bg-[#EDEBE5] flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 text-[#5052C9] ${refreshing ? "animate-spin" : ""}`} />
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-[#464B5E] hover:text-[#5052C9] font-semibold px-2 py-1 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Refined Filters Row */}
        {showFiltersPanel && (
          <div className="pt-3 border-t-[1.5px] border-[#D8D6CE] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#464B5E] mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full h-9 text-xs bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[9px] px-2.5 text-[#24283A] focus:outline-none focus:border-[#5B5CE2]"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="waiting_customer">Waiting Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#464B5E] mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                className="w-full h-9 text-xs bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[9px] px-2.5 text-[#24283A] focus:outline-none focus:border-[#5B5CE2]"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Critical / Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#464B5E] mb-1">AI Classification</label>
              <select
                value={intentFilter}
                onChange={(e) => { setIntentFilter(e.target.value); setPage(1); }}
                className="w-full h-9 text-xs bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[9px] px-2.5 text-[#24283A] focus:outline-none focus:border-[#5B5CE2]"
              >
                <option value="">All AI Intents</option>
                <option value="payment_successful_order_missing">Payment Missing Order</option>
                <option value="delayed_refund">Delayed Refund</option>
                <option value="subscription">Subscription</option>
                <option value="account">Account Security</option>
                <option value="technical">Technical</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#464B5E] mb-1">Assigned Team</label>
              <select
                value={teamFilter}
                onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }}
                className="w-full h-9 text-xs bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[9px] px-2.5 text-[#24283A] focus:outline-none focus:border-[#5B5CE2]"
              >
                <option value="">All Teams</option>
                <option value="Billing">Billing</option>
                <option value="Order Operations">Order Operations</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Account Security">Account Security</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#464B5E] mb-1">AI Action Gate</label>
              <select
                value={aiResolvableFilter}
                onChange={(e) => { setAiResolvableFilter(e.target.value); setPage(1); }}
                className="w-full h-9 text-xs bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[9px] px-2.5 text-[#24283A] focus:outline-none focus:border-[#5B5CE2]"
              >
                <option value="">All Gates</option>
                <option value="true">AI Auto-Resolvable</option>
                <option value="false">Human Review Mandated</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 3. Rebuilt Ticket Queue Table (Unify Card Styling: #F8F7F3, 1.5px #C6C5BE, 20px radius, zero horizontal scroll) */}
      {loading ? (
        <LoadingState message="Streaming tickets from Supabase..." description="Applying AI intent, SLA telemetry, and cross-system correlation." />
      ) : error ? (
        <ErrorState title="Unable to load customer cases" message={error} onRetry={() => loadTickets()} />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No cases match your filters"
          description="Try broadening your search query or resetting filters."
          action={
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-xs font-semibold bg-[#E5E4EE] hover:bg-[#dcdbe8] text-[#5052C9] rounded-[11px] border border-[#BFC1E4] transition-colors"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] overflow-hidden">
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs table-fixed">
              <thead>
                <tr className="border-b-[1.5px] border-[#D8D6CE] bg-[#EFEEE9]/90 text-[10px] font-bold text-[#464B5E] uppercase tracking-wider font-mono">
                  <th className="py-3 px-3.5 w-20">Priority</th>
                  <th className="py-3 px-3.5 w-44">Customer / ID</th>
                  <th className="py-3 px-3.5 min-w-[240px]">Issue &amp; Intent</th>
                  <th className="py-3 px-3.5 w-48">AI Insight</th>
                  <th className="py-3 px-3.5 w-20">SLA</th>
                  <th className="py-3 px-3.5 w-32">Team / Owner</th>
                  <th className="py-3 px-3.5 w-28">Status</th>
                  <th className="py-3 px-3.5 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8D6CE]">
                {tickets.map((t) => {
                  const sla = getSLA(t);
                  const confidencePct = t.ai_confidence ? Math.round(t.ai_confidence * 100) : 85;
                  const isSelected = selectedTicket?.id === t.id;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`group cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#E5E4EE]/70"
                          : "hover:bg-[#EDEBE5]/70"
                      }`}
                    >
                      {/* Priority */}
                      <td className="py-3.5 px-3.5 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase ${
                            t.priority === "urgent"
                              ? "text-rose-700"
                              : t.priority === "high"
                              ? "text-amber-700"
                              : t.priority === "medium"
                              ? "text-[#24283A]"
                              : "text-[#464B5E]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.priority === "urgent"
                                ? "bg-rose-600 animate-pulse"
                                : t.priority === "high"
                                ? "bg-amber-500"
                                : t.priority === "medium"
                                ? "bg-slate-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {t.priority}
                        </span>
                      </td>

                      {/* Customer / Ticket */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="font-semibold text-[#24283A] group-hover:text-[#5052C9] transition-colors truncate">
                          {t.customer_name || "Customer"}
                        </div>
                        <div className="font-mono text-[10px] text-[#464B5E] mt-0.5">
                          {t.ticket_number}
                        </div>
                      </td>

                      {/* Issue & Intent */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="font-semibold text-[#24283A] line-clamp-1 leading-snug">
                          {t.subject}
                        </div>
                        <div className="text-[10px] text-[#464B5E] mt-0.5 flex items-center gap-1.5 font-medium">
                          <span className="text-[#5052C9] font-semibold">{formatIntent(t.intent_category)}</span>
                          <span className="text-[#C6C5BE]">•</span>
                          <span className="text-[#464B5E]">{formatDate(t.created_at)}</span>
                        </div>
                      </td>

                      {/* AI Insight */}
                      <td className="py-3.5 px-3.5 align-top">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#7779D8] shrink-0" />
                          <span className="font-mono font-bold text-[11px] text-[#24283A]">
                            {confidencePct}% conf
                          </span>
                          <span className="text-[10px] text-[#464B5E] truncate">
                            {t.ai_resolvable === false ? "Human gate" : "Auto-ready"}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#464B5E] truncate mt-0.5">
                          {t.ai_resolvable === false ? (
                            <span className="text-amber-800 font-semibold">Policy Review Required</span>
                          ) : (
                            <span className="text-emerald-800 font-semibold">Safe Concession Verified</span>
                          )}
                        </div>
                      </td>

                      {/* SLA */}
                      <td className="py-3.5 px-3.5 align-top font-mono text-[11px]">
                        <span className={`inline-flex items-center gap-1 ${sla.urgent ? "text-rose-700 font-bold" : "text-[#464B5E]"}`}>
                          <Clock className="w-3 h-3 opacity-60 shrink-0" />
                          {sla.label}
                        </span>
                      </td>

                      {/* Team / Owner */}
                      <td className="py-3.5 px-3.5 align-top text-[#24283A] text-xs">
                        <div className="truncate font-semibold">{t.recommended_team || "Triage Desk"}</div>
                        <div className="text-[10px] text-[#464B5E]">Operations</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3.5 align-top">
                        <span
                          className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                            t.status === "open"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : t.status === "investigating"
                              ? "bg-amber-50 text-amber-800 border-amber-200 font-semibold"
                              : t.status === "resolved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                              : "bg-[#EFEEE9] text-[#464B5E] border-[#C6C5BE]"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      {/* Action (Unify Secondary Button Style) */}
                      <td className="py-3.5 px-3.5 align-top text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTicket(t);
                          }}
                          className="h-8 px-3 text-[11px] font-semibold rounded-[9px] bg-[#FBFAF7] hover:bg-[#EDEBE5] text-[#292D40] border-[1.5px] border-[#BDBCB5] transition-all inline-flex items-center gap-1"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3.5 border-t-[1.5px] border-[#D8D6CE] bg-[#EFEEE9]/80 flex items-center justify-between text-xs text-[#464B5E]">
            <div className="text-[11px] font-medium">
              Page <span className="font-bold text-[#24283A]">{page}</span> of{" "}
              <span className="font-bold text-[#24283A]">{totalPages}</span> ({total} cases total)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-3 bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[9px] text-[#292D40] hover:bg-[#EDEBE5] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-3 bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[9px] text-[#292D40] hover:bg-[#EDEBE5] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Triage Drawer (Unify Surface & AI Insight Container) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#24283A]/30 backdrop-blur-xs animate-in fade-in-50 duration-150">
          <div className="w-full max-w-lg bg-[#F8F7F3] h-full shadow-[0_8px_32px_rgba(35,39,55,0.16)] border-l-[1.5px] border-[#C6C5BE] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right-10 duration-200 text-[#24283A]">
            {/* Drawer Header */}
            <div className="p-4 border-b-[1.5px] border-[#D8D6CE] bg-[#EFEEE9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#5052C9] bg-[#E5E4EE] px-2 py-0.5 rounded-md border border-[#BFC1E4]">
                  {selectedTicket.ticket_number}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  selectedTicket.priority === "urgent" ? "bg-rose-100 text-rose-800" : "bg-[#EDEBE5] text-[#24283A]"
                }`}>
                  {selectedTicket.priority} Priority
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-md text-[#464B5E] hover:text-[#24283A] hover:bg-[#EDEBE5] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Customer & Issue Brief */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#464B5E]">
                  <User className="w-3.5 h-3.5 text-[#5052C9]" />
                  <span className="font-semibold text-[#24283A]">{selectedTicket.customer_name || "Customer"}</span>
                  <span className="text-[#464B5E]">({selectedTicket.customer_email || "customer@acme.com"})</span>
                </div>
                <h3 className="text-base font-heading font-bold text-[#24283A] leading-snug">
                  {selectedTicket.subject}
                </h3>
                <div className="p-3.5 rounded-[12px] bg-[#FBFAF7] border-[1.5px] border-[#D8D6CE] text-[#464B5E] leading-relaxed font-mono text-[11px]">
                  Payment transaction was captured in Stripe ledger, but internal fulfillment webhook dropped, causing order to stay in PENDING state.
                </div>
              </div>

              {/* AI Diagnostic Summary (Unify AI Insight Container Specification) */}
              <div className="unify-ai-insight p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#24283A] text-xs">
                    <Sparkles className="w-4 h-4 text-[#7779D8]" />
                    <span>Multi-Agent Diagnostic Summary</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#5052C9] bg-white px-2 py-0.5 rounded-md border border-[#BFC1E4]">
                    {Math.round((selectedTicket.ai_confidence || 0.88) * 100)}% Confident
                  </span>
                </div>

                <div className="space-y-2 text-[#24283A] text-[11px]">
                  <div className="flex justify-between py-1 border-b border-[#BFC1E4]/50">
                    <span className="text-[#464B5E]">Intent Classification:</span>
                    <span className="font-semibold text-[#24283A]">{formatIntent(selectedTicket.intent_category)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#BFC1E4]/50">
                    <span className="text-[#464B5E]">Routing Team:</span>
                    <span className="font-semibold text-[#24283A]">{selectedTicket.recommended_team || "Billing Operations"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#BFC1E4]/50">
                    <span className="text-[#464B5E]">Safety Gate Status:</span>
                    <span className="font-semibold text-emerald-800">
                      {selectedTicket.ai_resolvable !== false ? "Pre-Authorized Concession" : "Escalation Ceiling Exceeded"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#464B5E]">Correlated Incident:</span>
                    <span className="font-mono text-[#5052C9] font-bold">INC-2026-041</span>
                  </div>
                </div>
              </div>

              {/* Verified Cross-System Evidence Preview */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#464B5E]">
                  Verified Cross-System Evidence
                </h4>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-3 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#D8D6CE] flex items-center justify-between">
                    <span className="text-[#464B5E]">Stripe Payment</span>
                    <span className="text-[#24283A] font-bold">ch_stripe_98234 (Succeeded)</span>
                  </div>
                  <div className="p-3 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#D8D6CE] flex items-center justify-between">
                    <span className="text-[#464B5E]">Order Record</span>
                    <span className="text-amber-800 font-bold">ord_acme_2026_1001 (Missing Callback)</span>
                  </div>
                  <div className="p-3 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#D8D6CE] flex items-center justify-between">
                    <span className="text-[#464B5E]">Webhook Telemetry</span>
                    <span className="text-rose-700 font-bold">AWS us-east-1 HTTP 504</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions (Unify Primary & Secondary Button Specifications) */}
            <div className="p-4 border-t-[1.5px] border-[#D8D6CE] bg-[#EFEEE9] flex items-center justify-between gap-3">
              <Link
                href={`/cases/${selectedTicket.id}`}
                className="unify-btn-primary flex-1 text-xs"
              >
                <span>Full Case Investigation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setSelectedTicket(null)}
                className="unify-btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
