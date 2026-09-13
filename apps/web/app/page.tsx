import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Activity,
  User
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#EDEBE5] text-[#24283A] selection:bg-[#5052C9] selection:text-white relative overflow-x-hidden font-sans">
      {/* Subtle warm ambient lighting */}
      <div className="absolute top-0 left-1/3 w-[36rem] h-[36rem] bg-[#E5E4EE]/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-1/4 w-[28rem] h-[28rem] bg-[#F8F7F3]/80 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-transparent px-6 sm:px-10 h-20 flex items-center transition-all">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-[12px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold shadow-[0_2px_10px_rgba(80,82,201,0.25)] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
                Resolve<span className="text-[#5052C9]">X</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-[#373B4D]">
            <Link href="/support" className="text-[#5052C9] font-bold hover:opacity-85 flex items-center gap-1.5 transition-opacity">
              <span>Customer Intake</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#5052C9]/10 text-[#5052C9] font-mono font-medium">Demo</span>
            </Link>
            <Link href="#features" className="hover:text-[#5052C9] transition-colors">Features</Link>
            <Link href="#scenario" className="hover:text-[#5052C9] transition-colors">Incident Narrative</Link>
            <Link href="/incidents" className="hover:text-[#5052C9] transition-colors">Incident Canvas</Link>
            <Link href="/analytics" className="hover:text-[#5052C9] transition-colors">CX Analytics</Link>
            <Link href="/cases" className="hover:text-[#5052C9] transition-colors">Customer Queue</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-[#5052C9] hover:bg-[#4345B0] text-white text-base font-semibold shadow-[0_4px_14px_rgba(80,82,201,0.28)] hover:shadow-[0_6px_20px_rgba(80,82,201,0.38)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 max-w-5xl mx-auto text-center relative">

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A] leading-[1.08]">
          Stop chasing tickets. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#5052C9] via-[#7779D8] to-[#24283A] bg-clip-text text-transparent">
            Uncover the incident.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#464B5E] max-w-2xl mx-auto leading-relaxed font-medium">
          Traditional support investigates customer symptoms in isolation. ResolveX correlates disparate complaints across payment logs, warehouse events, and system telemetry to identify systemic root causes and protect silent victims before they complain.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/support"
            className="unify-btn-primary text-sm shadow-[0_4px_14px_rgba(80,82,201,0.28)]"
          >
            <span>Customer Intake Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

        </div>

        <div className="mt-7 text-xs text-[#464B5E] flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 font-medium">
          <span className="flex items-center gap-1.5 text-[#24283A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Deterministic Baseline (seed=42)
          </span>
          <span className="hidden sm:inline text-[#C6C5BE]">•</span>
          <span className="flex items-center gap-1.5 text-[#24283A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Policy-Gated Safe Remediation
          </span>
          <span className="hidden sm:inline text-[#C6C5BE]">•</span>
          <span className="flex items-center gap-1.5 text-[#24283A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 93/93 Tests Verified
          </span>
        </div>
      </section>

      {/* Flagship Incident Visual Anchor (Unify Card Styling) */}
      <section id="scenario" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="unify-card overflow-hidden">
          {/* Unify Card Header Bar */}
          <div className="bg-[#EFEEE9] text-[#464B5E] px-5 py-3.5 flex items-center justify-between border-b-[1.5px] border-[#C6C5BE] text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] font-semibold text-[#24283A]">
                ResolveX Mission Control — Flagship Scenario INC-2026-041
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                AI REASONING ACTIVE
              </span>
              <span className="text-[#464B5E] hidden sm:inline">Acme Commerce Tenant</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#F8F7F3]">
            {/* Column 1: Customer Ticket Symptom */}
            <div className="p-5 rounded-[16px] bg-[#FBFAF7] border-[1.5px] border-[#D8D6CE] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] font-mono">1. Customer Symptom</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">Urgent</span>
              </div>
              <div>
                <h4 className="text-sm font-heading font-bold text-[#24283A]">Marcus Vance (TCK-1001)</h4>
                <p className="text-xs text-[#464B5E] mt-1 italic">&ldquo;Payment was deducted via credit card, but order still shows pending in portal.&rdquo;</p>
              </div>
              <div className="p-3 rounded-[11px] bg-[#F8F7F3] border-[1.5px] border-[#D8D6CE] text-[11px] font-mono text-[#24283A] space-y-1">
                <div>Charge: <span className="text-[#5052C9] font-bold">ch_stripe_98234 ($189.00)</span></div>
                <div>Status: <span className="text-emerald-700 font-bold">Succeeded</span> in Stripe</div>
                <div>Order: <span className="text-amber-800 font-bold">Missing webhook callback</span></div>
              </div>
            </div>

            {/* Column 2: Ticket-to-Incident Correlation */}
            <div className="unify-ai-insight p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5052C9] font-mono">2. Systemic Correlation</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#5052C9] font-mono border border-[#BFC1E4]">14 Tickets</span>
              </div>
              <div>
                <h4 className="text-sm font-heading font-bold text-[#24283A]">Incident INC-2026-041</h4>
                <p className="text-xs text-[#464B5E] mt-1 font-medium">Stripe Webhook Gateway Timeout (AWS us-east-1 HTTP 504)</p>
              </div>
              <div className="p-3 rounded-[11px] bg-[#FBFAF7] border border-[#BFC1E4] text-[11px] text-[#24283A] space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#464B5E]">Root Cause:</span>
                  <span className="text-[#24283A] font-bold">Gateway 504 Drop</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#464B5E]">Confidence:</span>
                  <span className="text-emerald-700 font-bold">0.94 (High)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#464B5E]">GMV At Risk:</span>
                  <span className="text-[#5052C9] font-bold">$2,450.00</span>
                </div>
              </div>
            </div>

            {/* Column 3: Blast Radius & Proactive Remediation */}
            <div className="p-5 rounded-[16px] bg-[#FBFAF7] border-[1.5px] border-[#D8D6CE] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] font-mono">3. Blast Radius &amp; Action</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">42 Silent Victims</span>
              </div>
              <div>
                <h4 className="text-sm font-heading font-bold text-[#24283A]">Predictive Pre-Ticket Outreach</h4>
                <p className="text-xs text-[#464B5E] mt-1 font-medium">Discovered 42 uncontacted customers charged during failure window.</p>
              </div>
              <div className="p-3 rounded-[11px] bg-[#F8F7F3] border-[1.5px] border-[#D8D6CE] text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Safe Remediation Drafted
                </div>
                <div className="text-[10px] text-[#464B5E]">
                  Auto-reconciliation queue generated with anti-spam deduplication locks.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars Section */}
      <section id="features" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 border-t-[1.5px] border-[#D8D6CE]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-heading font-bold uppercase tracking-wider text-[#5052C9]">Why ResolveX Is Different</h2>
          <h3 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A] mt-1">
            Built for Incident Operations, Not Generic CRM Tickets
          </h3>
          <p className="text-sm text-[#464B5E] mt-2 font-medium">
            Most customer support tools make human agents investigate symptoms one by one. ResolveX correlates the underlying cause and acts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="unify-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5E4EE] text-[#5052C9] flex items-center justify-center border border-[#BFC1E4]">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-base font-heading font-bold text-[#24283A]">Ticket-to-Incident Intelligence</h4>
            <p className="text-xs text-[#464B5E] leading-relaxed font-medium">
              Multi-signal correlation matrix synthesizes semantic embeddings, timestamps, shared entities, and microservice error codes to cluster dozens of symptoms into a single operational incident.
            </p>
          </div>

          <div className="unify-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-[12px] bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-heading font-bold text-[#24283A]">Predictive Blast Radius</h4>
            <p className="text-xs text-[#464B5E] leading-relaxed font-medium">
              Scans payment ledgers and warehouse queues during failure windows to discover affected customers who have not yet submitted a ticket, enabling proactive pre-ticket outreach.
            </p>
          </div>

          <div className="unify-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-heading font-bold text-[#24283A]">Policy-Gated Safe Actions</h4>
            <p className="text-xs text-[#464B5E] leading-relaxed font-medium">
              Strict deterministic policy gates enforce financial ceilings ($50 limit) and RBAC authorization. Low-risk cases resolve autonomously; consequential actions escalate with complete evidence.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="bg-[#EFEEE9] text-[#24283A] py-16 px-4 sm:px-6 border-t-[1.5px] border-[#C6C5BE]">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Experience the 90-Second Autonomous Support Flow
          </h2>
          <p className="text-xs sm:text-sm text-[#464B5E] max-w-xl mx-auto leading-relaxed font-medium">
            Acme Commerce synthetic enterprise simulation with 520 customers, 315 tickets, and full multi-agent orchestration is ready for evaluation.
          </p>
          <div className="pt-8 border-t-[1.5px] border-[#D8D6CE] text-[11px] text-[#464B5E] flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
            <div>© {new Date().getFullYear()} ResolveX – Enterprise Customer Incident Intelligence</div>
            <div className="flex items-center gap-5">
              <Link href="/cases" className="hover:text-[#5052C9]">Cases Queue</Link>
              <Link href="/incidents" className="hover:text-[#5052C9]">Incidents</Link>
              <Link href="/analytics" className="hover:text-[#5052C9]">CX Analytics</Link>
              <Link href="/settings" className="hover:text-[#5052C9]">Settings</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
