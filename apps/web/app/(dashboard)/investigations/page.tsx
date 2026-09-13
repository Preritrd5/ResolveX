"use client";

import React from "react";
import { SearchCode, Bot, ShieldCheck, Terminal } from "lucide-react";

export default function InvestigationsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          <SearchCode className="w-4 h-4" /> Autonomous Reasoning Workbench
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Investigations & Replay Workbench</h1>
        <p className="text-sm text-slate-500 mt-1">
          Trace and replay multi-agent diagnostic steps, tool payloads, and verified evidence hashes.
        </p>
      </div>

      <div className="p-8 bg-white rounded-lg border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Investigation Session Diagnostics (Phase 2 & 3)</h3>
            <p className="text-xs text-slate-500">Autonomous step-by-step reasoning log visualization</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/60 font-mono text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 font-semibold">
            <Terminal className="w-3.5 h-3.5" /> Investigation Pipeline Contract Ready
          </div>
          <p className="text-slate-600">
            • <span className="font-semibold text-slate-800">Database Schema:</span> tables <code className="bg-slate-200/80 px-1 py-0.5 rounded">investigations</code>, <code className="bg-slate-200/80 px-1 py-0.5 rounded">investigation_steps</code>, and <code className="bg-slate-200/80 px-1 py-0.5 rounded">evidence</code> are migrated in Supabase.
          </p>
          <p className="text-slate-600">
            • <span className="font-semibold text-slate-800">Shared Case Context:</span> Standard state machine defined in <code className="bg-slate-200/80 px-1 py-0.5 rounded">docs/CASE_CONTEXT.md</code>.
          </p>
          <p className="text-slate-600">
            • <span className="font-semibold text-slate-800">Status:</span> Foundation ready. Live agent streaming activates in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
