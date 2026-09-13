"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ExternalLink,
  CreditCard,
  FileText,
  Lock,
  Cpu,
  Fingerprint,
  Send,
  AlertOctagon,
  Network
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface EvidenceItem {
  id?: string;
  type?: string;
  source?: string;
  summary?: string;
  digest?: string;
  sha256?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface HumanHandoffPackage {
  escalation_id: string;
  ticket_id: string;
  customer_summary: {
    id?: string;
    full_name?: string;
    email?: string;
    loyalty_tier?: string;
    lifetime_value_cents?: number;
    churn_risk_score?: number;
    total_orders_count?: number;
  };
  issue_summary: string;
  detected_intent: string;
  investigation_timeline: Array<{
    timestamp?: string;
    agent?: string;
    step?: string;
    status?: string;
    message?: string;
  }>;
  evidence: EvidenceItem[];
  orders: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  linked_incident?: {
    id?: string;
    incident_number?: string;
    title?: string;
    severity?: string;
    status?: string;
  } | null;
  agent_findings: Array<{
    agent?: string;
    finding?: string;
    confidence?: number;
    status?: string;
  }>;
  actions_attempted: Array<{
    action_type?: string;
    status?: string;
    reason?: string;
  }>;
  policy_checks: Array<{
    policy?: string;
    allowed?: boolean;
    reason?: string;
  }>;
  root_cause_assessment: string;
  recommendation: string;
  escalation_score: number;
  escalation_reasons: string[];
}

export default function EscalationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const escalationId = params?.id as string;

  const [handoff, setHandoff] = useState<HumanHandoffPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operator Action Form
  const [resolutionNote, setResolutionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolvedStatus, setResolvedStatus] = useState<string | null>(null);

  const loadHandoff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<HumanHandoffPackage>(`/escalations/${escalationId}`);
      setHandoff(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load escalation handoff package";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (escalationId) {
      loadHandoff();
    }
  }, [escalationId]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNote.trim()) return;

    try {
      setIsSubmitting(true);
      await fetchApi(`/escalations/${escalationId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ note: resolutionNote.trim() })
      });
      setResolvedStatus("RESOLVED");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resolve escalation";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <LoadingState
        message="Loading Human Handoff Package..."
        description="Retrieving synthesized investigation context, cryptographic evidence digests, and policy evaluation logs."
      />
    );
  }

  if (error || !handoff) {
    return <ErrorState title="Escalation Not Found" message={error || "Escalation package could not be retrieved."} onRetry={loadHandoff} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/escalations"
          className="inline-flex items-center gap-1.5 text-xs text-[#464B5E] hover:text-[#24283A] font-heading font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Escalation Queue
        </Link>
        <Link
          href={`/cases/${handoff.ticket_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-[#5052C9] hover:underline"
        >
          <span>Open Full Case Workspace</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* AUTOMATION STOPPED SAFELY - Critical Banner */}
      <div className="p-6 bg-[#24283A] text-white rounded-[20px] border border-[#353b52] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[12px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-[6px] border border-rose-500/20">
                  AUTOMATION STOPPED SAFELY
                </span>
                <span className="text-xs font-mono text-slate-400">Escalation ID: {escalationId.slice(0, 12)}...</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold mt-1 text-white">
                Human-in-the-Loop Authorization Workspace
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#1b1e2b] px-4 py-2.5 rounded-[12px] border border-slate-700">
            <div>
              <span className="text-[10px] uppercase font-heading font-bold text-slate-400">Escalation Score</span>
              <div className="text-xl font-bold font-mono text-rose-400">
                {Math.round(handoff.escalation_score * 100)}%
              </div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-[10px] uppercase font-heading font-bold text-slate-400">Policy Gate</span>
              <div className="text-xs font-bold font-mono text-amber-300">
                LOCKED FOR REVIEW
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Reasons */}
        <div className="pt-2 border-t border-slate-700 flex flex-wrap items-center gap-2">
          <span className="text-xs font-heading font-semibold text-slate-400">Trigger Reasons:</span>
          {handoff.escalation_reasons.map((r, i) => (
            <span
              key={i}
              className="text-xs font-mono px-2.5 py-1 rounded-[6px] bg-[#1b1e2b] text-slate-200 border border-slate-700"
            >
              ⚠️ {r}
            </span>
          ))}
        </div>
      </div>

      {/* Linked Incident Banner (if linked) */}
      {handoff.linked_incident && (
        <div className="p-4 bg-gradient-to-r from-[#EEF0FA] to-[#E5E4EE] border-2 border-[#BFC1E4] rounded-[16px] text-[#24283A] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-[#5052C9]" />
            <div>
              <div className="text-xs font-heading font-bold text-[#5052C9]">
                Linked Systemic Incident: {handoff.linked_incident.incident_number}
              </div>
              <p className="text-xs text-[#464B5E] font-sans">{handoff.linked_incident.title}</p>
            </div>
          </div>
          <Link
            href={`/incidents/${handoff.linked_incident.id}`}
            className="px-3.5 py-1.5 rounded-[9px] bg-[#5052C9] hover:bg-[#4143A7] text-white text-xs font-heading font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>Command Center</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* 2-Column Grid: Left (Customer & Diagnosis), Right (Operator Actions & Resolution) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Customer Brief + Root Cause + Evidence */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Profile Brief */}
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#5052C9]" /> Customer Profile Brief
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE]">
                <span className="text-[10px] uppercase font-heading font-bold text-[#464B5E]">Customer</span>
                <div className="font-heading font-bold text-[#24283A] mt-0.5 truncate">
                  {handoff.customer_summary.full_name || "Customer"}
                </div>
                <div className="text-[10px] text-[#464B5E] font-mono truncate">
                  {handoff.customer_summary.email || "No email"}
                </div>
              </div>

              <div className="p-3 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE]">
                <span className="text-[10px] uppercase font-heading font-bold text-[#464B5E]">Tier</span>
                <div className="font-heading font-bold text-[#5052C9] uppercase mt-0.5">
                  {handoff.customer_summary.loyalty_tier || "standard"}
                </div>
                <div className="text-[10px] text-[#464B5E] font-sans">
                  {handoff.customer_summary.total_orders_count || 0} lifetime orders
                </div>
              </div>

              <div className="p-3 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE]">
                <span className="text-[10px] uppercase font-heading font-bold text-[#464B5E]">Lifetime Value</span>
                <div className="font-bold font-mono text-[#24283A] mt-0.5">
                  {formatCurrency(handoff.customer_summary.lifetime_value_cents || 0)}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold font-sans">Account Verified</div>
              </div>

              <div className="p-3 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE]">
                <span className="text-[10px] uppercase font-heading font-bold text-[#464B5E]">Churn Risk</span>
                <div
                  className={`font-bold mt-0.5 font-mono ${
                    (handoff.customer_summary.churn_risk_score || 0) > 0.4 ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {Math.round((handoff.customer_summary.churn_risk_score || 0) * 100)}%
                </div>
                <div className="text-[10px] text-[#464B5E] font-sans">Telemetry score</div>
              </div>
            </div>
          </div>

          {/* Root Cause Diagnosis & Recommendation */}
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" /> Root Cause Assessment & AI Synthesis
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE] space-y-1">
                <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-[#464B5E]">Root Cause Diagnosis</span>
                <p className="text-[#24283A] leading-relaxed font-mono text-xs">
                  {handoff.root_cause_assessment}
                </p>
              </div>

              <div className="p-3.5 bg-gradient-to-r from-[#EEF0FA] to-[#E5E4EE] rounded-[12px] border border-[#BFC1E4] space-y-1">
                <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-[#5052C9]">
                  Recommended Operator Remediation
                </span>
                <p className="text-[#24283A] leading-relaxed text-xs font-sans">
                  {handoff.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Cryptographic Evidence Table */}
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] overflow-hidden">
            <div className="p-4 border-b border-[#D8D6CE] flex items-center justify-between">
              <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-600" />
                Cryptographic Evidence & Grounding Records ({handoff.evidence.length})
              </h3>
              <span className="text-[10px] font-mono text-[#464B5E]">Zero Hallucination Proof</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#FBFAF7] border-b border-[#D8D6CE] text-[#464B5E] text-[10px] uppercase font-heading font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Entity / Source</th>
                    <th className="py-2.5 px-4">Evidence Summary</th>
                    <th className="py-2.5 px-4">SHA-256 Digest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D6CE]">
                  {handoff.evidence.map((ev, i) => (
                    <tr key={i} className="hover:bg-[#FBFAF7]/60 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-[#24283A] capitalize">
                        {ev.type || "record"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#5052C9]">
                        {ev.id || ev.source || "db"}
                      </td>
                      <td className="py-2.5 px-4 text-[#464B5E] max-w-xs truncate font-sans">
                        {ev.summary || JSON.stringify(ev)}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-[#464B5E]">
                        {ev.digest ? `${ev.digest.slice(0, 16)}...` : ev.sha256 ? `${ev.sha256.slice(0, 16)}...` : "verified"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Operator Action Authorization & Resolution Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Operator Action Card */}
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-amber-600" />
              Human Operator Authorization Controls
            </h3>

            {resolvedStatus ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-[14px] space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-heading font-bold text-emerald-950 uppercase">Escalation Resolved</h4>
                <p className="text-xs text-emerald-800 font-sans">
                  Operator resolution committed. Ticket returned to active customer workflow.
                </p>
                <button
                  onClick={() => router.push("/escalations")}
                  className="mt-2 px-3.5 py-2 rounded-[11px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Return to Escalation Queue
                </button>
              </div>
            ) : (
              <form onSubmit={handleResolve} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-heading font-semibold text-[#24283A]">
                    Operator Decision & Resolution Note:
                  </label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    rows={4}
                    placeholder="Document operator review rationale, overrides, or manual customer instructions..."
                    className="w-full text-xs p-3 bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[11px] text-[#24283A] focus:outline-none focus:border-[#5B5CE2] focus:ring-1 focus:ring-[#5B5CE2] font-sans"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !resolutionNote.trim()}
                    className="w-full py-2.5 px-4 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6b6dc9] hover:to-[#4143A7] text-white text-xs font-heading font-bold flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? "Authorizing & Resolving..." : "Authorize Resolution & Close Escalation"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/cases/${handoff.ticket_id}`)}
                    className="w-full py-2 px-4 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] hover:border-[#D8D6CE] text-[#24283A] text-xs font-heading font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Investigate Case Interactively</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Investigation Timeline */}
          <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-3">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#464B5E]" />
              Investigation Timeline & Agent Traces
            </h3>

            <div className="space-y-3 text-xs">
              {handoff.investigation_timeline.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[#464B5E]">
                  <div className="w-2 h-2 rounded-full bg-[#5052C9] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-bold text-[#24283A] font-mono text-[11px]">
                      {item.step || item.agent || "Investigation Step"}
                    </span>
                    <p className="text-[11px] text-[#464B5E] mt-0.5 font-sans">
                      {item.message || JSON.stringify(item)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
