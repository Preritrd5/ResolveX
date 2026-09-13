"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Bot,
  Activity,
  Maximize2
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface InvestigationStep {
  id: string;
  step_number: number;
  agent_name: string;
  action_type: string;
  status: string;
  finding_summary?: string;
  thought_process?: string;
  tool_name?: string;
  tool_input?: Record<string, any>;
  tool_output?: Record<string, any>;
  confidence?: number;
  evidence_refs?: string[];
  duration_ms?: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

interface InvestigationTraceProps {
  steps: InvestigationStep[];
}

export function InvestigationTrace({ steps }: InvestigationTraceProps) {
  const [selectedStep, setSelectedStep] = useState<InvestigationStep | null>(null);

  if (!steps || steps.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 text-center">
        No execution trace recorded yet. Run multi-agent investigation to generate live audit steps.
      </div>
    );
  }

  // Format step timestamp to HH:MM:SS
  const formatTime = (isoString?: string) => {
    if (!isoString) return "--:--:--";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "--:--:--";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Failed
          </span>
        );
      case "running":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 animate-pulse">
            <Activity className="w-3 h-3 text-indigo-600 animate-spin" /> Running
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-indigo-600" /> Real-Time Investigation Trace
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          {steps.length} sequential execution steps
        </span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white divide-y divide-slate-100 text-xs">
        {steps.map((step) => (
          <div
            key={step.id || step.step_number}
            onClick={() => setSelectedStep(step)}
            className="p-3 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 cursor-pointer group"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="font-mono text-[11px] font-semibold text-slate-400 mt-0.5 shrink-0">
                {formatTime(step.started_at)}
              </span>
              
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-indigo-500" /> {step.agent_name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    [{step.action_type}]
                  </span>
                </div>

                <p className="text-slate-600 mt-1 line-clamp-1 leading-relaxed">
                  {step.finding_summary || step.thought_process || "Action completed."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {step.duration_ms !== undefined && (
                <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {step.duration_ms}ms
                </span>
              )}
              {getStatusBadge(step.status)}
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Step Detail Modal */}
      {selectedStep && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-semibold">
                  Step #{selectedStep.step_number} Audit Record
                </div>
                <h3 className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-400" /> {selectedStep.agent_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStep(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors text-xs font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div>
                <span className="text-slate-400 font-medium">Action & Status</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">
                    {selectedStep.action_type}
                  </span>
                  {getStatusBadge(selectedStep.status)}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium">Finding Summary</span>
                <p className="mt-1 p-3 bg-slate-50 rounded-lg text-slate-700 leading-relaxed border border-slate-200">
                  {selectedStep.finding_summary || "None recorded."}
                </p>
              </div>

              {selectedStep.tool_name && (
                <div>
                  <span className="text-slate-400 font-medium">Domain Tool Invoked</span>
                  <div className="mt-1 p-2 bg-indigo-50/50 text-indigo-900 font-mono text-[11px] rounded border border-indigo-100 flex items-center justify-between">
                    <span>{selectedStep.tool_name}</span>
                    <span>{selectedStep.duration_ms}ms</span>
                  </div>
                </div>
              )}

              {selectedStep.evidence_refs && selectedStep.evidence_refs.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium">Linked Evidence IDs</span>
                  <div className="mt-1 space-y-1">
                    {selectedStep.evidence_refs.map((ref) => (
                      <div key={ref} className="font-mono text-[11px] text-slate-600 bg-slate-100 p-1.5 rounded">
                        {ref}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedStep.error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
                  <span className="font-bold">Error:</span> {selectedStep.error}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedStep(null)}
                className="px-3 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
