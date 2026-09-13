"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface DemoStep {
  step: string;
  title: string;
  route: string;
  cue: string;
}

export function DemoGuideBanner() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [steps, setSteps] = useState<DemoStep[]>([]);
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDemo() {
      try {
        const res = await fetchApi<{ recommended_flow: DemoStep[] }>("/demo/status");
        if (res.data?.recommended_flow) {
          setSteps(res.data.recommended_flow);
        }
      } catch {
        setSteps([
          { step: "1", title: "Overview", route: "/overview", cue: "Command center pulse & early anomaly" },
          { step: "2", title: "Cases Queue", route: "/cases", cue: "Disparate customer symptoms requiring triage" },
          { step: "3", title: "Marcus Vance Case", route: "/cases/tck_acme_1001", cue: "Multi-agent investigation & evidence graph" },
          { step: "4", title: "Incident Canvas", route: "/incidents/inc_acme_041", cue: "Correlates 14 tickets to Stripe webhook timeout" },
          { step: "5", title: "Predictive Blast Radius", route: "/incidents/inc_acme_041/impact", cue: "Discovers 42 silent victims pre-ticket" },
          { step: "6", title: "Proactive Queue", route: "/proactive", cue: "Policy-governed anti-spam communications" },
          { step: "7", title: "Escalation Desk", route: "/escalations", cue: "Human-in-the-loop $50 policy approval gate" },
          { step: "8", title: "CX Intelligence", route: "/analytics", cue: "Quantifiable resolution rates & diagnostics" },
        ]);
      }
    }
    loadDemo();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      setResetNotice(null);
      await fetchApi<{ message: string }>("/demo/reset", {
        method: "POST",
        body: JSON.stringify({ seed: 42, actor: "hackathon_lead" }),
      });
      setResetNotice("Baseline restored!");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      setResetNotice("Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  const activeIndex = steps.findIndex(s => pathname === s.route || (s.route !== "/overview" && pathname.startsWith(s.route)));
  const currentStep = activeIndex >= 0 ? steps[activeIndex] : null;

  return (
    <div className="relative z-40 bg-slate-900 border-b border-slate-800 text-slate-200 text-xs px-3 sm:px-6 py-1.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Compact Step Indicator & Dropdown */}
        <div className="flex items-center gap-2 min-w-0" ref={menuRef}>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold tracking-wider uppercase shrink-0">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">90s Demo</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[11px] font-medium border border-slate-700/60"
            >
              {currentStep ? (
                <span>
                  <span className="text-indigo-400 font-mono font-bold mr-1">#{currentStep.step}</span>
                  <span className="truncate max-w-[140px] sm:max-w-[200px] inline-block align-bottom">{currentStep.title}</span>
                </span>
              ) : (
                <span>Pitch Flow ({steps.length} Steps)</span>
              )}
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in-50 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <span>90-Second Demo Progression</span>
                  <span className="text-indigo-400">{steps.length} Steps</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 py-0.5">
                  {steps.map((s, idx) => {
                    const isStepActive = pathname === s.route || (s.route !== "/overview" && pathname.startsWith(s.route));
                    return (
                      <Link
                        key={s.step}
                        href={s.route}
                        onClick={() => setIsOpen(false)}
                        className={`px-3 py-2 flex items-start gap-2.5 transition-colors text-xs ${
                          isStepActive ? "bg-indigo-950/60 text-indigo-200 border-l-2 border-indigo-500" : "hover:bg-slate-800/80 text-slate-300"
                        }`}
                      >
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                          0{s.step}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-200 flex items-center justify-between">
                            <span>{s.title}</span>
                            {isStepActive && <span className="text-[10px] text-indigo-400 uppercase font-bold">Active</span>}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{s.cue}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick next step shortcut (Desktop) */}
          {activeIndex >= 0 && activeIndex < steps.length - 1 && (
            <Link
              href={steps[activeIndex + 1].route}
              className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors"
            >
              <span>Next: {steps[activeIndex + 1].title}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Right: Quick Reset Button */}
        <div className="flex items-center gap-2 shrink-0">
          {resetNotice && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> {resetNotice}
            </span>
          )}

          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 text-[11px] font-semibold border border-slate-700 disabled:opacity-50"
            title="Reset dataset to clean starting state (seed=42)"
          >
            <RotateCcw className={`w-3 h-3 ${resetting ? "animate-spin text-indigo-400" : "text-slate-400"}`} />
            <span className="hidden sm:inline">{resetting ? "Resetting..." : "Reset Baseline"}</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
