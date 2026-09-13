"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  CreditCard,
  Package,
  Clock,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  Bot,
  Activity,
  CheckCircle2,
  Building2,
  AlertOctagon,
  ArrowRight,
  Network
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { CopilotPanel } from "@/components/copilot/copilot-panel";
import { MultiAgentBoard } from "@/components/investigation/multi-agent-board";
import { ResolutionPanel } from "@/components/resolution/resolution-panel";
import { ActionHistoryCard } from "@/components/resolution/action-history-card";

interface TicketDetail {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  intent_category?: string;
  sentiment_score: number;
  ai_confidence?: number;
  recommended_team?: string;
  ai_resolvable?: boolean;
  created_at?: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    status: string;
  };
  customer_profile?: {
    loyalty_tier: string;
    lifetime_value_cents: number;
    total_orders_count: number;
    total_tickets_count: number;
    churn_risk_score: number;
  };
  messages: Array<{
    id: string;
    sender_type: string;
    content: string;
    created_at?: string;
  }>;
  linked_order?: {
    id: string;
    order_number: string;
    status: string;
    total_amount_cents: number;
  };
  linked_payment?: {
    id: string;
    gateway_transaction_id: string;
    gateway_name: string;
    amount_cents: number;
    status: string;
  };
}

interface TicketIncidentLink {
  ticket_id: string;
  is_linked: boolean;
  incident_id?: string;
  incident_number?: string;
  incident_title?: string;
  correlation_score: number;
  incident_status?: string;
  incident_severity?: string;
  co_affected_count: number;
  root_cause_summary?: string;
}

export default function CaseDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [incidentLink, setIncidentLink] = useState<TicketIncidentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const loadTicketDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketRes, incidentRes] = await Promise.all([
        fetchApi<TicketDetail>(`/tickets/${ticketId}`),
        fetchApi<TicketIncidentLink>(`/tickets/${ticketId}/incident`).catch(() => ({ data: null }))
      ]);
      setTicket(ticketRes.data);
      if (incidentRes && incidentRes.data) {
        setIncidentLink(incidentRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load case details";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (ticketId) {
      loadTicketDetail();
    }
  }, [ticketId]);

  const handleAnalysisComplete = (analysisData: any) => {
    if (ticket && analysisData.routing) {
      setTicket({
        ...ticket,
        recommended_team: analysisData.routing.recommended_team,
        ai_confidence: analysisData.overall_confidence,
        intent_category: analysisData.intent.intent,
        priority: analysisData.routing.priority
      });
    }
  };

  if (loading) {
    return <LoadingState message="Loading case workspace..." description="Retrieving ticket conversation, customer 360 profile, and financial records from Supabase." />;
  }

  if (error || !ticket) {
    return <ErrorState title="Case not found" message={error || "Ticket does not exist."} onRetry={loadTicketDetail} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex items-center justify-between">
        <Link href="/cases" className="inline-flex items-center gap-1.5 text-xs text-[#464B5E] hover:text-[#24283A] font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Live Cases
        </Link>
        <div className="flex items-center gap-2">
          {ticket.recommended_team && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[#E5E4EE] text-[#5052C9] border border-[#BFC1E4]">
              Team: {ticket.recommended_team}
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
            ticket.status === "open" ? "bg-blue-50 text-blue-700 border border-blue-200" :
            ticket.status === "investigating" ? "bg-amber-50 text-amber-700 border border-amber-200" :
            "bg-[#FBFAF7] text-[#464B5E] border border-[#BDBCB5]"
          }`}>
            Status: {ticket.status}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase bg-[#FBFAF7] text-[#24283A] border border-[#BDBCB5]">
            Priority: {ticket.priority}
          </span>
        </div>
      </div>

      {/* Case Header Banner */}
      <div className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#5052C9] bg-[#E5E4EE] px-2 py-0.5 rounded-[6px]">
              {ticket.ticket_number}
            </span>
            <span className="text-xs text-[#464B5E] font-mono">
              Intent: <span className="font-semibold text-[#24283A]">{ticket.intent_category || "general_inquiry"}</span>
            </span>
            {ticket.ai_confidence !== undefined && ticket.ai_confidence > 0 && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                AI Confidence: {Math.round(ticket.ai_confidence * 100)}%
              </span>
            )}
          </div>
          <h1 className="text-xl font-heading font-bold text-[#24283A] mt-1.5">{ticket.subject}</h1>
          <p className="text-xs text-[#73778B] mt-1">
            Reported by <span className="font-semibold text-[#464B5E]">{ticket.customer?.full_name || "Customer"}</span> • {formatDate(ticket.created_at)}
          </p>
        </div>
      </div>

      {/* Systemic Incident Correlation Banner (Phase 4 Ticket-to-Incident Intelligence) */}
      {incidentLink && incidentLink.is_linked && (
        <div className="p-4 bg-[#24283A] text-[#EDEBE5] rounded-[16px] border border-[#3E4358] shadow-[0_2px_12px_rgba(35,39,55,0.08)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-[6px] border border-rose-500/30">
                <AlertOctagon className="w-3.5 h-3.5" /> Systemic Incident Detected
              </span>
              <span className="font-mono text-xs font-bold text-[#BFC1E4]">
                {incidentLink.incident_number}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[6px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {Math.round(incidentLink.correlation_score * 100)}% Multi-Signal Match
              </span>
            </div>
            <div className="text-xs text-[#EDEBE5] font-medium">
              This case is a verified symptom of: <strong className="text-white font-heading">{incidentLink.incident_title}</strong>.
              Co-affects <strong className="text-emerald-400">{incidentLink.co_affected_count} customers</strong>.
            </div>
            {incidentLink.root_cause_summary && (
              <div className="text-[11px] text-[#A2A4B8] line-clamp-1 font-mono">
                Root Cause: {incidentLink.root_cause_summary}
              </div>
            )}
          </div>
          <Link
            href={`/incidents/${incidentLink.incident_id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6A6CD2] hover:to-[#4547B8] text-white text-xs font-heading font-semibold transition-all whitespace-nowrap shadow-[0_2px_10px_rgba(80,82,201,0.22)]"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Open Incident Command Center</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {incidentLink && !incidentLink.is_linked && (
        <div className="px-4 py-2.5 bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] rounded-[16px] text-xs text-[#464B5E] flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#73778B]"></span>
            Cross-Customer Correlation: Single-Case Inquiry (No cross-customer systemic incident detected, correlation score &lt; 0.40).
          </span>
          <span className="text-[10px] text-[#73778B] font-mono">Independent Case Resolution Queue</span>
        </div>
      )}

      {/* Prominent Multi-Agent Investigation Layer (LangGraph) */}

      <MultiAgentBoard
        ticketId={ticketId}
        onInvestigationComplete={handleAnalysisComplete}
      />

      {/* 3-Column Enterprise Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Conversation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-5 space-y-4">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#5052C9]" />
                Conversation ({ticket.messages.length})
              </span>
              <span className="text-[10px] text-[#73778B] font-mono">Live Thread</span>
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {ticket.messages.map((m) => {
                const isCustomer = m.sender_type === "customer";
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-[14px] text-xs leading-relaxed ${
                      isCustomer
                        ? "bg-[#FBFAF7] border border-[#BDBCB5] text-[#24283A]"
                        : "bg-[#EEF0FA] border border-[#BFC1E4] text-[#24283A]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1 text-[11px]">
                      <span className={isCustomer ? "text-[#464B5E] font-heading" : "text-[#5052C9] font-heading font-bold"}>
                        {isCustomer ? ticket.customer?.full_name || "Customer" : "Acme Support Specialist"}
                      </span>
                      <span className="font-normal text-[10px] text-[#73778B]">{formatDate(m.created_at)}</span>
                    </div>
                    <div className="whitespace-pre-line font-sans">{m.content}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-4 text-xs space-y-2.5">
            <h4 className="font-heading font-bold uppercase tracking-wider text-[11px] text-[#464B5E] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#73778B]" />
              SLA &amp; Lifecycle Events
            </h4>
            <div className="space-y-2 text-[#464B5E] text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5052C9]"></span>
                <span>Ticket registered: {formatDate(ticket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Customer 360 profile linked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Single-case AI diagnostic available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Customer Context & Commerce Telemetry (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer 360 Card */}
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-5 space-y-3">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#5052C9]" />
              Customer 360 Intelligence
            </h3>

            {ticket.customer ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#D8D6CE]">
                  <span className="text-[#73778B]">Full Name:</span>
                  <Link href={`/customers/${ticket.customer.id}`} className="font-semibold text-[#5052C9] hover:underline">
                    {ticket.customer.full_name}
                  </Link>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D8D6CE]">
                  <span className="text-[#73778B]">Email:</span>
                  <span className="font-mono text-[11px] text-[#24283A]">{ticket.customer.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#D8D6CE]">
                  <span className="text-[#73778B]">Account Status:</span>
                  <span className={`font-semibold capitalize px-1.5 py-0.5 rounded-[6px] text-[10px] ${
                    ticket.customer.status === "active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {ticket.customer.status}
                  </span>
                </div>

                {ticket.customer_profile && (
                  <>
                    <div className="flex justify-between py-1 border-b border-[#D8D6CE]">
                      <span className="text-[#73778B]">Loyalty Tier:</span>
                      <span className="font-bold text-[#5052C9] uppercase">{ticket.customer_profile.loyalty_tier}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#D8D6CE]">
                      <span className="text-[#73778B]">Lifetime Value:</span>
                      <span className="font-bold font-mono text-[#24283A]">{formatCurrency(ticket.customer_profile.lifetime_value_cents)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#D8D6CE]">
                      <span className="text-[#73778B]">Total Orders:</span>
                      <span className="font-semibold text-[#24283A]">{ticket.customer_profile.total_orders_count}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#73778B]">Churn Risk:</span>
                      <span className={`font-semibold ${
                        ticket.customer_profile.churn_risk_score > 0.4 ? "text-rose-600" : "text-emerald-700"
                      }`}>
                        {Math.round(ticket.customer_profile.churn_risk_score * 100)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#73778B] italic">No customer profile linked.</div>
            )}
          </div>

          {/* Commerce Context: Payments & Orders */}
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-5 space-y-3">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#5052C9]" />
              Commerce &amp; Transaction Audit
            </h3>

            {/* Payment Section */}
            {ticket.linked_payment ? (
              <div className="p-3 bg-[#FBFAF7] rounded-[14px] border border-[#BDBCB5] text-xs space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between font-semibold text-[#24283A]">
                  <span className="font-heading">Captured Payment</span>
                  <span className="font-mono text-emerald-700 font-bold">{formatCurrency(ticket.linked_payment.amount_cents)}</span>
                </div>
                <div className="text-[11px] text-[#464B5E] font-mono">
                  Charge: <span className="text-[#24283A] font-semibold">{ticket.linked_payment.gateway_transaction_id}</span>
                </div>
                <div className="text-[11px] text-[#73778B] flex justify-between">
                  <span>Gateway: <span className="capitalize font-medium text-[#464B5E]">{ticket.linked_payment.gateway_name}</span></span>
                  <span className="font-bold text-emerald-800 uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded-[4px] border border-emerald-200">VERIFIED CAPTURE</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 rounded-[12px] border border-amber-200/60 text-xs text-amber-800">
                No payment record directly linked in basic view.
              </div>
            )}

            {/* Order Section */}
            {ticket.linked_order ? (
              <div className="p-3 bg-[#FBFAF7] rounded-[14px] border border-[#BDBCB5] text-xs space-y-1 shadow-xs">
                <div className="flex items-center justify-between font-semibold text-[#24283A]">
                  <span className="font-heading">Order {ticket.linked_order.order_number}</span>
                  <span className="capitalize font-semibold text-[#5052C9]">{ticket.linked_order.status}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50/70 rounded-[12px] border border-rose-200/70 text-xs text-rose-800 font-medium">
                ⚠️ Order Discrepancy: Payment was captured on gateway, but zero corresponding order records exist in fulfillment pipeline.
              </div>
            )}
          </div>
        </div>

        {/* Right: ResolveX AI Support Copilot (4 cols) */}
        <div className="lg:col-span-4">
          <CopilotPanel
            ticketId={ticketId}
            customerName={ticket.customer?.full_name}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </div>
      </div>

      {/* Phase 5: Autonomous Resolution Engine & Verified Execution Layer */}
      <div className="space-y-6 pt-2">
        <ResolutionPanel
          ticketId={ticketId}
          ticketNumber={ticket.ticket_number}
          ticketStatus={ticket.status}
          onActionExecuted={() => {
            setRefreshHistory((prev) => prev + 1);
            loadTicketDetail();
          }}
        />

        <ActionHistoryCard
          ticketId={ticketId}
          refreshTrigger={refreshHistory}
        />
      </div>
    </div>
  );
}
