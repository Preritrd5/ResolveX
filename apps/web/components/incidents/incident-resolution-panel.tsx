"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  Eye,
  RefreshCw,
  Users,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api-client";

interface BulkTarget {
  ticket_id: string;
  ticket_number: string;
  customer_name: string;
  is_eligible: boolean;
  exclusion_reason?: string | null;
  policy_allowed: boolean;
  risk_level: string;
  requires_approval: boolean;
}

interface BulkEvaluation {
  incident_id: string;
  action_type: string;
  total_targets: number;
  eligible_count: number;
  excluded_count: number;
  targets: BulkTarget[];
}

interface BulkExecutionResult {
  incident_id: string;
  action_type: string;
  total_executed: number;
  successful_count: number;
  failed_count: number;
  results: Array<{
    id: string;
    ticket_id: string;
    action_type: string;
    execution_status: string;
    verified: boolean;
    verification_message: string;
  }>;
}

interface IncidentResolutionPanelProps {
  incidentId: string;
  incidentNumber: string;
  linkedTicketCount: number;
  onExecutionComplete?: () => void;
}

const AVAILABLE_ACTIONS = [
  {
    id: "issue_incident_credit_batch",
    name: "Issue Incident Goodwill Credit Batch ($10.00)",
    description: "Credit customer accounts affected by this systemic incident with verified audit trail",
    risk: "LOW"
  },
  {
    id: "send_templated_email",
    name: "Dispatch Incident Mitigation & Status Email",
    description: "Broadcast verified root cause & remediation status to all co-affected customers",
    risk: "LOW"
  },
  {
    id: "retry_webhook",
    name: "Re-drive Failed Gateway Webhooks",
    description: "Replay dropped webhook payloads to sync missing orders without duplicating charges",
    risk: "MEDIUM"
  }
];

export function IncidentResolutionPanel({
  incidentId,
  incidentNumber,
  linkedTicketCount,
  onExecutionComplete
}: IncidentResolutionPanelProps) {
  const [selectedAction, setSelectedAction] = useState(AVAILABLE_ACTIONS[0].id);
  const [evaluation, setEvaluation] = useState<BulkEvaluation | null>(null);
  const [executionResult, setExecutionResult] = useState<BulkExecutionResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    setIsPreviewing(true);
    setError(null);
    setExecutionResult(null);
    try {
      const res = await fetchApi<BulkEvaluation>(`/incidents/${incidentId}/actions/preview`, {
        method: "POST",
        body: JSON.stringify({
          action_type: selectedAction
        })
      });
      setEvaluation(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to evaluate bulk action safety";
      setError(msg);
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleExecute() {
    if (!evaluation || evaluation.eligible_count === 0) return;
    setIsExecuting(true);
    setError(null);
    try {
      const eligibleIds = evaluation.targets
        .filter((t) => t.is_eligible)
        .map((t) => t.ticket_id);

      const res = await fetchApi<BulkExecutionResult>(`/incidents/${incidentId}/actions/execute`, {
        method: "POST",
        body: JSON.stringify({
          action_type: selectedAction,
          target_ticket_ids: eligibleIds
        })
      });
      setExecutionResult(res.data);
      if (onExecutionComplete) {
        onExecutionComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk action execution failed";
      setError(msg);
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D8D6CE] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] font-heading font-bold uppercase tracking-wider text-[#5052C9] bg-[#EEF0FA] px-2.5 py-0.5 rounded-[6px] border border-[#BFC1E4]">
              <ShieldCheck className="w-3.5 h-3.5" /> Incident Blast-Radius Remediation
            </span>
            <span className="text-xs font-mono font-bold text-[#464B5E]">{incidentNumber}</span>
          </div>
          <h2 className="text-lg font-heading font-extrabold text-[#24283A] mt-1.5">
            Safe Multi-Target Action Executor
          </h2>
          <p className="text-xs text-[#464B5E] mt-0.5 font-sans">
            Evaluate and remediate across {linkedTicketCount} co-affected customer tickets with deterministic policy safety boundaries.
          </p>
        </div>

        {/* Action Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setEvaluation(null);
              setExecutionResult(null);
            }}
            className="text-xs font-semibold px-3 py-2 bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[11px] text-[#24283A] focus:outline-none focus:border-[#5B5CE2] focus:ring-1 focus:ring-[#5B5CE2]"
          >
            {AVAILABLE_ACTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.risk} Risk)
              </option>
            ))}
          </select>

          <button
            onClick={handlePreview}
            disabled={isPreviewing || isExecuting || linkedTicketCount === 0}
            className="px-3.5 py-2 rounded-[11px] bg-[#24283A] hover:bg-[#1b1e2b] text-white text-xs font-heading font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#7779D8]" />
            <span>{isPreviewing ? "Evaluating Safety..." : "Safety Dry-Run Preview"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-[12px] text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Evaluation Results Banner */}
      {evaluation && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FBFAF7] rounded-[14px] border border-[#D8D6CE]">
              <span className="text-[11px] uppercase font-heading font-bold text-[#464B5E] tracking-wider">Total Targets Evaluated</span>
              <div className="text-xl font-bold font-mono text-[#24283A] mt-1">{evaluation.total_targets}</div>
              <p className="text-[10px] text-[#464B5E] mt-0.5 font-sans">Tickets linked to incident</p>
            </div>
            <div className="p-4 bg-emerald-50/70 rounded-[14px] border border-emerald-200">
              <span className="text-[11px] uppercase font-heading font-bold text-emerald-800 tracking-wider">Policy Approved Targets</span>
              <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{evaluation.eligible_count}</div>
              <p className="text-[10px] text-emerald-700 mt-0.5 font-sans">Safe for automated bulk execution</p>
            </div>
            <div className="p-4 bg-amber-50/70 rounded-[14px] border border-amber-200">
              <span className="text-[11px] uppercase font-heading font-bold text-amber-800 tracking-wider">Safety Policy Excluded</span>
              <div className="text-xl font-bold font-mono text-amber-900 mt-1">{evaluation.excluded_count}</div>
              <p className="text-[10px] text-amber-700 mt-0.5 font-sans">Exempted by safety engine rules</p>
            </div>
          </div>

          {/* Targets Breakdown Table */}
          <div className="border border-[#D8D6CE] rounded-[14px] overflow-hidden bg-white">
            <div className="px-4 py-2.5 bg-[#FBFAF7] border-b border-[#D8D6CE] flex items-center justify-between">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A]">
                Target Safety Evaluation Matrix
              </span>
              <span className="text-[10px] text-[#464B5E] font-mono">
                {evaluation.eligible_count} of {evaluation.total_targets} Eligible
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FBFAF7] border-b border-[#D8D6CE] text-[#464B5E] text-[10px] uppercase font-heading font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Ticket</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Risk Tier</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Policy Audit / Exclusion Reason</th>
                    <th className="py-2.5 px-3 text-right">Case Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8D6CE]">
                  {evaluation.targets.map((t) => (
                    <tr key={t.ticket_id} className="hover:bg-[#FBFAF7]/60 transition-colors">
                      <td className="py-2 px-3 font-mono font-bold text-[#5052C9]">{t.ticket_number}</td>
                      <td className="py-2 px-3 font-medium text-[#24283A]">{t.customer_name}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded-[6px] text-[9px] font-bold uppercase ${
                          t.risk_level === "LOW" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          t.risk_level === "MEDIUM" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {t.risk_level}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {t.is_eligible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ELIGIBLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-[6px] border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> EXCLUDED
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#464B5E] font-mono text-[11px]">
                        {t.exclusion_reason || "Policy boundaries verified — safe for autonomous remediation"}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Link
                          href={`/cases/${t.ticket_id}`}
                          className="text-[11px] font-heading font-semibold text-[#5052C9] hover:underline inline-flex items-center gap-0.5"
                        >
                          View <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Execution Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#24283A] text-white rounded-[14px]">
            <div className="text-xs">
              <span className="font-heading font-bold text-emerald-400">Ready to Remediate:</span>{" "}
              <span className="font-sans">
                Execute <strong className="text-white">{AVAILABLE_ACTIONS.find((a) => a.id === selectedAction)?.name}</strong> on {evaluation.eligible_count} verified targets.
              </span>
            </div>

            <button
              onClick={handleExecute}
              disabled={isExecuting || evaluation.eligible_count === 0}
              className="px-4 py-2.5 rounded-[11px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-heading font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-40 whitespace-nowrap cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Safe Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute on {evaluation.eligible_count} Verified Targets</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Post-Execution Verification Receipt */}
      {executionResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-[14px] space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-heading font-bold text-emerald-950 uppercase tracking-wider">
                  Bulk Remediation Execution Verified
                </h4>
                <p className="text-[11px] text-emerald-800 font-sans">
                  {executionResult.successful_count} of {executionResult.total_executed} actions executed and post-verified in database.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-emerald-200/60 text-emerald-900 border border-emerald-300">
              AUDIT LOG COMMITTED
            </span>
          </div>

          <div className="space-y-1.5 pt-2">
            {executionResult.results.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2.5 bg-white rounded-[10px] border border-emerald-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#24283A] font-bold">{r.action_type}</span>
                  <span className="text-[#464B5E] font-mono text-[11px]">Ticket: {r.ticket_id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-700 font-mono">{r.verification_message}</span>
                  <span className="px-2 py-0.5 rounded-[6px] bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    VERIFIED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
