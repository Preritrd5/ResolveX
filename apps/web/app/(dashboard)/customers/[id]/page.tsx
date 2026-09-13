"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  ShoppingBag,
  CreditCard,
  Inbox,
  Clock,
  ShieldCheck,
  TrendingDown,
  AlertTriangle,
  Activity,
  Zap,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface CustomerDetail {
  id: string;
  external_customer_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at?: string;
  profile?: {
    lifetime_value_cents: number;
    loyalty_tier: string;
    total_orders_count: number;
    total_tickets_count: number;
    churn_risk_score: number;
    sentiment_trend: string;
  };
  recent_tickets: Array<{
    id: string;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    created_at?: string;
  }>;
  recent_orders: Array<{
    id: string;
    order_number: string;
    status: string;
    total_amount_cents: number;
    created_at?: string;
  }>;
  recent_payments: Array<{
    id: string;
    gateway_transaction_id: string;
    gateway_name: string;
    amount_cents: number;
    status: string;
    created_at?: string;
  }>;
}

interface CustomerRiskData {
  customer_id: string;
  full_name: string;
  email: string;
  active_incidents_count: number;
  predictions: Array<{
    id: string;
    incident_id: string;
    incident_number: string;
    classification: string;
    confidence_score: number;
    operational_risk_score: number;
    operational_risk_level: string;
    matched_signals: string[];
    missing_signals: string[];
    prediction_reason: string;
    prediction_method: string;
    predicted_at: string;
    support_ticket_created: boolean;
  }>;
  highest_risk_level: string;
  highest_risk_score: number;
  recommended_proactive_actions: string[];
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [riskData, setRiskData] = useState<CustomerRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const [custRes, riskRes] = await Promise.all([
        fetchApi<CustomerDetail>(`/customers/${customerId}`),
        fetchApi<CustomerRiskData>(`/customers/${customerId}/risk`).catch(() => ({ data: null })),
      ]);
      setCustomer(custRes.data);
      if (riskRes && riskRes.data) {
        setRiskData(riskRes.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load customer profile";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadCustomer();
    }
  }, [customerId]);

  if (loading) {
    return (
      <LoadingState
        message="Loading Customer 360 profile..."
        description="Fetching profile, order history, and payment ledgers from Supabase."
      />
    );
  }

  if (error || !customer) {
    return (
      <ErrorState
        title="Customer not found"
        message={error || "Customer record does not exist."}
        onRetry={loadCustomer}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-xs text-[#464B5E] hover:text-[#24283A] font-heading font-medium transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Customer Directory
      </Link>

      {/* Customer Header Banner */}
      <div className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4] font-heading font-bold text-xl flex items-center justify-center shadow-xs">
            {customer.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#24283A]">{customer.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-heading font-bold uppercase bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4]">
                {customer.profile?.loyalty_tier || "standard"} tier
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#464B5E] mt-1 font-sans">
              <span className="font-mono text-[#24283A] font-medium">{customer.email}</span>
              <span>•</span>
              <span>{customer.phone || "No phone registered"}</span>
              <span>•</span>
              <span className="font-mono">ID: {customer.external_customer_id || customer.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* LTV KPI Block */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-[#D8D6CE] pt-4 md:pt-0 md:pl-6">
          <div>
            <div className="text-[10px] uppercase font-heading font-bold tracking-wider text-[#464B5E]">
              Lifetime Spend
            </div>
            <div className="text-xl font-bold font-mono text-[#24283A] mt-0.5">
              {formatCurrency(customer.profile?.lifetime_value_cents || 0)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-heading font-bold tracking-wider text-[#464B5E]">
              Total Orders
            </div>
            <div className="text-xl font-bold font-mono text-[#24283A] mt-0.5">
              {customer.profile?.total_orders_count || 0}
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 6: Predicted Impact & Operational Risk Card */}
      {riskData && riskData.predictions.length > 0 && (
        <div className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-amber-300 shadow-[0_2px_12px_rgba(35,39,55,0.06)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-2">
                  Predictive Incident Impact &amp; Operational Risk
                </h2>
                <p className="text-xs text-[#464B5E] font-sans">
                  Telemetry correlation &amp; blast radius risk assessment (Pre-ticket awareness)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-heading font-semibold text-[#464B5E]">Risk Score:</span>
              <span className="font-mono text-sm font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-[8px] border border-amber-300">
                {riskData.highest_risk_score.toFixed(0)}/100 &bull; {riskData.highest_risk_level}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {riskData.predictions.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-[#FBFAF7] rounded-[14px] border border-[#D8D6CE] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[6px] bg-[#24283A] text-white">
                      {p.incident_number}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-[6px] text-[10px] font-heading font-bold uppercase ${
                        p.classification === "LIKELY_AFFECTED"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : p.classification === "CONFIRMED_AFFECTED"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {p.classification.replace("_", " ")}
                    </span>
                  </div>

                  <Link
                    href={`/incidents/${p.incident_id}/impact`}
                    className="text-xs font-heading font-semibold text-[#5052C9] hover:underline flex items-center gap-1"
                  >
                    View Blast Radius <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Ground Truth vs Prediction Comparison */}
                <div className="space-y-1.5 text-xs font-sans">
                  <div className="flex items-start gap-1.5">
                    <span className="font-heading font-bold text-[#24283A] min-w-[70px]">Observed:</span>
                    <span className="text-[#464B5E]">
                      {p.support_ticket_created
                        ? "Support ticket submitted by customer."
                        : "No support ticket filed yet (Silent failure victim)."}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-heading font-bold text-amber-800 min-w-[70px]">Predicted:</span>
                    <span className="text-[#24283A] italic">
                      &ldquo;{p.prediction_reason}&rdquo;
                    </span>
                  </div>
                </div>

                {/* Signals */}
                <div className="pt-2 border-t border-[#D8D6CE] flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-heading font-bold text-[#464B5E] uppercase">Signals:</span>
                  {p.matched_signals.map((sig) => (
                    <span
                      key={sig}
                      className="px-1.5 py-0.5 rounded-[4px] bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4]/50 text-[10px] font-mono"
                    >
                      +{sig}
                    </span>
                  ))}
                  <span className="text-[10px] text-[#464B5E] font-mono ml-auto">
                    Confidence: {(p.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended Proactive Actions */}
          {riskData.recommended_proactive_actions.length > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-[#EEF0FA] to-[#E5E4EE] rounded-[14px] border border-[#BFC1E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#24283A] font-medium font-sans">
                <Zap className="w-4 h-4 text-[#5052C9] shrink-0" />
                <span>
                  <strong className="text-[#5052C9] font-heading">Recommended Proactive Outreach:</strong>{" "}
                  {riskData.recommended_proactive_actions.join(", ")}
                </span>
              </div>
              <Link
                href="/proactive"
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6b6dc9] hover:to-[#4143A7] text-white font-heading font-semibold rounded-[9px] shadow-[0_2px_10px_rgba(80,82,201,0.22)] flex items-center gap-1 shrink-0 text-center justify-center transition-all cursor-pointer"
              >
                Open Proactive Queue &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 3-Section Grid: Orders, Payments, Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Column */}
        <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#5052C9]" />
            Recent Orders ({customer.recent_orders.length})
          </h3>
          <div className="divide-y divide-[#D8D6CE]">
            {customer.recent_orders.length === 0 ? (
              <p className="text-xs text-[#464B5E] py-3 font-sans">No orders found.</p>
            ) : (
              customer.recent_orders.map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-[#24283A]">{o.order_number}</div>
                    <div className="text-[10px] text-[#464B5E] font-sans">{formatDate(o.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-[#24283A]">
                      {formatCurrency(o.total_amount_cents)}
                    </div>
                    <span className="capitalize text-[10px] text-[#5052C9] font-medium font-heading">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments Column */}
        <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#5052C9]" />
            Payment History ({customer.recent_payments.length})
          </h3>
          <div className="divide-y divide-[#D8D6CE]">
            {customer.recent_payments.length === 0 ? (
              <p className="text-xs text-[#464B5E] py-3 font-sans">No payments on file.</p>
            ) : (
              customer.recent_payments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono text-[11px] text-[#24283A] truncate max-w-[140px]">
                      {p.gateway_transaction_id}
                    </div>
                    <div className="text-[10px] text-[#464B5E] capitalize font-sans">{p.gateway_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-emerald-700">
                      {formatCurrency(p.amount_cents)}
                    </div>
                    <span className="capitalize text-[10px] text-emerald-800 font-medium font-heading">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tickets Column */}
        <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#5052C9]" />
            Support Cases ({customer.recent_tickets.length})
          </h3>
          <div className="divide-y divide-[#D8D6CE]">
            {customer.recent_tickets.length === 0 ? (
              <p className="text-xs text-[#464B5E] py-3 font-sans">Zero support tickets filed.</p>
            ) : (
              customer.recent_tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/cases/${t.id}`}
                  className="py-2.5 block hover:bg-[#FBFAF7]/70 -mx-2 px-2 rounded-[8px] transition-colors text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-bold text-[#5052C9]">{t.ticket_number}</span>
                    <span className="capitalize text-[#464B5E]">{t.status}</span>
                  </div>
                  <div className="font-heading font-medium text-[#24283A] truncate mt-0.5">{t.subject}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
