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
  Building2
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { CopilotPanel } from "@/components/copilot/copilot-panel";

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

export default function CaseDetailPage() {
  const params = useParams();
  const ticketId = params?.id as string;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTicketDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<TicketDetail>(`/tickets/${ticketId}`);
      setTicket(res.data);
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
        <Link href="/cases" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Live Cases
        </Link>
        <div className="flex items-center gap-2">
          {ticket.recommended_team && (
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Team: {ticket.recommended_team}
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${
            ticket.status === "open" ? "bg-blue-50 text-blue-700 border border-blue-200" :
            ticket.status === "investigating" ? "bg-amber-50 text-amber-700 border border-amber-200" :
            "bg-slate-100 text-slate-600"
          }`}>
            Status: {ticket.status}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase bg-slate-100 text-slate-700">
            Priority: {ticket.priority}
          </span>
        </div>
      </div>

      {/* Case Header Banner */}
      <div className="p-6 bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {ticket.ticket_number}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Intent: <span className="font-semibold text-slate-800">{ticket.intent_category || "general_inquiry"}</span>
            </span>
            {ticket.ai_confidence !== undefined && ticket.ai_confidence > 0 && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                AI Confidence: {Math.round(ticket.ai_confidence * 100)}%
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5">{ticket.subject}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reported by <span className="font-semibold text-slate-700">{ticket.customer?.full_name || "Customer"}</span> • {formatDate(ticket.created_at)}
          </p>
        </div>
      </div>

      {/* 3-Column Enterprise Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Conversation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                Conversation ({ticket.messages.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Live Thread</span>
            </h3>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {ticket.messages.map((m) => {
                const isCustomer = m.sender_type === "customer";
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      isCustomer
                        ? "bg-slate-50 border border-slate-200/70 text-slate-800"
                        : "bg-indigo-50/70 border border-indigo-100 text-indigo-950"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1 text-[11px]">
                      <span className={isCustomer ? "text-slate-700" : "text-indigo-900"}>
                        {isCustomer ? ticket.customer?.full_name || "Customer" : "Acme Support Specialist"}
                      </span>
                      <span className="font-normal text-[10px] text-slate-400">{formatDate(m.created_at)}</span>
                    </div>
                    <div className="whitespace-pre-line">{m.content}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-4 text-xs space-y-2.5">
            <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              SLA & Lifecycle Events
            </h4>
            <div className="space-y-2 text-slate-600 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span>Ticket registered: {formatDate(ticket.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
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
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Customer 360 Intelligence
            </h3>

            {ticket.customer ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Full Name:</span>
                  <Link href={`/customers/${ticket.customer.id}`} className="font-semibold text-indigo-600 hover:underline">
                    {ticket.customer.full_name}
                  </Link>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-[11px] text-slate-900">{ticket.customer.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Account Status:</span>
                  <span className={`font-semibold capitalize px-1.5 py-0.5 rounded text-[10px] ${
                    ticket.customer.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>
                    {ticket.customer.status}
                  </span>
                </div>

                {ticket.customer_profile && (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Loyalty Tier:</span>
                      <span className="font-bold text-indigo-700 uppercase">{ticket.customer_profile.loyalty_tier}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Lifetime Value:</span>
                      <span className="font-bold font-mono text-slate-900">{formatCurrency(ticket.customer_profile.lifetime_value_cents)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Total Orders:</span>
                      <span className="font-semibold text-slate-800">{ticket.customer_profile.total_orders_count}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Churn Risk:</span>
                      <span className={`font-semibold ${
                        ticket.customer_profile.churn_risk_score > 0.4 ? "text-rose-600" : "text-emerald-600"
                      }`}>
                        {Math.round(ticket.customer_profile.churn_risk_score * 100)}%
                      </span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">No customer profile linked.</div>
            )}
          </div>

          {/* Commerce Context: Payments & Orders */}
          <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              Commerce & Transaction Audit
            </h3>

            {/* Payment Section */}
            {ticket.linked_payment ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Captured Payment</span>
                  <span className="font-mono text-emerald-600 font-bold">{formatCurrency(ticket.linked_payment.amount_cents)}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Charge: <span className="text-slate-800 font-semibold">{ticket.linked_payment.gateway_transaction_id}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex justify-between">
                  <span>Gateway: <span className="capitalize font-medium text-slate-700">{ticket.linked_payment.gateway_name}</span></span>
                  <span className="font-bold text-emerald-700 uppercase text-[10px]">VERIFIED CAPTURE</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 rounded border border-amber-200/60 text-xs text-amber-800">
                No payment record directly linked in basic view.
              </div>
            )}

            {/* Order Section */}
            {ticket.linked_order ? (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Order {ticket.linked_order.order_number}</span>
                  <span className="capitalize font-semibold text-blue-600">{ticket.linked_order.status}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-rose-50/70 rounded border border-rose-200/70 text-xs text-rose-800 font-medium">
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
    </div>
  );
}
