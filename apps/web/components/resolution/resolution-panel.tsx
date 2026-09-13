"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowUpRight, 
  Sparkles, 
  Lock, 
  RefreshCw, 
  Send,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { ActionPreviewModal, ActionPreviewData } from "./action-preview-modal";

export interface ResolutionDecision {
  decision: "AUTO_RESOLVE" | "ASSISTED_RESOLUTION" | "ESCALATE" | "INSUFFICIENT_INFORMATION" | string;
  recommended_action?: string | null;
  confidence: number;
  reason: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | string;
  parameters?: Record<string, unknown>;
  requires_human_approval: boolean;
  policy_check?: {
    allowed: boolean;
    reason: string;
    risk_level: string;
    required_approval: boolean;
    violations: string[];
    policy_sources: string[];
  };
}

interface ResolutionPanelProps {
  ticketId: string;
  ticketNumber: string;
  ticketStatus: string;
  onActionExecuted?: () => void;
}

export function ResolutionPanel({
  ticketId,
  ticketNumber,
  ticketStatus,
  onActionExecuted
}: ResolutionPanelProps) {
  const [decision, setDecision] = useState<ResolutionDecision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ActionPreviewData | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSuccess, setExecutionSuccess] = useState<ActionPreviewData | null>(null);

  // Escalation state
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);

  useEffect(() => {
    loadResolutionDecision();
  }, [ticketId]);

  async function loadResolutionDecision() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi<ResolutionDecision>(`/tickets/${ticketId}/resolve`);
      setDecision(res.data);
    } catch (err: unknown) {
      console.error("Failed to load resolution decision:", err);
      setError("Unable to compute autonomous resolution decision.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePreview() {
    if (!decision || !decision.recommended_action) return;
    setIsPreviewLoading(true);
    try {
      const res = await fetchApi<ActionPreviewData>(`/tickets/${ticketId}/actions/preview`, {
        method: "POST",
        body: JSON.stringify({
          action_type: decision.recommended_action,
          parameters: decision.parameters || {},
          dry_run: true
        })
      });
      setPreviewData(res.data);
      setIsPreviewOpen(true);
    } catch (err: unknown) {
      console.error("Preview failed:", err);
      alert("Failed to generate dry-run preview.");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleExecute() {
    if (!decision || !decision.recommended_action) return;
    setIsExecuting(true);
    try {
      const res = await fetchApi<ActionPreviewData>(`/tickets/${ticketId}/actions/execute`, {
        method: "POST",
        body: JSON.stringify({
          action_type: decision.recommended_action,
          parameters: decision.parameters || {},
          dry_run: false
        })
      });
      setIsPreviewOpen(false);
      setExecutionSuccess(res.data);
      if (onActionExecuted) {
        onActionExecuted();
      }
    } catch (err: unknown) {
      console.error("Execution failed:", err);
      alert("Execution failed. Policy invariants or authorization error.");
    } finally {
      setIsExecuting(false);
    }
  }

  async function handleEscalate() {
    setIsEscalating(true);
    try {
      await fetchApi(`/tickets/${ticketId}/escalate`, {
        method: "POST",
        body: JSON.stringify({
          reason: decision?.reason || "Escalated by support operator for complex manual investigation."
        })
      });
      setEscalated(true);
      if (onActionExecuted) {
        onActionExecuted();
      }
    } catch (err: unknown) {
      console.error("Escalation failed:", err);
      alert("Failed to escalate ticket.");
    } finally {
      setIsEscalating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-10 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 text-center text-xs text-slate-500">
        <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
        {error || "No autonomous resolution proposal available for this case."}
      </div>
    );
  }

  const decisionBadge = {
    AUTO_RESOLVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ASSISTED_RESOLUTION: "bg-indigo-50 text-indigo-700 border-indigo-200",
    ESCALATE: "bg-rose-50 text-rose-700 border-rose-200",
    INSUFFICIENT_INFORMATION: "bg-slate-100 text-slate-700 border-slate-200"
  }[decision.decision] || "bg-slate-100 text-slate-700 border-slate-200";

  const riskBadge = {
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-rose-50 text-rose-700 border-rose-200"
  }[decision.risk_level.toUpperCase()] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <>
      <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[8px] bg-[#E5E4EE] border border-[#BFC1E4] flex items-center justify-center text-[#5052C9]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A]">
                Resolution &amp; Escalation Decision
              </h3>
              <p className="text-[11px] text-[#464B5E]">
                Multi-agent reasoning synthesized with authoritative policy verification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border tracking-wider ${decisionBadge}`}>
              {decision.decision.replace("_", " ")}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${riskBadge}`}>
              {decision.risk_level} Risk
            </span>
          </div>
        </div>

        {/* Execution Success Banner */}
        {executionSuccess && (
          <div className="p-4 rounded-[14px] bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold font-heading">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Action Successfully Executed &amp; Verified
            </div>
            <p className="text-emerald-700 text-[11px] leading-relaxed">
              {executionSuccess.verification_message}
            </p>
            {executionSuccess.customer_response && (
              <div className="p-2.5 rounded-[10px] bg-white border border-emerald-200 text-[#24283A] italic text-[11px]">
                &ldquo;{executionSuccess.customer_response}&rdquo;
              </div>
            )}
            <div className="text-[10px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3" /> Idempotency: {executionSuccess.idempotency_key}
            </div>
          </div>
        )}

        {/* Escalation Success Banner */}
        {escalated && (
          <div className="p-3.5 rounded-[14px] bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-2 font-bold font-heading">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Automation Halted Safely — Escalated to Senior Human Specialist
            </div>
            <p className="text-rose-700 text-[11px]">
              Case packaged with cryptographic evidence hashes, full multi-agent timeline, and handoff brief.
            </p>
          </div>
        )}

        {/* Decision Reasoning Brief */}
        <div className="p-3.5 rounded-[14px] bg-[#FBFAF7] border border-[#BDBCB5] space-y-1.5 text-xs shadow-xs">
          <div className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#464B5E]">
            Decision Assessment &amp; Rationale
          </div>
          <p className="text-[#24283A] leading-relaxed font-normal">
            {decision.reason}
          </p>
        </div>

        {/* Policy Gate Status Box */}
        {decision.policy_check && (
          <div className={`p-3.5 rounded-[14px] border space-y-2 text-xs shadow-xs ${
            decision.policy_check.allowed ? "bg-[#24283A] text-white border-[#3E4358]" : "bg-rose-50 border-rose-200 text-rose-900"
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                decision.policy_check.allowed ? "text-[#7779D8]" : "text-rose-600"
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" /> Authoritative Policy Check
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[6px] ${
                decision.policy_check.allowed ? "bg-emerald-500/20 text-emerald-300 font-bold" : "bg-rose-200 text-rose-800 font-bold"
              }`}>
                {decision.policy_check.allowed ? "PASSED" : "BLOCKED"}
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${decision.policy_check.allowed ? "text-[#EDEBE5]" : "text-rose-800"}`}>
              {decision.policy_check.reason}
            </p>
            {decision.policy_check.violations.length > 0 && (
              <div className="space-y-1 pt-1">
                {decision.policy_check.violations.map((v, i) => (
                  <div key={i} className="text-[10px] font-mono text-rose-600 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    {v}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        {!executionSuccess && !escalated && (
          <div className="pt-2 border-t border-[#D8D6CE] flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-[#464B5E]">
              Confidence: <strong className="text-[#24283A] font-bold">{Math.round(decision.confidence * 100)}%</strong>
            </div>

            <div className="flex items-center gap-2">
              {decision.decision === "ESCALATE" ? (
                <button
                  onClick={handleEscalate}
                  disabled={isEscalating}
                  className="px-4 py-2 rounded-[11px] bg-rose-600 text-white text-xs font-heading font-bold hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>{isEscalating ? "Escalating..." : "Create Human Handoff Package"}</span>
                </button>
              ) : decision.recommended_action ? (
                <>
                  <button
                    onClick={handlePreview}
                    disabled={isPreviewLoading}
                    className="px-3.5 py-2 rounded-[11px] border border-[#BDBCB5] bg-[#FBFAF7] text-[#24283A] text-xs font-heading font-semibold hover:bg-[#EDEBE5] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-[#5052C9]" />
                    <span>{isPreviewLoading ? "Simulating..." : "Preview State Diff"}</span>
                  </button>
                  <button
                    onClick={handleExecute}
                    disabled={isExecuting}
                    className="px-4 py-2 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6A6CD2] hover:to-[#4547B8] text-white text-xs font-heading font-semibold transition-all flex items-center gap-1.5 shadow-[0_2px_10px_rgba(80,82,201,0.22)] cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isExecuting ? "Executing..." : `Execute ${decision.recommended_action.replace(/_/g, " ")}`}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEscalate}
                  className="px-4 py-2 rounded-[11px] border border-[#BDBCB5] bg-[#FBFAF7] text-[#24283A] text-xs font-heading font-semibold hover:bg-[#EDEBE5] cursor-pointer"
                >
                  Escalate to Human
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dry-run Modal */}
      <ActionPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onConfirm={handleExecute}
        isExecuting={isExecuting}
        preview={previewData}
        actionTitle={decision.recommended_action?.replace(/_/g, " ") || "Recommended Action"}
        riskLevel={decision.risk_level}
      />
    </>
  );
}
