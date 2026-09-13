"use client";

import React from "react";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  AlertCircle
} from "lucide-react";

interface SupervisorSynthesisProps {
  summary: string;
  confidence: number;
  recommendedNextStep: string;
  specialistCount: number;
  evidenceCount: number;
  dagEngine?: string;
}

export function SupervisorSynthesis({
  summary,
  confidence,
  recommendedNextStep,
  specialistCount,
  evidenceCount,
  dagEngine = "LangGraph StateGraph"
}: SupervisorSynthesisProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 0.90) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 0.75) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  return (
    <div className="bg-gradient-to-br from-[#EEF0FA] to-[#E5E4EE] text-[#24283A] rounded-[20px] p-5 shadow-[0_2px_12px_rgba(35,39,55,0.06)] border-2 border-[#BFC1E4] space-y-4">
      <div className="flex items-center justify-between border-b border-[#BFC1E4] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] bg-white border border-[#BFC1E4] text-[#5052C9] flex items-center justify-center shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#5052C9] font-semibold block">
              Multi-Agent Synthesis
            </span>
            <h3 className="text-sm font-heading font-bold text-[#24283A]">Supervisor Triangulated Root Cause</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#464B5E] bg-white/70 border border-[#BFC1E4] px-2 py-0.5 rounded-[6px]">
            {dagEngine}
          </span>
          <div
            className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border flex items-center gap-1.5 ${getConfidenceColor(
              confidence
            )}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            AI Confidence: {Math.round(confidence * 100)}%
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-[#24283A] leading-relaxed font-normal">
          {summary || "Investigation completed. All active specialists verified without discrepancy."}
        </p>
      </div>

      <div className="bg-[#FBFAF7] border border-[#BDBCB5] rounded-[14px] p-3.5 flex items-start gap-3 shadow-xs">
        <div className="p-1 rounded-[6px] bg-[#E5E4EE] text-[#5052C9] shrink-0 mt-0.5">
          <Zap className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[#5052C9] block">
            Recommended Next Step
          </span>
          <p className="text-xs text-[#24283A] font-medium mt-0.5 leading-snug">
            {recommendedNextStep}
          </p>
          <span className="text-[10px] text-[#73778B] mt-1 block">
            Policy Gate: Requires human authorization. Zero autonomous mutations executed.
          </span>
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between text-[11px] text-[#73778B] font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          {specialistCount} Specialists Dispatched
        </span>
        <span>{evidenceCount} Cryptographic Evidence Items Verified</span>
      </div>
    </div>
  );
}
