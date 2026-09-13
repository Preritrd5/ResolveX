"use client";

import React from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Lock, 
  FileCheck, 
  ExternalLink,
  Cpu
} from "lucide-react";

export interface ActionPreviewData {
  action_id: string;
  action_type: string;
  execution_status: string;
  verified: boolean;
  verification_message: string;
  before_state: Record<string, unknown>;
  after_state: Record<string, unknown>;
  idempotency_key: string;
  executed_at: string;
  requires_human_approval?: boolean;
  approval_id?: string;
  customer_response?: string;
}

interface ActionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isExecuting?: boolean;
  preview: ActionPreviewData | null;
  actionTitle: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | string;
}

export function ActionPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  isExecuting = false,
  preview,
  actionTitle,
  riskLevel
}: ActionPreviewModalProps) {
  if (!isOpen || !preview) return null;

  const riskBadge = {
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    HIGH: "bg-rose-50 text-rose-700 border-rose-200"
  }[riskLevel.toUpperCase()] || "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Dry-Run Preview: {actionTitle}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${riskBadge}`}>
                  {riskLevel} Risk
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulated execution plan evaluated against live policy constraints and database invariants
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Policy Invariant Checks */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-900">
                Policy & Authorization Gate Passed
              </p>
              <p className="text-emerald-700 leading-relaxed">
                {preview.verification_message}
              </p>
            </div>
          </div>

          {/* Before vs After State Comparison */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              State Transformation Diff (Before vs After)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Current State */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Current Database State
                </div>
                <div className="space-y-1.5">
                  {Object.entries(preview.before_state).length === 0 ? (
                    <p className="text-slate-400 italic">No existing records</p>
                  ) : (
                    Object.entries(preview.before_state).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between text-slate-600 py-0.5 border-b border-slate-100 last:border-0">
                        <span className="font-mono text-[11px] text-slate-500">{key}:</span>
                        <span className="font-semibold font-mono text-slate-800 text-[11px] truncate max-w-[150px]">
                          {String(val)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Projected State */}
              <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200/60 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center justify-between">
                  <span>Projected State</span>
                  <ArrowRight className="w-3 h-3 text-indigo-400" />
                </div>
                <div className="space-y-1.5">
                  {Object.entries(preview.after_state).map(([key, val]) => {
                    const hasChanged = preview.before_state[key] !== val;
                    return (
                      <div key={key} className={`flex items-center justify-between py-0.5 border-b border-indigo-100/50 last:border-0 ${hasChanged ? "text-indigo-950 font-bold" : "text-slate-600"}`}>
                        <span className="font-mono text-[11px] text-indigo-700/80">{key}:</span>
                        <span className={`font-mono text-[11px] truncate max-w-[150px] ${hasChanged ? "text-emerald-700 font-bold bg-emerald-100/50 px-1 rounded" : "text-slate-700"}`}>
                          {String(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Idempotency Key & Verification Protocol */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-indigo-400" /> Distributed Idempotency Key
              </span>
              <span className="text-[10px] font-mono text-indigo-300">Deterministic Replay Guard</span>
            </div>
            <div className="font-mono text-[11px] text-indigo-300 bg-slate-950 p-2 rounded-lg border border-slate-800 break-all select-all">
              {preview.idempotency_key}
            </div>
          </div>

          {/* Customer Notice Preview */}
          {preview.customer_response && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Verified Customer Communication (Preview)
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 italic leading-relaxed text-xs">
                &ldquo;{preview.customer_response}&rdquo;
              </div>
            </div>
          )}

          {preview.requires_human_approval && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                This high-risk action requires final operator sign-off before database commitment.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing & Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Execute Action</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
