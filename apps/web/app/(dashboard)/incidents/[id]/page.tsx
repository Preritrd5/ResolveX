"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  Network,
  Clock,
  Ticket,
  ExternalLink,
  RefreshCw,
  Layers,
  AlertTriangle
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { BlastRadiusMetricCard } from "@/components/incidents/blast-radius-metric-card";
import { IncidentExplainabilityCard } from "@/components/incidents/incident-explainability-card";
import { IncidentTimeline } from "@/components/incidents/incident-timeline";
import { IncidentImpactGraph } from "@/components/incidents/incident-impact-graph";
import { IncidentResolutionPanel } from "@/components/incidents/incident-resolution-panel";

interface IncidentDetail {
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
  resolved_at?: string;
  linked_tickets: Array<{
    id: string;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    customer_name?: string;
    ai_confidence?: number;
    created_at?: string;
  }>;
  blast_radius?: {
    reported_customers_count: number;
    unreported_customers_count: number;
    total_affected_customers: number;
    total_financial_exposure_cents: number;
    gateways_affected?: string[];
    services_affected?: string[];
  };
  explainability?: {
    summary: string;
    why_one_incident: string;
    primary_failure_domain: string;
    supporting_signals?: Array<{
      signal_type: string;
      service?: string;
      error?: string;
      strength?: number;
      description: string;
    }>;
    confidence_rationale?: string;
  };
  likely_root_cause?: {
    component: string;
    failure_type: string;
    status: string;
    first_detected?: string;
    remediation_recommendation?: string;
  };
}

interface GraphData {
  nodes: any[];
  edges: any[];
}

export default function IncidentDetailPage() {
  const params = useParams();
  const incidentId = params?.id as string;

  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"graph" | "timeline" | "tickets">("graph");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [incRes, graphRes, timeRes] = await Promise.all([
        fetchApi<IncidentDetail>(`/incidents/${incidentId}`),
        fetchApi<GraphData>(`/incidents/${incidentId}/graph`),
        fetchApi<any[]>(`/incidents/${incidentId}/timeline`)
      ]);
      setIncident(incRes.data);
      setGraphData(graphRes.data);
      setTimelineEvents(timeRes.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load incident command center";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      loadAll();
    }
  }, [incidentId]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setActionLoading(true);
      setActionNotice(null);
      const res = await fetchApi<{ status: string }>(`/incidents/${incidentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
      setActionNotice(`Incident successfully transitioned to ${newStatus}.`);
      if (incident) {
        setIncident({ ...incident, status: newStatus });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Status update failed";
      setActionNotice(`Action failed: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvestigate = async () => {
    try {
      setActionLoading(true);
      setActionNotice(null);
      const res = await fetchApi<any>(`/incidents/${incidentId}/investigate`, {
        method: "POST"
      });
      setActionNotice(
        `AI Investigation completed: ${res.data.root_cause_analysis?.failure_mechanism || "Root cause verified"}`
      );
      await loadAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Investigation failed";
      setActionNotice(`Investigation failed: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        message="Loading Incident Command Center..."
        description="Correlating cross-customer telemetry, topology graph, and chronological timeline."
      />
    );
  }

  if (error || !incident) {
    return <ErrorState title="Incident Not Found" message={error || "Incident does not exist."} onRetry={loadAll} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Link
          href="/incidents"
          className="inline-flex items-center gap-1.5 text-xs text-[#464B5E] hover:text-[#24283A] font-heading font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Incidents Command Center
        </Link>

        {/* State Machine Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {incident.status !== "confirmed" && (
            <button
              onClick={() => handleStatusChange("confirmed")}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-[11px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Incident
            </button>
          )}

          {incident.status === "confirmed" && (
            <button
              onClick={() => handleStatusChange("resolved")}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-[11px] bg-[#24283A] hover:bg-[#1b1e2b] text-white text-xs font-heading font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Mark as Resolved
            </button>
          )}

          {incident.status !== "dismissed" && incident.status !== "resolved" && (
            <button
              onClick={() => handleStatusChange("dismissed")}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] hover:border-[#D8D6CE] text-[#24283A] text-xs font-heading font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 text-[#464B5E]" /> Dismiss Alarm
            </button>
          )}

          <Link
            href={`/incidents/${incidentId}/impact`}
            className="px-3.5 py-2 rounded-[11px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-heading font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" /> Predictive Impact &amp; Risk
          </Link>

          <button
            onClick={handleInvestigate}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6b6dc9] hover:to-[#4143A7] text-white text-xs font-heading font-semibold flex items-center gap-1.5 shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Re-Investigate with AI
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div className="p-3.5 bg-gradient-to-r from-[#EEF0FA] to-[#E5E4EE] border-[1.5px] border-[#BFC1E4] rounded-[16px] text-xs text-[#24283A] flex items-center justify-between shadow-xs">
          <span className="font-medium">{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="font-bold text-[#5052C9] hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Incident Header Card */}
      <div className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-[8px] bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4]/50">
              {incident.incident_number}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-[8px] text-[10px] font-heading font-bold uppercase ${
                incident.severity === "critical"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : incident.severity === "high"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {incident.severity} Severity
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-[8px] text-[10px] font-heading font-bold capitalize ${
                incident.status === "confirmed"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : incident.status === "resolved"
                  ? "bg-slate-100 text-slate-700 border border-slate-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              Status: {incident.status}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[8px] bg-[#EEF0FA] text-[#5052C9] font-bold border border-[#BFC1E4]">
              Confidence: {Math.round(incident.confidence_score * 100)}%
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#24283A] mt-2.5">{incident.title}</h1>
          <p className="text-xs text-[#464B5E] mt-1 font-sans">
            Detected: {formatDate(incident.detected_at)} • Primary failure:{" "}
            <span className="font-mono font-semibold text-[#24283A]">
              {incident.explainability?.primary_failure_domain || "System Telemetry"}
            </span>
          </p>
        </div>
      </div>

      {/* 2-Column: Blast Radius & Likely Root Cause Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          {incident.blast_radius && (
            <BlastRadiusMetricCard
              reportedCustomersCount={incident.blast_radius.reported_customers_count}
              unreportedCustomersCount={incident.blast_radius.unreported_customers_count}
              totalAffectedCustomers={incident.blast_radius.total_affected_customers}
              totalFinancialExposureCents={incident.blast_radius.total_financial_exposure_cents}
              gatewaysAffected={incident.blast_radius.gateways_affected}
              servicesAffected={incident.blast_radius.services_affected}
            />
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          {incident.likely_root_cause && (
            <div className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" /> Root Cause Diagnosis
                </h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  {incident.likely_root_cause.status}
                </span>
              </div>

              <div className="p-3.5 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE] text-xs space-y-1.5">
                <div className="font-heading font-bold text-[#24283A]">{incident.likely_root_cause.failure_type}</div>
                <div className="text-[11px] text-[#464B5E] font-mono">
                  Component: {incident.likely_root_cause.component}
                </div>
              </div>

              {incident.likely_root_cause.remediation_recommendation && (
                <div className="p-3.5 bg-gradient-to-r from-[#EEF0FA] to-[#E5E4EE] rounded-[14px] border border-[#BFC1E4] text-xs space-y-1">
                  <span className="font-heading font-bold text-[#5052C9] text-[11px] uppercase tracking-wider">
                    Recommended Engineering Fix:
                  </span>
                  <p className="text-[11px] text-[#24283A] leading-relaxed font-normal">
                    {incident.likely_root_cause.remediation_recommendation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* "Why is this one incident?" Explainability Card */}
      {incident.explainability && (
        <IncidentExplainabilityCard
          summary={incident.explainability.summary}
          whyOneIncident={incident.explainability.why_one_incident}
          primaryFailureDomain={incident.explainability.primary_failure_domain}
          supportingSignals={incident.explainability.supporting_signals}
          confidenceRationale={incident.explainability.confidence_rationale}
          confidenceScore={incident.confidence_score}
        />
      )}

      {/* Phase 5: Incident Blast-Radius Bulk Resolution Panel */}
      <IncidentResolutionPanel
        incidentId={incidentId}
        incidentNumber={incident.incident_number}
        linkedTicketCount={incident.linked_tickets.length}
        onExecutionComplete={() => {
          loadAll();
        }}
      />

      {/* Tab Switcher: Impact Graph / Chronological Timeline / Linked Tickets */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#D8D6CE] pb-3">
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-3.5 py-1.5 rounded-[11px] text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "graph"
                ? "bg-[#5052C9] text-white shadow-xs"
                : "bg-[#FBFAF7] text-[#464B5E] border border-[#D8D6CE] hover:border-[#BDBCB5]"
            }`}
          >
            <Network className="w-3.5 h-3.5" /> Customer Impact & Root Cause Graph
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`px-3.5 py-1.5 rounded-[11px] text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "timeline"
                ? "bg-[#5052C9] text-white shadow-xs"
                : "bg-[#FBFAF7] text-[#464B5E] border border-[#D8D6CE] hover:border-[#BDBCB5]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Chronological Timeline ({timelineEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-3.5 py-1.5 rounded-[11px] text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "tickets"
                ? "bg-[#5052C9] text-white shadow-xs"
                : "bg-[#FBFAF7] text-[#464B5E] border border-[#D8D6CE] hover:border-[#BDBCB5]"
            }`}
          >
            <Ticket className="w-3.5 h-3.5" /> Linked Customer Tickets ({incident.linked_tickets.length})
          </button>
          <Link
            href={`/incidents/${incidentId}/impact`}
            className="ml-auto px-3.5 py-1.5 rounded-[11px] text-xs font-heading font-bold flex items-center gap-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-amber-600" /> Deep Impact &amp; Forecast Analysis &rarr;
          </Link>
        </div>

        {/* Tab 1: React Flow Graph */}
        {activeTab === "graph" && graphData && (
          <IncidentImpactGraph nodes={graphData.nodes} edges={graphData.edges} />
        )}

        {/* Tab 2: Chronological Timeline */}
        {activeTab === "timeline" && (
          <IncidentTimeline events={timelineEvents} />
        )}

        {/* Tab 3: Linked Tickets Table */}
        {activeTab === "tickets" && (
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] overflow-hidden">
            <div className="p-4 border-b border-[#D8D6CE] flex items-center justify-between">
              <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A]">
                Correlated Customer Support Tickets ({incident.linked_tickets.length})
              </h3>
              <span className="text-[10px] text-[#464B5E] font-mono">Live Ingestion</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D8D6CE] bg-[#FBFAF7] text-[11px] font-heading font-semibold text-[#464B5E]">
                    <th className="py-2.5 px-4">Ticket</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4">Correlation</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D6CE]">
                  {incident.linked_tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-[#FBFAF7]/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#5052C9]">
                        {t.ticket_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#24283A]">
                        {t.customer_name || "Customer"}
                      </td>
                      <td className="py-3 px-4 text-[#464B5E] max-w-md truncate font-sans">
                        {t.subject}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] text-[11px] border border-emerald-200">
                          {Math.round((t.ai_confidence || 0.88) * 100)}% match
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-0.5 rounded-[8px] text-[10px] font-heading font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/cases/${t.id}`}
                          className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-[#5052C9] hover:underline"
                        >
                          <span>Open Case</span>
                          <ExternalLink className="w-3 h-3" />
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
    </div>
  );
}
