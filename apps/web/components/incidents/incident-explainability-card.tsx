"use client";

import React from "react";
import { HelpCircle, Activity, Sparkles, AlertCircle, CheckCircle2, GitBranch } from "lucide-react";

interface SupportingSignal {
  signal_type: string;
  service?: string;
  error?: string;
  cluster_size?: number;
  gateway?: string;
  strength?: number;
  description: string;
}

interface ExplainabilityProps {
  summary: string;
  whyOneIncident: string;
  primaryFailureDomain: string;
  supportingSignals?: SupportingSignal[];
  confidenceRationale?: string;
  confidenceScore: number;
}

export function IncidentExplainabilityCard({
  summary,
  whyOneIncident,
  primaryFailureDomain,
  supportingSignals = [],
  confidenceRationale,
  confidenceScore
}: ExplainabilityProps) {
  return (
    <div className="bg-gradient-to-br from-[#EEF0FA] to-[#E5E4EE] rounded-[20px] border-2 border-[#BFC1E4] shadow-[0_2px_12px_rgba(80,82,201,0.08)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[10px] bg-white border border-[#BFC1E4] flex items-center justify-center text-[#5052C9] shadow-xs">
            <Sparkles className="w-4 h-4 text-[#7779D8]" />
          </div>
          <h3 className="text-xs font-heading font-extrabold uppercase tracking-wider text-[#24283A]">
            Incident Explainability Synthesis
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-[10px] bg-white text-[#5052C9] border border-[#BFC1E4] font-mono text-xs font-bold shadow-xs">
          Confidence: {Math.round(confidenceScore * 100)}%
        </div>
      </div>

      {/* Primary Question: Why is this one incident? */}
      <div className="p-4 rounded-[14px] bg-[#24283A] text-white space-y-2 border border-[#353b52] shadow-sm">
        <div className="text-[11px] font-heading font-bold text-[#7779D8] uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" /> Why is this one incident?
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-normal font-sans">
          {whyOneIncident}
        </p>
      </div>

      {/* Primary Failure Domain */}
      <div className="flex items-center justify-between p-3.5 bg-white/80 backdrop-blur-xs rounded-[12px] border border-[#BFC1E4] text-xs">
        <span className="text-[#464B5E] font-heading font-semibold">Identified Primary Failure Domain:</span>
        <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-[6px] border border-rose-200">
          {primaryFailureDomain}
        </span>
      </div>

      {/* Supporting Signals */}
      {supportingSignals.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#5052C9]" /> Correlated Signal Breakdown ({supportingSignals.length})
          </div>
          <div className="space-y-2">
            {supportingSignals.map((sig, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white/90 rounded-[12px] border border-[#BFC1E4] text-xs space-y-1 hover:border-[#5052C9] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded-[6px] bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4]/50">
                    {sig.signal_type.replace(/_/g, " ")}
                  </span>
                  {sig.strength !== undefined && (
                    <span className="font-mono text-[10px] font-bold text-[#5052C9]">
                      Weight: {Math.round(sig.strength * 100)}%
                    </span>
                  )}
                </div>
                <p className="text-[#464B5E] text-[11px] leading-relaxed mt-1 font-sans">
                  {sig.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Rationale */}
      {confidenceRationale && (
        <div className="p-3.5 bg-white/90 rounded-[12px] border border-[#BFC1E4] text-xs text-[#24283A] space-y-1">
          <div className="font-heading font-bold text-[11px] text-[#5052C9] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5052C9]" /> Grounded Confidence Calibration
          </div>
          <p className="text-[11px] text-[#464B5E] leading-relaxed font-normal font-sans">
            {confidenceRationale}
          </p>
        </div>
      )}
    </div>
  );
}
