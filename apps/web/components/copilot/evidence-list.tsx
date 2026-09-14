"use client";

import React, { useState } from "react";
import {
  FileText,
  CreditCard,
  Package,
  Activity,
  User,
  ShieldCheck,
  Hash,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export interface EvidenceItem {
  id: string;
  type: string;
  source_entity_id: string;
  description: string;
  timestamp?: string;
  relevance_score: number;
  raw_data?: Record<string, unknown>;
  sha256_hash?: string;
}

interface EvidenceListProps {
  evidence: EvidenceItem[];
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  const [selectedItem, setSelectedItem] = useState<EvidenceItem | null>(null);

  // Defensively deduplicate evidence items to prevent duplicate cards and React key collisions
  const uniqueEvidence = React.useMemo(() => {
    const seen = new Set<string>();
    return (evidence || []).filter((item, idx) => {
      const key = item.id || `evidence-${idx}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [evidence]);

  const getIcon = (type: string) => {
    switch (type) {
      case "payment_record":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case "order_log":
        return <Package className="w-3.5 h-3.5 text-blue-600" />;
      case "service_event":
        return <Activity className="w-3.5 h-3.5 text-rose-600" />;
      case "customer_profile":
        return <User className="w-3.5 h-3.5 text-indigo-600" />;
      case "policy_rule":
      default:
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  if (uniqueEvidence.length === 0) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200/60 rounded text-xs text-slate-400 italic">
        No verified evidence recorded yet. Run analysis to audit transactions and telemetry.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {uniqueEvidence.map((item, index) => (
        <div
          key={`${item.id || "evidence"}-${index}`}
          className="p-3 bg-white border border-slate-200/90 rounded-md shadow-xs hover:border-indigo-300 transition-colors space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {getIcon(item.type)}
              <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-600">
                {item.type.replace("_", " ")}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60">
              Relevance: {Math.round(item.relevance_score * 100)}%
            </span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-sans">
            {item.description}
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
            <span className="font-mono truncate max-w-[170px]">
              ID: {item.source_entity_id}
            </span>
            <button
              onClick={() => setSelectedItem(item)}
              className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
            >
              <Hash className="w-3 h-3" /> Audit Hash
            </button>
          </div>
        </div>
      ))}

      {/* Verification Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">Cryptographic Evidence Verification</h4>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Source Entity ID:</span>
                <p className="font-mono text-slate-900 bg-slate-50 p-1.5 rounded border border-slate-200/60 mt-0.5 select-all">
                  {selectedItem.source_entity_id}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">SHA-256 Audit Hash:</span>
                <p className="font-mono text-[11px] text-indigo-700 bg-indigo-50/50 p-1.5 rounded border border-indigo-200/60 mt-0.5 break-all select-all font-bold">
                  {selectedItem.sha256_hash || "Calculated at runtime"}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Raw Stored Payload:</span>
                <pre className="p-2.5 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto max-h-48 mt-0.5">
                  {JSON.stringify(selectedItem.raw_data || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
