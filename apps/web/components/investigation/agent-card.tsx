"use client";

import React from "react";
import {
  CreditCard,
  Package,
  Cpu,
  BookOpen,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Hash
} from "lucide-react";

export interface SpecialistAgentData {
  name: string;
  role: string;
  status: "completed" | "running" | "failed" | "skipped";
  conclusion?: string;
  confidence?: number;
  evidenceRefs?: string[];
  durationMs?: number;
  error?: string;
}

interface AgentCardProps {
  agent: SpecialistAgentData;
  onViewEvidence?: (evidenceId: string) => void;
}

export function AgentCard({ agent, onViewEvidence }: AgentCardProps) {
  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("billing") || n.includes("payment")) return <CreditCard className="w-4 h-4 text-emerald-600" />;
    if (n.includes("order")) return <Package className="w-4 h-4 text-blue-600" />;
    if (n.includes("technical") || n.includes("service")) return <Cpu className="w-4 h-4 text-purple-600" />;
    if (n.includes("policy") || n.includes("knowledge")) return <BookOpen className="w-4 h-4 text-amber-600" />;
    if (n.includes("refund")) return <RotateCcw className="w-4 h-4 text-indigo-600" />;
    if (n.includes("account") || n.includes("security")) return <UserCheck className="w-4 h-4 text-cyan-600" />;
    return <Cpu className="w-4 h-4 text-slate-600" />;
  };

  const getStatusBadge = () => {
    switch (agent.status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
          </span>
        );
      case "running":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 animate-pulse">
            <Activity className="w-3 h-3 text-indigo-600 animate-spin" /> Investigating
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" /> Error
          </span>
        );
      case "skipped":
      default:
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Skipped
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FBFAF7] rounded-[16px] border-[1.5px] border-[#BDBCB5] shadow-xs p-4 hover:border-[#5052C9] transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[8px] bg-[#EDEBE5] border border-[#C6C5BE]">
              {getIcon(agent.name)}
            </div>
            <div>
              <h4 className="text-xs font-heading font-bold text-[#24283A] leading-none">{agent.name}</h4>
              <span className="text-[10px] text-[#73778B] font-mono mt-0.5 block">{agent.role}</span>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="mt-3">
          {agent.status === "failed" ? (
            <p className="text-xs text-rose-600 leading-relaxed bg-rose-50/50 p-2.5 rounded-[10px] border border-rose-100 font-mono text-[11px]">
              {agent.error || "Specialist execution degraded."}
            </p>
          ) : agent.conclusion ? (
            <p className="text-xs text-[#24283A] leading-relaxed font-normal bg-[#F8F7F3] p-2.5 rounded-[10px] border border-[#D8D6CE]">
              {agent.conclusion}
            </p>
          ) : (
            <p className="text-xs text-[#73778B] italic">No finding recorded.</p>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#D8D6CE] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          {agent.evidenceRefs && agent.evidenceRefs.length > 0 ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-[#5052C9] bg-[#E5E4EE] px-1.5 py-0.5 rounded-[6px] border border-[#BFC1E4]">
              <Hash className="w-2.5 h-2.5" /> {agent.evidenceRefs.length} Evidence
            </span>
          ) : (
            <span className="text-[#73778B] font-mono text-[10px]">0 Evidence</span>
          )}

          {agent.durationMs !== undefined && (
            <span className="font-mono text-[10px] text-[#73778B]">
              {agent.durationMs}ms
            </span>
          )}
        </div>

        {agent.confidence !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#73778B] font-medium">Confidence:</span>
            <span className="font-mono font-bold text-[#24283A] text-[11px]">
              {Math.round(agent.confidence * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
