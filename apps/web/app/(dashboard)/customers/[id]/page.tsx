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

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<CustomerDetail>(`/customers/${customerId}`);
      setCustomer(res.data);
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
    return <LoadingState message="Loading Customer 360 profile..." description="Fetching profile, order history, and payment ledgers from Supabase." />;
  }

  if (error || !customer) {
    return <ErrorState title="Customer not found" message={error || "Customer record does not exist."} onRetry={loadCustomer} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Link href="/customers" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Customer Directory
      </Link>

      {/* Customer Header Banner */}
      <div className="p-6 bg-white rounded-lg border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center">
            {customer.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{customer.full_name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                {customer.profile?.loyalty_tier || "standard"} tier
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="font-mono text-slate-600">{customer.email}</span>
              <span>•</span>
              <span>{customer.phone || "No phone registered"}</span>
              <span>•</span>
              <span>ID: {customer.external_customer_id || customer.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* LTV KPI Block */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Lifetime Spend</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {formatCurrency(customer.profile?.lifetime_value_cents || 0)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Total Orders</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
              {customer.profile?.total_orders_count || 0}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Section Grid: Orders, Payments, Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Column */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-slate-400" />
            Recent Orders ({customer.recent_orders.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {customer.recent_orders.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No orders found.</p>
            ) : (
              customer.recent_orders.map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-medium text-slate-900">{o.order_number}</div>
                    <div className="text-[10px] text-slate-400">{formatDate(o.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-slate-800">{formatCurrency(o.total_amount_cents)}</div>
                    <span className="capitalize text-[10px] text-blue-600 font-medium">{o.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments Column */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            Payment History ({customer.recent_payments.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {customer.recent_payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No payments on file.</p>
            ) : (
              customer.recent_payments.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono text-[11px] text-slate-700 truncate max-w-[140px]">{p.gateway_transaction_id}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{p.gateway_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-emerald-600">{formatCurrency(p.amount_cents)}</div>
                    <span className="capitalize text-[10px] text-emerald-700 font-medium">{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tickets Column */}
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Inbox className="w-4 h-4 text-slate-400" />
            Support Cases ({customer.recent_tickets.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {customer.recent_tickets.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">Zero support tickets filed.</p>
            ) : (
              customer.recent_tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/cases/${t.id}`}
                  className="py-2.5 block hover:bg-slate-50 -mx-2 px-2 rounded transition-colors text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold text-indigo-600">{t.ticket_number}</span>
                    <span className="capitalize text-slate-500">{t.status}</span>
                  </div>
                  <div className="font-medium text-slate-900 truncate mt-0.5">{t.subject}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
