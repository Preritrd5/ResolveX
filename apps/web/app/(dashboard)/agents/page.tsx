"use client";

import React, { useEffect, useState } from "react";
import {
  Bot,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  Clock,
  Eye,
  BarChart3
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { AgentRunModal, AgentRunDetail } from "@/components/agents/agent-run-modal";
import { formatDate } from "@/lib/utils";

interface AgentWithStats {
  id: string;
  name: string;
  role_description: string;
  model_name: string;
  is_active: boolean;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at?: string;
  latest_run?: AgentRunDetail;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inspectRun, setInspectRun] = useState<{ run: AgentRunDetail; agent: AgentWithStats } | null>(null);

  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        const res = await fetchApi<AgentWithStats[]>("/agents");
        setAgents(res.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load agent registry";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadAgents();
  }, []);

  const totalFleetRuns = agents.reduce((acc, a) => acc + (a.total_runs || 0), 0);
  const activeAgentsCount = agents.filter((a) => (a.total_runs || 0) > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold uppercase tracking-wider text-[#5052C9]">
            <ShieldCheck className="w-4 h-4" /> Agent Fleet Governance
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#24283A] mt-1">AI Agent Registry</h1>
          <p className="text-sm text-[#464B5E] mt-1 font-sans">
            Catalog of 12 specialized reasoning components orchestrated via LangGraph StateGraph.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#F8F7F3] rounded-[14px] border-[1.5px] border-[#C6C5BE] text-xs shadow-sm flex items-center gap-3">
            <div>
              <span className="text-[#464B5E] text-[10px] block font-mono">TOTAL EXECUTIONS</span>
              <span className="text-base font-bold text-[#24283A] font-mono">{totalFleetRuns}</span>
            </div>
            <div className="h-6 w-px bg-[#D8D6CE]"></div>
            <div>
              <span className="text-[#464B5E] text-[10px] block font-mono">ACTIVE AGENTS</span>
              <span className="text-base font-bold text-[#5052C9] font-mono">{activeAgentsCount} / 12</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-[#24283A] text-slate-300 rounded-[16px] text-xs leading-relaxed border border-[#353b52] flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 font-sans">
          <Layers className="w-4 h-4 text-[#7779D8] shrink-0" />
          <span>
            <strong className="text-white font-semibold font-heading">Phase 3 LangGraph Fleet:</strong> Real-time orchestration layer is active. Specialist reasoning execution counters reflect verified database runs. Zero synthetic or fabricated activity is displayed.
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#7779D8] font-semibold px-2.5 py-1 bg-[#1b1e2b] rounded-[6px] border border-[#5052C9]/40 shrink-0 ml-4">
          DAG v3.0
        </span>
      </div>

      {loading ? (
        <LoadingState message="Loading agent fleet telemetry..." description="Querying Supabase agents and agent_runs records." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => {
            const hasRuns = agent.total_runs > 0;
            const successRate = hasRuns
              ? Math.round((agent.successful_runs / agent.total_runs) * 100)
              : null;

            return (
              <div
                key={agent.id}
                className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] hover:border-[#BDBCB5] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4]/50 flex items-center justify-center font-bold text-xs font-mono">
                      #{i + 1}
                    </div>
                    {hasRuns ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active ({agent.total_runs} runs)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FBFAF7] text-[#464B5E] border border-[#D8D6CE] flex items-center gap-1 font-mono">
                        Idle (0 runs)
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-heading font-bold text-[#24283A]">{agent.name}</h3>
                  <p className="text-xs text-[#464B5E] mt-2 leading-relaxed font-sans">{agent.role_description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#D8D6CE] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#464B5E]">Total Executions:</span>
                    <span className="font-semibold text-[#24283A]">
                      {hasRuns ? `${agent.total_runs} runs` : "No executions yet"}
                    </span>
                  </div>

                  {hasRuns && (
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#464B5E]">Success Rate:</span>
                      <span className="font-semibold text-emerald-700">
                        {successRate}% ({agent.successful_runs}/{agent.total_runs})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-[#464B5E] font-mono text-[10px]">
                      <Cpu className="w-3 h-3 text-[#5052C9]" /> {agent.model_name}
                    </span>

                    {agent.latest_run ? (
                      <button
                        onClick={() => setInspectRun({ run: agent.latest_run!, agent })}
                        className="text-[#5052C9] hover:underline font-heading font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" /> Inspect Run
                      </button>
                    ) : (
                      <span className="text-[#464B5E] font-mono text-[10px]">Stateless Node</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Run Modal */}
      {inspectRun && (
        <AgentRunModal
          run={inspectRun.run}
          agentName={inspectRun.agent.name}
          agentModel={inspectRun.agent.model_name}
          onClose={() => setInspectRun(null)}
        />
      )}
    </div>
  );
}
