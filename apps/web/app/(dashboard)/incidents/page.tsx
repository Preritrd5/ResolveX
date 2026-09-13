"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertOctagon, Network, ShieldCheck, ArrowRight } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface IncidentItem {
  id: string;
  incident_number: string;
  title: string;
  status: string;
  severity: string;
  root_cause_hypothesis?: string;
  confidence_score: number;
  impact_estimate_customers: number;
  financial_exposure_cents: number;
  detected_at?: string;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIncidents() {
      try {
        setLoading(true);
        const res = await fetchApi<IncidentItem[]>("/incidents");
        setIncidents(res.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load incident intelligence";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadIncidents();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-600">
          <Activity className="w-4 h-4" /> Core Innovation
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Ticket-to-Incident Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">
          Autonomous correlation across disparate customer tickets, payment webhooks, and service telemetry.
        </p>
      </div>

      {/* Incident Canvas Announcement */}
      <div className="p-6 bg-slate-900 text-white rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-4 h-4" /> React Flow Correlation Canvas Slot
          </div>
          <h3 className="text-base font-bold mt-1">Interactive Multi-Signal Correlation Graph</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            In Phase 3, incoming tickets dynamically link to underlying infrastructure service events on an interactive node canvas. Below are the verified incident candidates registered in Supabase.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Scanning incident telemetry..." description="Correlating signals across Supabase service events and open tickets." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Active & Suspected Operational Incidents ({incidents.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-6 bg-white rounded-lg border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800">
                    {inc.incident_number}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      inc.severity === "high" ? "bg-rose-100 text-rose-800 border border-rose-200" :
                      "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {inc.severity} Severity
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-blue-50 text-blue-700 border border-blue-200">
                      {inc.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{inc.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{inc.root_cause_hypothesis}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Confidence</div>
                    <div className="font-mono font-bold text-indigo-600 mt-0.5">{Math.round(inc.confidence_score * 100)}%</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Blast Radius</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{inc.impact_estimate_customers} Customers</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Exposure</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{formatCurrency(inc.financial_exposure_cents)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
