"use client";

import React from "react";
import { CheckCircle2, Loader2, Circle } from "lucide-react";

export interface Stage {
  id: string;
  label: string;
  status: "pending" | "running" | "completed";
}

interface ReasoningTimelineProps {
  stages: Stage[];
}

export function ReasoningTimeline({ stages }: ReasoningTimelineProps) {
  return (
    <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono border border-slate-800 space-y-2.5">
      <div className="flex items-center justify-between text-slate-400 font-sans font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800 pb-2">
        <span>Investigation Pipeline Trace</span>
        <span className="text-emerald-400 font-mono">Live Execution</span>
      </div>

      <div className="space-y-2 pt-1">
        {stages.map((stage) => {
          return (
            <div key={stage.id} className="flex items-center gap-2.5">
              {stage.status === "completed" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : stage.status === "running" ? (
                <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span
                className={`${
                  stage.status === "running"
                    ? "text-indigo-300 font-semibold"
                    : stage.status === "completed"
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
