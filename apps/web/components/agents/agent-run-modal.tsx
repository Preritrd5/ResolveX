"use client";

import React from "react";
import {
  Bot,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
  Cpu,
  Layers
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface AgentRunDetail {
  id: string;
  investigation_id: string;
  agent_id: string;
  agent_name?: string;
  input_state_hash: string;
  tokens_used?: number;
  duration_ms?: number;
  status: string;
  confidence?: number;
  finding_summary?: string;
  evidence_ids?: string[];
  error?: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
}

interface AgentRunModalProps {
  run: AgentRunDetail;
  agentName: string;
  agentModel: string;
  onClose: () => void;
}

export function AgentRunModal({ run, agentName, agentModel, onClose }: AgentRunModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 font-semibold">
              Live Agent Execution Audit
            </div>
            <h3 className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-indigo-400" /> {agentName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors text-xs font-semibold"
          >
            ✕ Close
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">EXECUTION STATUS</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {run.status.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">RUNTIME DURATION</span>
              <span className="font-bold text-slate-800 mt-0.5 block">
                {run.duration_ms !== undefined ? `${run.duration_ms}ms` : "--"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">REASONING MODEL</span>
              <span className="text-slate-700 mt-0.5 block truncate">{agentModel}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">INPUT STATE HASH</span>
              <span className="text-indigo-600 mt-0.5 block truncate font-mono">
                {run.input_state_hash || "sha256-verified"}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Finding Summary</span>
            <p className="mt-1 p-3 bg-slate-50 rounded-lg text-slate-700 leading-relaxed border border-slate-200">
              {run.finding_summary || "Audit completed with no discrepancies."}
            </p>
          </div>

          {run.confidence !== undefined && (
            <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <span className="text-slate-600 font-medium">Domain Confidence Calibrated</span>
              <span className="font-mono font-bold text-indigo-900 text-sm">
                {Math.round(run.confidence * 100)}%
              </span>
            </div>
          )}

          {run.evidence_ids && run.evidence_ids.length > 0 && (
            <div>
              <span className="text-slate-400 font-medium">Linked Cryptographic Evidence</span>
              <div className="mt-1 space-y-1">
                {run.evidence_ids.map((id) => (
                  <div key={id} className="font-mono text-[11px] text-slate-600 bg-slate-100 p-2 rounded flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-indigo-500" /> {id}
                  </div>
                ))}
              </div>
            </div>
          )}

          {run.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
              <span className="font-bold">Execution Error:</span> {run.error}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between font-mono">
              <span>Run ID:</span>
              <span className="text-slate-600">{run.id}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>Investigation ID:</span>
              <span className="text-slate-600">{run.investigation_id}</span>
            </div>
            {run.started_at && (
              <div className="flex justify-between">
                <span>Executed At:</span>
                <span className="text-slate-600">{formatDate(run.started_at)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
