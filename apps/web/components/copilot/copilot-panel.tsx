"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  ShieldAlert,
  Copy,
  Check,
  RotateCw,
  BookOpen,
  ArrowRight,
  Zap,
  Cpu,
  HelpCircle,
  AlertTriangle
} from "lucide-react";
import { ReasoningTimeline, Stage } from "./reasoning-timeline";
import { EvidenceList, EvidenceItem } from "./evidence-list";
import { SourcesModal, KnowledgeSnippet } from "./sources-modal";
import { fetchApi } from "@/lib/api-client";

interface SpecialistFinding {
  specialist_name: string;
  finding_type: string;
  status: string;
  conclusion: string;
  confidence: number;
}

interface AIResponseData {
  suggested_response: string;
  reasoning_summary: string;
  confidence: number;
  evidence_ids: string[];
  policy_sources: string[];
  recommended_next_step: string;
  provider: string;
}

interface InvestigationData {
  investigation_id: string;
  ticket_id: string;
  status: string;
  summary: string;
  overall_confidence: number;
  intent: {
    intent: string;
    confidence: number;
    urgency: string;
    sentiment: string;
    complexity: string;
    provider: string;
    reasoning_summary?: string;
  };
  routing: {
    recommended_team: string;
    priority: string;
    ai_resolvable: boolean;
    reason: string;
    confidence: number;
  };
  findings: SpecialistFinding[];
  evidence: EvidenceItem[];
  relevant_policies: KnowledgeSnippet[];
  ai_response: AIResponseData;
  recommended_next_step: string;
}

interface CopilotPanelProps {
  ticketId: string;
  customerName?: string;
  onAnalysisComplete?: (data: InvestigationData) => void;
}

export function CopilotPanel({ ticketId, customerName, onAnalysisComplete }: CopilotPanelProps) {
  const [data, setData] = useState<InvestigationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [stages, setStages] = useState<Stage[]>([
    { id: "1", label: "Understand Intent & Sentiment", status: "pending" },
    { id: "2", label: "Assemble Case Context from Supabase", status: "pending" },
    { id: "3", label: "Audit Billing, Orders & Microservice Telemetry", status: "pending" },
    { id: "4", label: "Query ChromaDB Policy Vector Store", status: "pending" },
    { id: "5", label: "Synthesize Grounded Customer Response", status: "pending" }
  ]);

  const runInvestigation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Transition stages in real-time
      setStages((prev) =>
        prev.map((s, idx) => ({
          ...s,
          status: idx === 0 ? "running" : "pending"
        }))
      );

      // Trigger backend API
      const res = await fetchApi<InvestigationData>(`/ai/tickets/${ticketId}/analyze`, {
        method: "POST"
      });

      // Complete stages sequentially
      for (let i = 0; i < 5; i++) {
        setStages((prev) =>
          prev.map((s, idx) => ({
            ...s,
            status: idx <= i ? "completed" : idx === i + 1 ? "running" : "pending"
          }))
        );
      }

      setData(res.data);
      if (onAnalysisComplete) {
        onAnalysisComplete(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Investigation failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!data?.ai_response?.suggested_response) return;
    navigator.clipboard.writeText(data.ai_response.suggested_response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceScore = data ? Math.round(data.overall_confidence * 100) : null;
  const isHighConfidence = confidenceScore !== null && confidenceScore >= 90;
  const isMediumConfidence = confidenceScore !== null && confidenceScore >= 70 && confidenceScore < 90;

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              ResolveX AI Support Copilot
            </h3>
            <p className="text-[10px] text-slate-400">Context-Aware Investigation & Response Engine</p>
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${
                isHighConfidence
                  ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40"
                  : isMediumConfidence
                  ? "bg-amber-950/80 text-amber-400 border-amber-500/40"
                  : "bg-rose-950/80 text-rose-400 border-rose-500/40"
              }`}
            >
              AI Confidence: {confidenceScore}%
            </span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Trigger Button if not run */}
        {!data && !loading && (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Run Single-Case AI Investigation</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Audits transactions, cross-references service logs, queries corporate policy RAG, and generates a grounded response.
              </p>
            </div>
            <button
              onClick={runInvestigation}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" /> Start Investigation
            </button>
          </div>
        )}

        {/* Loading / Real Execution Timeline */}
        {loading && (
          <div className="space-y-3">
            <ReasoningTimeline stages={stages} />
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
            ⚠️ {error}
          </div>
        )}

        {/* Investigation Results */}
        {data && (
          <div className="space-y-4">
            {/* 1. Intent & Routing Banner */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider">Detected Intent:</span>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                    {data.intent.intent}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 capitalize">
                  Provider: {data.intent.provider.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400">Assigned Team:</span>{" "}
                  <span className="font-semibold text-slate-800">{data.routing.recommended_team}</span>
                </div>
                <div>
                  <span className="text-slate-400">Priority:</span>{" "}
                  <span className="font-semibold uppercase text-slate-800">{data.routing.priority}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-200/50">
                "{data.routing.reason}"
              </p>
            </div>

            {/* 2. Specialist Findings */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Specialist Domain Findings
              </h4>
              <div className="space-y-1.5 text-xs">
                {data.findings.map((f, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded border text-xs leading-relaxed ${
                      f.status === "DISCREPANCY_DETECTED"
                        ? "bg-amber-50/70 border-amber-200/70 text-amber-950"
                        : "bg-slate-50 border-slate-200/60 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-[11px] mb-0.5">
                      <span className="text-indigo-900">{f.specialist_name}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                          f.status === "DISCREPANCY_DETECTED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {f.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700">{f.conclusion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Verified Evidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" /> Verified Evidence ({data.evidence.length})
                </h4>
              </div>
              <EvidenceList evidence={data.evidence} />
            </div>

            {/* 4. Suggested Grounded Response */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Grounded Suggested Response
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSources(true)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" /> Sources Used ({data.relevant_policies.length})
                  </button>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/40 rounded-lg border border-indigo-100 text-xs text-slate-900 leading-relaxed space-y-3">
                <p className="whitespace-pre-line font-sans">{data.ai_response.suggested_response}</p>

                <div className="flex items-center justify-between pt-2 border-t border-indigo-100 text-[11px]">
                  <span className="text-slate-400 font-mono text-[10px]">
                    No action executed (Safety Gate Active)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={runInvestigation}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded font-medium inline-flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      <RotateCw className="w-3 h-3" /> Regenerate
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium inline-flex items-center gap-1 cursor-pointer text-[11px] shadow-xs"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy Response"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Recommended Next Step Banner */}
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800">
                  Recommended Support Action:
                </span>
                <p className="mt-0.5 text-xs font-semibold text-amber-900">{data.recommended_next_step}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sources Modal */}
      {data && (
        <SourcesModal
          sources={data.relevant_policies}
          isOpen={showSources}
          onClose={() => setShowSources(false)}
        />
      )}
    </div>
  );
}
