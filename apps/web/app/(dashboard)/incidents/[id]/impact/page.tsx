"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  Users,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { ImpactTrendChart } from "@/components/impact/impact-trend-chart";
import { ForecastCard } from "@/components/impact/forecast-card";
import { CustomerRiskMatrix } from "@/components/impact/customer-risk-matrix";

interface IncidentImpactOverview {
  incident_id: string;
  incident_number: string;
  total_evaluated: number;
  confirmed_count: number;
  likely_count: number;
  potential_count: number;
  not_affected_count: number;
  total_at_risk_exposure_cents: number;
  predictions: any[];
}

interface IncidentBasic {
  id: string;
  incident_number: string;
  title: string;
  severity: string;
  status: string;
}

export default function IncidentImpactPage() {
  const params = useParams();
  const incidentId = params?.id as string;

  const [incident, setIncident] = useState<IncidentBasic | null>(null);
  const [overview, setOverview] = useState<IncidentImpactOverview | null>(null);
  const [trendPoints, setTrendPoints] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [incRes, ovRes, trendRes, fcRes] = await Promise.all([
        fetchApi<IncidentBasic>(`/incidents/${incidentId}`),
        fetchApi<IncidentImpactOverview>(`/incidents/${incidentId}/impact`),
        fetchApi<{ points: any[] }>(`/incidents/${incidentId}/impact/trend`),
        fetchApi<any>(`/incidents/${incidentId}/impact/forecast`),
      ]);

      setIncident(incRes.data);
      setOverview(ovRes.data);
      setTrendPoints(trendRes.data?.points || []);
      setForecast(fcRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load incident impact intelligence";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      setNotice(null);
      const res = await fetchApi<IncidentImpactOverview>(`/incidents/${incidentId}/impact/analyze`, {
        method: "POST",
      });
      setOverview(res.data);
      // Reload forecast & trend as well
      const [trendRes, fcRes] = await Promise.all([
        fetchApi<{ points: any[] }>(`/incidents/${incidentId}/impact/trend`),
        fetchApi<any>(`/incidents/${incidentId}/impact/forecast`),
      ]);
      setTrendPoints(trendRes.data?.points || []);
      setForecast(fcRes.data);
      setNotice("Predictive impact model completed: customer candidates evaluated against operational telemetry.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analysis run failed";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      loadData();
    }
  }, [incidentId]);

  if (loading) {
    return (
      <LoadingState
        message="Loading Predictive Impact Intelligence..."
        description="Correlating customer payment ledgers, gateway logs, and carrier tracking across blast radius."
      />
    );
  }

  if (error || !incident) {
    return (
      <ErrorState
        title="Impact Intelligence Unavailable"
        message={error || "Incident could not be found."}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/incidents/${incidentId}`}
            className="inline-flex items-center gap-1.5 text-xs text-[#464B5E] hover:text-[#24283A] font-medium transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Incident {incident.incident_number}
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-bold tracking-tight text-[#24283A]">
              Predictive Impact &amp; Forecasting
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                incident.severity === "critical"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {incident.severity}
            </span>
          </div>
          <p className="text-xs text-[#464B5E] mt-1">
            Blast radius customer categorization, demand projections, and operational risk scoring for{" "}
            <span className="font-semibold text-[#24283A]">{incident.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={analyzing}
            className="p-2 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] hover:bg-[#EDEBE5] text-[#24283A] transition-colors shadow-xs cursor-pointer"
            title="Refresh impact data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="px-3.5 py-2 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6A6CD2] hover:to-[#4547B8] text-white text-xs font-heading font-semibold flex items-center gap-2 shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
            {analyzing ? "Correlating Telemetry..." : "Re-Run Predictive Analysis"}
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[14px] text-xs text-emerald-900 flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {notice}
          </span>
          <button
            onClick={() => setNotice(null)}
            className="font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4 Classification Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Confirmed Affected */}
        <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider">Confirmed Affected</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-950 mt-1.5">
            {overview?.confirmed_count ?? 0}
          </div>
          <p className="text-[11px] text-rose-600 mt-1">Ticket filed &amp; signature matched</p>
        </div>

        {/* Likely Affected */}
        <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider">Likely Affected</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-950 mt-1.5">
            {overview?.likely_count ?? 0}
          </div>
          <p className="text-[11px] text-amber-600 mt-1">Telemetry matched, silent so far</p>
        </div>

        {/* Potential Exposure */}
        <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider">Potential Exposure</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-950 mt-1.5">
            {overview?.potential_count ?? 0}
          </div>
          <p className="text-[11px] text-blue-600 mt-1">Partial criteria &amp; adjacent window</p>
        </div>

        {/* Not Affected */}
        <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="flex items-center justify-between text-[#464B5E]">
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider">Not Affected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#24283A] mt-1.5">
            {overview?.not_affected_count ?? 0}
          </div>
          <p className="text-[11px] text-[#73778B] mt-1">Normal execution verified</p>
        </div>

        {/* Total Exposure Value */}
        <div className="p-4 bg-[#24283A] text-white rounded-[20px] shadow-[0_2px_12px_rgba(35,39,55,0.08)] border border-[#3E4358] col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-[#BFC1E4]">
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider">At-Risk Value</span>
            <DollarSign className="w-4 h-4 text-[#7779D8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">
            {formatCurrency(overview?.total_at_risk_exposure_cents ?? 0)}
          </div>
          <p className="text-[11px] text-[#A2A4B8] mt-1">Across {overview?.total_evaluated ?? 0} evaluated candidates</p>
        </div>
      </div>

      {/* Chronological Trend & Near-term Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <ImpactTrendChart points={trendPoints} />
        </div>
        <div className="lg:col-span-5">
          <ForecastCard forecast={forecast} />
        </div>
      </div>

      {/* Customer Risk Prioritization Matrix */}
      <div>
        <CustomerRiskMatrix
          predictions={overview?.predictions || []}
          incidentId={incidentId}
          onRefresh={loadData}
        />
      </div>
    </div>
  );
}
