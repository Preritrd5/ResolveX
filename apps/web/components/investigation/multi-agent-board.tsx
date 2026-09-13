"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Bot,
  Play,
  RotateCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Activity,
  Cpu,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { AgentCard, SpecialistAgentData } from "./agent-card";
import { SupervisorSynthesis } from "./supervisor-synthesis";
import { InvestigationTrace, InvestigationStep } from "./investigation-trace";

interface MultiAgentBoardProps {
  ticketId: string;
  onInvestigationComplete?: (data: any) => void;
}

export function MultiAgentBoard({ ticketId, onInvestigationComplete }: MultiAgentBoardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investigation, setInvestigation] = useState<any | null>(null);
  const [showTrace, setShowTrace] = useState(true);

  // Load existing investigation on mount
  useEffect(() => {
    async function loadInvestigation() {
      try {
        const res = await fetchApi<any>(`/tickets/${ticketId}/investigation`);
        if (res.data) {
          setInvestigation(res.data);
        }
      } catch {
        // No investigation yet; waiting for user action
      }
    }
    if (ticketId) {
      loadInvestigation();
    }
  }, [ticketId]);

  const runInvestigation = async (forceRerun: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchApi<any>(
        `/ai/tickets/${ticketId}/investigate?force_rerun=${forceRerun}`,
        { method: "POST" }
      );

      if (res.data) {
        setInvestigation(res.data);
        if (onInvestigationComplete) {
          onInvestigationComplete(res.data);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run multi-agent investigation";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Convert raw findings & runs to SpecialistAgentData list
  const getSpecialistsList = (): SpecialistAgentData[] => {
    if (!investigation) return [];

    const findings = investigation.findings || [];
    const runs = investigation.agent_runs || [];
    const steps = investigation.investigation_steps || [];

    // Map of recognized specialist names
    const knownSpecialists = [
      { key: "billing", name: "Billing Agent", role: "Payment Gateway Audit" },
      { key: "order", name: "Order Agent", role: "Order Lifecycle & Warehouse Audit" },
      { key: "technical", name: "Technical / Service Agent", role: "Microservice Telemetry & Webhook Audit" },
      { key: "policy", name: "Policy / Knowledge Agent", role: "Corporate SLA & RAG Knowledge Grounding" },
      { key: "refund", name: "Refund Agent", role: "Refund Clearinghouse & Settlement Audit" },
      { key: "account", name: "Account Agent", role: "Customer Security & Lockout Audit" }
    ];

    const result: SpecialistAgentData[] = [];

    for (const spec of knownSpecialists) {
      const matchingFinding = findings.find((f: any) =>
        f.specialist_name?.toLowerCase().includes(spec.key)
      );
      const matchingRun = runs.find((r: any) =>
        r.agent_name?.toLowerCase().includes(spec.key)
      );
      const matchingStep = steps.find((s: any) =>
        s.agent_name?.toLowerCase().includes(spec.key)
      );

      if (matchingFinding || matchingRun || matchingStep) {
        result.push({
          name: matchingFinding?.specialist_name || matchingRun?.agent_name || spec.name,
          role: spec.role,
          status: matchingRun?.status || matchingStep?.status || "completed",
          conclusion: matchingFinding?.conclusion || matchingRun?.finding_summary || matchingStep?.finding_summary,
          confidence: matchingFinding?.confidence || matchingRun?.confidence || 0.95,
          evidenceRefs: matchingFinding?.evidence_refs || matchingRun?.evidence_ids || matchingStep?.evidence_refs || [],
          durationMs: matchingRun?.duration_ms || matchingStep?.duration_ms,
          error: matchingRun?.error || matchingStep?.error
        });
      }
    }

    return result;
  };

  const specialists = getSpecialistsList();
  const steps: InvestigationStep[] = investigation?.investigation_steps || [];

  return (
    <div className="bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] rounded-[20px] p-6 space-y-6 shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8D6CE] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5052C9]">
            <Layers className="w-4 h-4" /> Multi-Agent Orchestration Layer
          </div>
          <h2 className="text-lg font-heading font-bold text-[#24283A] mt-0.5 flex items-center gap-2">
            LangGraph Autonomous Investigation
            {investigation && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {investigation.status.toUpperCase()}
              </span>
            )}
          </h2>
          <p className="text-xs text-[#464B5E] mt-0.5">
            Centralized Supervisor coordinates specialist reasoning agents with cryptographic evidence aggregation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {investigation ? (
            <button
              onClick={() => runInvestigation(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] hover:bg-[#EDEBE5] text-[#24283A] text-xs font-heading font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#73778B] ${loading ? "animate-spin" : ""}`} />
              {loading ? "Re-investigating..." : "Re-run Investigation"}
            </button>
          ) : (
            <button
              onClick={() => runInvestigation(false)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6A6CD2] hover:to-[#4547B8] text-white text-xs font-heading font-semibold shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${loading ? "animate-pulse" : ""}`} />
              {loading ? "Orchestrating Fleet..." : "Run Multi-Agent Investigation"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-[12px] text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading && !investigation && (
        <div className="p-8 text-center bg-[#FBFAF7] rounded-[16px] border border-[#BDBCB5] space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#E5E4EE] text-[#5052C9] flex items-center justify-center mx-auto animate-spin">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-heading font-bold text-[#24283A]">Dispatching LangGraph Multi-Agent Fleet...</h4>
          <p className="text-xs text-[#464B5E] max-w-sm mx-auto">
            Supervisor is assembling CaseContext, evaluating domain intent, and fanning out to specialist investigators.
          </p>
        </div>
      )}

      {investigation && (
        <div className="space-y-6">
          {/* Supervisor Planning Card */}
          {investigation.supervisor_decision && (
            <div className="p-4 bg-gradient-to-br from-[#EEF0FA] to-[#E5E4EE] border-2 border-[#BFC1E4] rounded-[16px] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-[#24283A] flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-[#5052C9]" /> Supervisor Agent: Investigation Plan
                </span>
                <span className="font-mono text-[11px] text-[#5052C9] bg-white/80 border border-[#BFC1E4] px-2 py-0.5 rounded-[6px]">
                  Dynamic Dispatch: {investigation.supervisor_decision.selected_specialists.length} Specialists
                </span>
              </div>
              <p className="text-[#24283A] leading-relaxed">
                {investigation.supervisor_decision.reason}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {investigation.supervisor_decision.selected_specialists.map((spec: string) => (
                  <span
                    key={spec}
                    className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono font-semibold bg-white text-[#5052C9] border border-[#BFC1E4]"
                  >
                    ✓ {spec.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Specialist Agent Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-heading font-bold text-[#24283A] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#5052C9]" /> Specialist Reasoning Findings
              </span>
              <span className="text-[#73778B] font-mono text-[11px]">
                {specialists.length} agents collaborated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specialists.map((agent) => (
                <AgentCard key={agent.name} agent={agent} />
              ))}
            </div>
          </div>

          {/* Supervisor Triangulated Synthesis */}
          <SupervisorSynthesis
            summary={investigation.summary}
            confidence={investigation.overall_confidence}
            recommendedNextStep={investigation.recommended_next_step}
            specialistCount={specialists.length}
            evidenceCount={investigation.evidence?.length || 0}
            dagEngine={investigation.trace_metadata?.orchestration_engine || "LangGraph StateGraph"}
          />

          {/* Investigation Trace Drawer */}
          <div className="border-[1.5px] border-[#C6C5BE] rounded-[16px] bg-[#FBFAF7] overflow-hidden">
            <button
              onClick={() => setShowTrace(!showTrace)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-heading font-bold text-[#24283A] hover:bg-[#EDEBE5] transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5052C9]" />
                Audit Trail &amp; Sequential Execution Trace ({steps.length} steps)
              </span>
              {showTrace ? <ChevronUp className="w-4 h-4 text-[#73778B]" /> : <ChevronDown className="w-4 h-4 text-[#73778B]" />}
            </button>

            {showTrace && (
              <div className="p-4 border-t border-[#D8D6CE] bg-[#F8F7F3]">
                <InvestigationTrace steps={steps} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
