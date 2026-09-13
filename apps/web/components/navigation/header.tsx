"use client";

import React from "react";
import { AlertCircle, Terminal, User } from "lucide-react";

export function Header() {
  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
      {/* Incident Status Pulse */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Active Incident INC-2026-041: Stripe Webhook Dropping Orders</span>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
          <Terminal className="w-3 h-3 text-slate-400" />
          <span>Demo Mode: Deterministic (seed=42)</span>
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-semibold">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Maya Patel</div>
            <div className="text-[10px] text-slate-400">Lead Investigator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
