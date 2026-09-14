"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Mail,
  Smartphone,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sliders,
  BellRing
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface EarlyWarning {
  id: string;
  component: string;
  alert_level: "low" | "medium" | "high";
  metric_name: string;
  baseline_rate: number;
  current_rate: number;
  rate_increase_percentage: number;
  signal_count: number;
  time_window_minutes: number;
  summary: string;
  status: "active" | "investigating" | "promoted" | "dismissed";
  incident_id?: string;
  created_at: string;
}

interface ProactiveRecommendation {
  id: string;
  prediction_id: string;
  incident_id: string;
  incident_number: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  notification_type: string;
  channel: "EMAIL" | "SMS" | "PORTAL_BANNER";
  subject: string;
  template_id?: string;
  message_content: string;
  policy_decision: "ALLOW" | "REQUIRE_APPROVAL" | "BLOCK";
  policy_reason: string;
  status: "DRAFTED" | "APPROVED" | "SENT" | "FAILED" | "CANCELLED";
  deduplication_key: string;
  approved_by?: string;
  approved_at?: string;
  sent_at?: string;
  created_at: string;
}

interface PredictionMetrics {
  total_predictions: number;
  ground_truth_count: number;
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  accuracy: number;
  f1_score: number;
  is_statistically_significant: boolean;
  min_required_samples: number;
  model_version: string;
  evaluated_at: string;
  note: string;
}

export default function ProactiveSupportPage() {
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [recommendations, setRecommendations] = useState<ProactiveRecommendation[]>([]);
  const [metrics, setMetrics] = useState<PredictionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [warnRes, recoRes, metRes] = await Promise.all([
        fetchApi<EarlyWarning[]>("/early-warnings"),
        fetchApi<ProactiveRecommendation[]>("/proactive"),
        fetchApi<PredictionMetrics>("/predictions/metrics"),
      ]);
      setWarnings(warnRes.data || []);
      setRecommendations(recoRes.data || []);
      setMetrics(metRes.data || null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load proactive support queue";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleDetectEmerging = async () => {
    try {
      setActionLoading(true);
      setNotice(null);
      const res = await fetchApi<{ early_warnings: EarlyWarning[]; message: string }>(
        "/incidents/detect-emerging",
        { method: "POST" }
      );
      setNotice(res.data?.message || "Anomaly detection scan completed.");
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvestigateWarning = async (warningId: string) => {
    try {
      setActionLoading(true);
      setNotice(null);
      const res = await fetchApi<any>(`/early-warnings/${warningId}/investigate`, {
        method: "POST",
      });
      setNotice(`Promoted warning to Incident ${res.data?.incident_number || "investigation"}.`);
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Investigation promotion failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissWarning = async (warningId: string) => {
    try {
      setActionLoading(true);
      setNotice(null);
      await fetchApi<any>(`/early-warnings/${warningId}/dismiss`, {
        method: "POST",
      });
      setNotice("Anomaly warning dismissed.");
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dismiss failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setActionLoading(true);
      setNotice(null);
      const res = await fetchApi<{ recommendations: ProactiveRecommendation[]; count: number }>(
        "/proactive/recommend",
        { method: "POST" }
      );
      setNotice(`Generated ${res.data?.count ?? 0} proactive outreach recommendations through policy gate.`);
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate proactive recommendations");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await fetchApi<ProactiveRecommendation>(`/proactive/${id}/approve`, {
        method: "POST",
      });
      setNotice("Recommendation approved by operator.");
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      setActionLoading(true);
      await fetchApi<ProactiveRecommendation>(`/proactive/${id}/send`, {
        method: "POST",
      });
      setNotice("Controlled customer notification dispatched via simulated channel.");
      await loadAll();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dispatch failed");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRecos = recommendations.filter((r) => {
    if (activeFilter === "ALL") return true;
    return r.status === activeFilter;
  });

  if (loading) {
    return (
      <LoadingState
        message="Loading Proactive Support Queue..."
        description="Synchronizing anomaly alarms, blast radius recommendations, and deduplication policy gates."
      />
    );
  }

  if (error && !recommendations.length && !warnings.length) {
    return <ErrorState title="Proactive Support Queue Error" message={error} onRetry={loadAll} />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-[10px] bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4]">
              <Zap className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#24283A]">
              Proactive Support &amp; Incident Alarms
            </h1>
          </div>
          <p className="text-sm text-[#464B5E] mt-1 font-sans">
            Autonomous early warning detection, customer outreach policy gates, and anti-spam deduplication
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadAll}
            disabled={actionLoading}
            className="p-2.5 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] hover:border-[#D8D6CE] text-[#464B5E] transition-all shadow-xs cursor-pointer"
            title="Refresh queue"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleDetectEmerging}
            disabled={actionLoading}
            className="px-3.5 py-2.5 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] hover:border-[#D8D6CE] text-[#24283A] text-xs font-heading font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-600" />
            Scan Anomalies
          </button>
          <button
            onClick={handleGenerateRecommendations}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6b6dc9] hover:to-[#4143A7] text-white text-xs font-heading font-semibold flex items-center gap-1.5 shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Outreach Tasks
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="p-3.5 bg-gradient-to-r from-[#EEF0FA] to-[#E5E4EE] border-[1.5px] border-[#BFC1E4] rounded-[16px] text-xs text-[#24283A] flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {notice}
          </span>
          <button onClick={() => setNotice(null)} className="font-bold text-[#5052C9] hover:underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: Emerging Issues & Early Warnings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Early Warnings &amp; Anomaly Signals
          </h2>
          <span className="text-[11px] text-[#464B5E] font-mono">
            {warnings.filter((w) => w.status === "active").length} Active Alarms
          </span>
        </div>

        {warnings.length === 0 ? (
          <div className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] text-center text-xs text-[#464B5E] font-sans">
            No active early warning anomalies detected. All baseline signals within normal operational thresholds.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warnings.map((w) => (
              <div
                key={w.id}
                className={`p-6 rounded-[20px] border-[1.5px] shadow-[0_2px_12px_rgba(35,39,55,0.06)] transition-all ${
                  w.status === "active"
                    ? "bg-[#F8F7F3] border-amber-300 hover:border-amber-400"
                    : "bg-[#FBFAF7] border-[#D8D6CE] text-[#464B5E]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[6px] bg-[#24283A] text-white">
                        {w.component}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-[8px] text-[10px] font-heading font-bold uppercase ${
                          w.alert_level === "high"
                            ? "bg-rose-100 text-rose-800 border border-rose-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {w.alert_level} Alert
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 font-mono">
                        +{w.rate_increase_percentage.toFixed(1)}% vs baseline
                      </span>
                    </div>
                    <p className="text-xs text-[#24283A] font-heading font-semibold mt-2.5">{w.summary}</p>
                    <p className="text-[11px] text-[#464B5E] mt-1 font-sans">
                      {w.signal_count} anomalous events in the last {w.time_window_minutes}m (Baseline: {w.baseline_rate}/hr &rarr; Current: {w.current_rate}/hr)
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-[6px] uppercase font-bold ${
                      w.status === "active"
                        ? "bg-amber-200 text-amber-900 border border-amber-300"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {w.status}
                  </span>
                </div>

                {w.status === "active" && (
                  <div className="mt-4 pt-3 border-t border-[#D8D6CE] flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDismissWarning(w.id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 text-xs font-heading font-semibold text-[#464B5E] hover:bg-[#D8D6CE]/40 rounded-[8px] transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleInvestigateWarning(w.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-heading font-semibold rounded-[9px] shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" /> Investigate Incident
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Proactive Support Queue */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <Send className="w-4 h-4 text-[#5052C9]" /> Proactive Customer Communications Queue
            </h2>
            <p className="text-xs text-[#464B5E] mt-0.5 font-sans">
              Policy-governed outreach tasks for customers identified before support ticket submission
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#FBFAF7] border border-[#D8D6CE] p-1 rounded-[12px]">
            {["ALL", "DRAFTED", "APPROVED", "SENT"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 text-xs font-heading font-semibold rounded-[8px] transition-all cursor-pointer ${
                  activeFilter === filter
                    ? "bg-[#5052C9] text-white shadow-xs"
                    : "text-[#464B5E] hover:text-[#24283A]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredRecos.length === 0 ? (
          <div className="p-10 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] text-center">
            <Zap className="w-8 h-8 text-[#5052C9]/40 mx-auto mb-2" />
            <p className="text-sm font-heading font-bold text-[#24283A]">No proactive outreach tasks in queue</p>
            <p className="text-xs text-[#464B5E] mt-1 max-w-md mx-auto font-sans">
              Click &quot;Generate Outreach Tasks&quot; above to run blast-radius candidate evaluation and generate policy-gated communications.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecos.map((reco) => (
              <div
                key={reco.id}
                className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] hover:border-[#BDBCB5] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/incidents/${reco.incident_id}/impact`}
                      className="font-mono text-xs font-bold text-[#5052C9] hover:underline flex items-center gap-1"
                    >
                      {reco.incident_number}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span className="text-[#D8D6CE]">&bull;</span>
                    <span className="text-xs font-heading font-semibold text-[#24283A]">
                      {reco.customer_name || "Customer"}
                    </span>
                    <span className="text-xs text-[#464B5E] font-mono">
                      ({reco.customer_email})
                    </span>
                    <span className="text-[#D8D6CE]">&bull;</span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#464B5E] px-2 py-0.5 rounded-[6px] bg-[#FBFAF7] border border-[#D8D6CE]">
                      {reco.channel === "EMAIL" && <Mail className="w-3 h-3 text-[#5052C9]" />}
                      {reco.channel === "SMS" && <Smartphone className="w-3 h-3 text-[#5052C9]" />}
                      {reco.channel}
                    </span>

                    {/* Policy Decision Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-[8px] text-[10px] font-heading font-bold uppercase ${
                        reco.policy_decision === "ALLOW"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : reco.policy_decision === "REQUIRE_APPROVAL"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}
                    >
                      Policy: {reco.policy_decision}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-[6px] text-[10px] font-mono font-bold uppercase ${
                        reco.status === "SENT"
                          ? "bg-emerald-600 text-white"
                          : reco.status === "APPROVED"
                          ? "bg-[#5052C9] text-white"
                          : "bg-[#FBFAF7] border border-[#D8D6CE] text-[#464B5E]"
                      }`}
                    >
                      {reco.status}
                    </span>
                  </div>

                  {/* Subject & Preview */}
                  <div>
                    <h4 className="text-xs font-heading font-bold text-[#24283A]">{reco.subject}</h4>
                    <p className="text-xs text-[#464B5E] mt-1 line-clamp-2 italic bg-[#FBFAF7] p-2.5 rounded-[10px] border border-[#D8D6CE] font-sans">
                      &ldquo;{reco.message_content}&rdquo;
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[#464B5E]">
                    <span className="font-mono">Key: {reco.deduplication_key}</span>
                    <span>&bull;</span>
                    <span className="font-sans">Policy check: {reco.policy_reason}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end md:justify-start pt-2 md:pt-0 border-t md:border-t-0 border-[#D8D6CE]/60">
                  {reco.status === "DRAFTED" && (
                    <button
                      onClick={() => handleApprove(reco.id)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-[11px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Outreach
                    </button>
                  )}

                  {reco.status === "APPROVED" && (
                    <button
                      onClick={() => handleSend(reco.id)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6b6dc9] hover:to-[#4143A7] text-white text-xs font-heading font-semibold flex items-center gap-1.5 shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch (Simulated)
                    </button>
                  )}

                  {reco.status === "SENT" && (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-heading font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-[8px] border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Dispatched
                      </span>
                      {reco.sent_at && (
                        <p className="text-[10px] text-[#464B5E] mt-0.5 font-sans">
                          {formatDate(reco.sent_at)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Prediction Feedback & Model Telemetry */}
      {metrics && (
        <div className="p-6 bg-[#24283A] text-white rounded-[20px] shadow-sm border border-[#353b52] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-[#7779D8] uppercase tracking-widest">
                <Sliders className="w-4 h-4" /> Prediction Model Observability
              </div>
              <h3 className="text-base font-heading font-bold text-white mt-1">
                Model: {metrics.model_version} &bull; Feedback &amp; Verification
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              Evaluated: {formatDate(metrics.evaluated_at)}
            </span>
          </div>

          {/* Insufficient Data Guard */}
          {!metrics.is_statistically_significant && (
            <div className="p-3.5 rounded-[12px] bg-[#1b1e2b] border border-[#5052C9]/40 text-slate-300 text-xs flex items-center justify-between font-sans">
              <span>
                <strong className="text-white">Statistical Guard:</strong> {metrics.note}
              </span>
              <span className="text-[11px] font-mono text-[#7779D8]">
                Samples: {metrics.ground_truth_count}/{metrics.min_required_samples} required
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 pt-2">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-heading font-bold tracking-wider block">Evaluated</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {metrics.total_predictions}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-heading font-bold tracking-wider block">Ground Truth</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {metrics.ground_truth_count}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-heading font-bold tracking-wider block">Precision</span>
              <span className="text-xl font-bold font-mono text-[#7779D8] mt-1 block">
                {(metrics.precision * 100).toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-heading font-bold tracking-wider block">Recall</span>
              <span className="text-xl font-bold font-mono text-[#7779D8] mt-1 block">
                {(metrics.recall * 100).toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-heading font-bold tracking-wider block">Accuracy</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {(metrics.accuracy * 100).toFixed(1)}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 uppercase font-heading font-bold tracking-wider block">F1 Score</span>
              <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                {metrics.f1_score.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
