"use client";

import React, { useEffect, useState } from "react";
import { Bot, Cpu, ShieldCheck, CheckCircle2 } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface AgentItem {
  id: string;
  name: string;
  role_description: string;
  model_name: string;
  is_active: boolean;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAgents() {
      try {
        setLoading(true);
        const res = await fetchApi<AgentItem[]>("/agents");
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          <ShieldCheck className="w-4 h-4" /> Agent Fleet Governance
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">AI Agent Registry</h1>
        <p className="text-sm text-slate-500 mt-1">
          Catalog of 12 specialized reasoning components configured for LangGraph orchestration (Phase 2).
        </p>
      </div>

      <div className="p-4 bg-slate-900 text-slate-300 rounded-lg text-xs leading-relaxed border border-slate-800">
        <span className="font-semibold text-white">Phase 1 Notice:</span> This registry represents the verified architectural specification of ResolveX specialist agents. Multi-agent execution and LangGraph DAG scheduling activate in Phase 2. Zero synthetic or fabricated activity is displayed.
      </div>

      {loading ? (
        <LoadingState message="Loading agent catalog..." description="Querying Supabase agents table." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <div
              key={agent.id}
              className="p-5 bg-white rounded-lg border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    #{i + 1}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Registered
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{agent.name}</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{agent.role_description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-slate-500">
                  <Cpu className="w-3.5 h-3.5" /> {agent.model_name}
                </span>
                <span>Stateless Node</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
