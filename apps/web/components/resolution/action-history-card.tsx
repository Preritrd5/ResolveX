"use client";

import React, { useState, useEffect } from "react";
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Lock, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";

export interface ActionExecutionRecord {
  id: string;
  ticket_id: string;
  action_type: string;
  execution_status: "success" | "preview" | "failed" | "pending_approval" | string;
  idempotency_key: string;
  executed_at: string;
  executed_by_user_id?: string | null;
  payload_sent?: Record<string, unknown>;
  response_received?: {
    verified?: boolean;
    verification_message?: string;
    after_state?: Record<string, unknown>;
  };
}

interface ActionHistoryCardProps {
  ticketId: string;
  refreshTrigger?: number;
}

export function ActionHistoryCard({ ticketId, refreshTrigger }: ActionHistoryCardProps) {
  const [records, setRecords] = useState<ActionExecutionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadActionHistory();
  }, [ticketId, refreshTrigger]);

  async function loadActionHistory() {
    setIsLoading(true);
    try {
      const res = await fetchApi<ActionExecutionRecord[]>(`/tickets/${ticketId}/actions`);
      setRecords(res.data || []);
    } catch (err) {
      console.error("Failed to load action history:", err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-12 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] p-5 text-center text-xs text-[#73778B]">
        <History className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
        No autonomous actions executed on this ticket yet.
      </div>
    );
  }

  return (
    <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[6px] bg-[#E5E4EE] border border-[#BFC1E4] flex items-center justify-center text-[#5052C9]">
            <History className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A]">
            Action Execution &amp; Audit Trail ({records.length})
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#73778B]">Immutable Cryptographic Log</span>
      </div>

      <div className="divide-y divide-[#D8D6CE] border border-[#BDBCB5] rounded-[14px] overflow-hidden">
        {records.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const isSuccess = rec.execution_status === "success";
          const isPreview = rec.execution_status === "preview";

          return (
            <div key={rec.id} className="bg-[#FBFAF7] hover:bg-[#EDEBE5]/60 transition-colors">
              <div 
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer text-xs"
              >
                <div className="flex items-center gap-3">
                  {isSuccess ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : isPreview ? (
                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 capitalize">
                        {rec.action_type.replace(/_/g, " ")}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isSuccess ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        isPreview ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                        "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}>
                        {rec.execution_status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(rec.executed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span>&bull;</span>
                      <span className="font-mono truncate max-w-[200px]">Key: {rec.idempotency_key}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="p-3.5 bg-slate-50 border-t border-slate-100 space-y-3 text-xs">
                  {rec.response_received?.verification_message && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/60 text-emerald-800 text-[11px]">
                      <strong className="font-semibold">Post-Execution Verification: </strong>
                      {rec.response_received.verification_message}
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-300 font-mono text-[10px] space-y-1">
                    <div className="text-slate-500 font-bold uppercase tracking-wider">Audit Envelope Payload</div>
                    <div>Action ID: {rec.id}</div>
                    <div>Idempotency Key: {rec.idempotency_key}</div>
                    {rec.response_received?.after_state && (
                      <div className="mt-1 pt-1 border-t border-slate-800">
                        <span className="text-indigo-400">Database After-State: </span>
                        {JSON.stringify(rec.response_received.after_state)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
