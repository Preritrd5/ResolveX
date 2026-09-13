"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Send,
  AlertTriangle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface CustomerEvidenceSignal {
  signal_name: string;
  matched: boolean;
  description: string;
  source?: string;
  timestamp?: string | null;
}

export interface CustomerImpactPrediction {
  id: string;
  incident_id?: string;
  customer_id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  classification: string;
  evidence_confidence?: number;
  confidence_score?: number;
  risk_level?: string;
  operational_risk_level?: string;
  impact_score?: number;
  operational_risk_score?: number;
  reason?: string;
  prediction_reason?: string;
  evidence?: CustomerEvidenceSignal[];
  evidence_signals?: CustomerEvidenceSignal[];
  matched_signals?: string[];
  missing_signals?: string[];
  observed_facts?: string[];
  predicted_impact?: string[];
  recommended_action?: string | null;
  communication_status?: string;
  method?: string;
  prediction_method?: string;
  created_at?: string;
  predicted_at?: string;
}

interface CustomerRiskMatrixProps {
  predictions: CustomerImpactPrediction[];
  incidentId?: string;
  onSelectCustomer?: (customerId: string) => void;
  onRefresh?: () => void;
}

export function CustomerRiskMatrix({ predictions = [], incidentId, onRefresh }: CustomerRiskMatrixProps) {
  const [classificationFilter, setClassificationFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = predictions.filter((p) => {
    if (classificationFilter !== "all" && p.classification !== classificationFilter) {
      return false;
    }
    const currentRisk = (p.operational_risk_level || p.risk_level || "MEDIUM").toUpperCase();
    if (riskFilter !== "all" && currentRisk !== riskFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cName = (p.customer_name || "").toLowerCase();
      const cEmail = (p.customer_email || "").toLowerCase();
      const cReason = (p.prediction_reason || p.reason || "").toLowerCase();
      return cName.includes(q) || cEmail.includes(q) || cReason.includes(q);
    }
    return true;
  });

  return (
    <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] overflow-hidden space-y-0">
      {/* Header & Filter Strip */}
      <div className="p-4 border-b border-[#D8D6CE] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FBFAF7]">
        <div>
          <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#5052C9]" />
            Customer Risk Prioritization &amp; Evidence Matrix ({filtered.length})
          </h3>
          <p className="text-[11px] text-[#464B5E]">
            Customers ranked by operational impact, transaction value, and evidence confidence.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#73778B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#FBFAF7] border border-[#BDBCB5] rounded-[9px] text-xs focus:outline-none focus:border-[#5052C9] text-[#24283A]"
            />
          </div>

          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FBFAF7] border border-[#BDBCB5] rounded-[9px] text-xs font-medium text-[#24283A] focus:outline-none"
          >
            <option value="all">All Classifications</option>
            <option value="CONFIRMED_AFFECTED">Confirmed Affected</option>
            <option value="LIKELY_AFFECTED">Likely Affected</option>
            <option value="POTENTIALLY_AFFECTED">Potentially Affected</option>
            <option value="NOT_AFFECTED">Not Affected</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#FBFAF7] border border-[#BDBCB5] rounded-[9px] text-xs font-medium text-[#24283A] focus:outline-none"
          >
            <option value="all">All Risk Tiers</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-[#EDEBE5]/60 border-b border-[#D8D6CE] text-[#464B5E] text-[10px] uppercase font-heading font-bold">
            <tr>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Classification</th>
              <th className="py-2.5 px-3">Evidence Confidence</th>
              <th className="py-2.5 px-3">Impact Risk</th>
              <th className="py-2.5 px-3">Recommended Proactive Support</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8D6CE]/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-[#73778B]">
                  No customers matched the selected risk and classification filters.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const isExpanded = expandedId === p.id;
                const isConfirmed = p.classification === "CONFIRMED_AFFECTED";
                const isLikely = p.classification === "LIKELY_AFFECTED";
                const confidence = p.evidence_confidence ?? p.confidence_score ?? 0.8;
                const riskLevel = (p.operational_risk_level || p.risk_level || "MEDIUM").toUpperCase();
                const riskScore = Math.round(p.operational_risk_score ?? p.impact_score ?? 50);
                const commStatus = p.communication_status || "DRAFTED";
                const evidenceList = p.evidence || p.evidence_signals || [];
                const factsList = p.observed_facts || [];
                const impactList = p.predicted_impact || [];
                const modelMethod = p.prediction_method || p.method || "deterministic_rules";

                return (
                  <React.Fragment key={p.id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      className="hover:bg-[#EDEBE5]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-heading font-semibold text-[#24283A]">{p.customer_name || "Customer"}</div>
                        <div className="text-[10px] text-[#73778B] font-mono">{p.customer_email || ""}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isConfirmed
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : isLikely
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : p.classification === "POTENTIALLY_AFFECTED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-[#FBFAF7] text-[#464B5E] border border-[#BDBCB5]"
                          }`}
                        >
                          {isConfirmed
                            ? "CONFIRMED AFFECTED"
                            : isLikely
                            ? "LIKELY AFFECTED"
                            : p.classification.replace("_", " ")}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-[#24283A]">
                        {Math.round(confidence * 100)}%
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase ${
                            riskLevel === "CRITICAL"
                              ? "bg-rose-600 text-white"
                              : riskLevel === "HIGH"
                              ? "bg-rose-100 text-rose-800"
                              : riskLevel === "MEDIUM"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {riskLevel} ({riskScore})
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-[#464B5E] max-w-xs truncate">
                        {p.recommended_action || "Proactive outreach recommended"}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded-[6px] text-[10px] font-bold uppercase font-mono ${
                            commStatus === "SENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : commStatus === "APPROVED"
                              ? "bg-blue-100 text-blue-800"
                              : commStatus === "DRAFTED"
                              ? "bg-[#FBFAF7] text-[#24283A] border border-[#BDBCB5]"
                              : "bg-[#EDEBE5] text-[#73778B]"
                          }`}
                        >
                          {commStatus}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button className="text-[#73778B] hover:text-[#24283A] p-1 cursor-pointer">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Evidence Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#EDEBE5]/40">
                        <td colSpan={7} className="p-4 border-t border-[#D8D6CE]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {/* Left: Matched vs Missing Signals */}
                            <div className="bg-[#FBFAF7] p-3.5 rounded-[14px] border border-[#BDBCB5] space-y-2.5 shadow-xs">
                              <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-[#464B5E]">
                                Evidence Corroboration Signals
                              </span>
                              {evidenceList.length === 0 ? (
                                <p className="text-[11px] text-[#73778B] italic">No individual signals recorded.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {evidenceList.map((ev, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      {ev.matched ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border border-[#BDBCB5] shrink-0 mt-0.5" />
                                      )}
                                      <span className={ev.matched ? "text-[#24283A] font-medium" : "text-[#73778B]"}>
                                        {ev.description}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Right: Observed Facts vs Predicted Impact */}
                            <div className="bg-[#FBFAF7] p-3.5 rounded-[14px] border border-[#BDBCB5] space-y-2.5 shadow-xs">
                              <div>
                                <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-[#73778B]">
                                  Observed Ground Truth Facts
                                </span>
                                {factsList.length === 0 ? (
                                  <p className="text-[11px] text-[#73778B] italic mt-1">None specified.</p>
                                ) : (
                                  <ul className="mt-1 space-y-1 text-[#24283A] list-disc list-inside">
                                    {factsList.map((f, i) => (
                                      <li key={i}>{f}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div className="pt-2 border-t border-[#D8D6CE]">
                                <span className="font-heading font-bold uppercase tracking-wider text-[10px] text-[#5052C9]">
                                  Predicted Operational Impact
                                </span>
                                {impactList.length === 0 ? (
                                  <p className="text-[11px] text-[#5052C9] italic mt-1">
                                    {p.prediction_reason || p.reason || "High probability of operational impact."}
                                  </p>
                                ) : (
                                  <ul className="mt-1 space-y-1 text-[#24283A] list-disc list-inside font-medium">
                                    {impactList.map((pi, i) => (
                                      <li key={i}>{pi}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div className="pt-2 border-t border-[#D8D6CE] flex items-center justify-between">
                                <span className="text-[10px] text-[#73778B] font-mono">
                                  Model: {modelMethod}
                                </span>
                                <Link
                                  href={`/customers/${p.customer_id}`}
                                  className="inline-flex items-center gap-1 font-heading font-semibold text-[#5052C9] hover:underline"
                                >
                                  <span>Open Customer 360</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
