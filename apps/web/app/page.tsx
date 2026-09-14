"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  Network,
  BarChart3,
  Inbox,
  ExternalLink,
  ArrowUpRight
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";

interface NavItem {
  id: string;
  label: string;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "customer-intake", label: "Customer Intake", badge: "Demo" },
  { id: "features", label: "Features" },
  { id: "incident-narrative", label: "Incident Narrative" },
  { id: "incident-canvas", label: "Incident Canvas" },
  { id: "cx-analytics", label: "CX Analytics" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll spy & navbar background transition
  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.id);

    const handleScroll = () => {
      if (window.scrollY < 200) {
        setActiveSection("");
      }
      setIsScrolled(window.scrollY > 20);
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      if (window.scrollY < 200) {
        setActiveSection("");
        return;
      }
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "-25% 0px -60% 0px",
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetElement = document.getElementById(id);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", `#${id}`);
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen text-[#24283A] selection:bg-[#5052C9] selection:text-white relative overflow-x-hidden font-sans">
      {/* Global Atmospheric Visual System — Landing Variant */}
      <AtmosphericBackground variant="landing" />

      {/* Navigation Header — Seamless & Integrated with Hero */}
      <header
        className={`sticky top-0 z-50 px-4 sm:px-8 lg:px-12 h-20 flex items-center transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-xl border-b border-white/90 shadow-[0_4px_24px_rgba(31,38,135,0.06)]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold shadow-[0_2px_8px_rgba(80,82,201,0.22)] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
                Resolve<span className="text-[#5052C9]">X</span>
              </span>
            </Link>
          </div>

          {/* Desktop In-Page Section Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2.5 text-[15px] font-semibold tracking-[-0.01em]">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleScrollTo(e, item.id)}
                  className={`relative px-3.5 py-2 rounded-xl transition-all duration-150 ease-out flex items-center gap-2 cursor-pointer border ${
                    isActive
                      ? "text-[#5052C9] font-bold bg-[#E5E4EE]/80 border-[#BFC1E4]/80 shadow-2xs"
                      : "text-[#464B5E] border-transparent hover:text-[#24283A] hover:bg-white/75 hover:border-white/85 hover:shadow-2xs"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium transition-colors ${
                        isActive
                          ? "bg-[#5052C9] text-white"
                          : "bg-[#5052C9]/10 text-[#5052C9]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-3.5 right-3.5 h-[2px] bg-[#5052C9] rounded-full animate-in fade-in duration-200" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {/* Sign In button navigates to Authentication flow (Primary CTA) */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#5052C9] hover:bg-[#4345B0] text-white text-sm font-semibold shadow-[0_2px_8px_rgba(80,82,201,0.22)] hover:shadow-[0_4px_14px_rgba(80,82,201,0.32)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Sign In
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-10 h-10 rounded-xl bg-white/75 hover:bg-white/95 border border-white/90 text-[#24283A] flex items-center justify-center transition-colors cursor-pointer shadow-2xs backdrop-blur-md"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Dropdown Menu (In-Page Navigation) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-20 bg-white/90 backdrop-blur-xl border-b border-white/90 shadow-xl z-40 p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleScrollTo(e, item.id)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer text-[15px] font-semibold border ${
                    isActive
                      ? "bg-[#E5E4EE] text-[#5052C9] font-bold border-[#BFC1E4]/70 shadow-2xs"
                      : "border-transparent hover:bg-white/70 hover:border-white/80 text-[#24283A]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        isActive
                          ? "bg-[#5052C9] text-white"
                          : "bg-[#5052C9]/15 text-[#5052C9]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-[#D0D7E3]/60">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full h-11 rounded-xl bg-[#5052C9] text-white font-bold text-sm flex items-center justify-center shadow-sm"
            >
              Sign In to Mission Control
            </Link>
          </div>
        </div>
      )}

      {/* Primary Hero Section — Full First Viewport Composition */}
      <section className="relative w-full min-h-[calc(100vh-5rem)] min-h-[calc(100dvh-5rem)] flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20 text-center">
        <div className="max-w-5xl mx-auto w-full flex flex-col items-center my-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A] leading-[1.08] max-w-4xl mx-auto">
            Stop chasing tickets. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#5052C9] via-[#7779D8] to-[#24283A] bg-clip-text text-transparent">
              Uncover the incident.
            </span>
          </h1>

          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-[#464B5E] max-w-2xl mx-auto leading-relaxed font-medium">
            Traditional support investigates customer symptoms in isolation. ResolveX correlates disparate complaints across payment logs, warehouse events, and system telemetry to identify systemic root causes and protect silent victims before they complain.
          </p>

          <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <a
              href="#customer-intake"
              onClick={(e) => handleScrollTo(e, "customer-intake")}
              className="unify-btn-primary text-sm shadow-[0_4px_14px_rgba(80,82,201,0.28)] cursor-pointer w-full sm:w-auto"
            >
              <span>Explore Customer Intake</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            
          </div>

          <div className="mt-7 sm:mt-9 text-xs text-[#464B5E] flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium">
            <span className="flex items-center gap-1.5 text-[#24283A]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Deterministic Baseline (seed=42)
            </span>
            <span className="hidden sm:inline text-[#D0D7E3]">•</span>
            <span className="flex items-center gap-1.5 text-[#24283A]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Policy-Gated Safe Remediation
            </span>
            <span className="hidden sm:inline text-[#D0D7E3]">•</span>
            <span className="flex items-center gap-1.5 text-[#24283A]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> 93/93 Tests Verified
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 1: Customer Intake (#customer-intake) */}
      <section id="customer-intake" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-[#D0D7E3]/60">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5E4EE] text-[#5052C9] text-xs font-semibold mb-2">
            <Inbox className="w-3.5 h-3.5" /> Customer Intake Experience
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Autonomous Ingestion &amp; Instant Signal Extraction
          </h2>
          <p className="text-sm text-[#464B5E] mt-2 font-medium">
            Customers describe problems in natural language. ResolveX extracts entities, parses payment identifiers, and checks for active operational incidents before dispatching the case.
          </p>
        </div>

        <div className="unify-card p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Interactive Simulated Intake Form */}
            <div className="lg:col-span-7 bg-white/60 backdrop-blur-md p-5 sm:p-6 rounded-[16px] border border-white/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D0D7E3]/60">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-[#24283A] font-mono">Customer Self-Service Intake</span>
                </div>
                <span className="text-[11px] font-mono text-[#5052C9] bg-[#E5E4EE] px-2 py-0.5 rounded-md font-semibold">
                  Live Intake Form
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#464B5E] mb-1 uppercase tracking-wider font-mono">
                    Customer Account
                  </label>
                  <div className="p-2.5 rounded-lg bg-white/70 backdrop-blur-xs border border-white/90 font-mono text-[#24283A] flex items-center justify-between shadow-2xs">
                    <span>Marcus Vance &lt;marcus.v@acme-corp.com&gt;</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">Verified</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#464B5E] mb-1 uppercase tracking-wider font-mono">
                    Order Reference &amp; Transaction
                  </label>
                  <div className="p-2.5 rounded-lg bg-white/70 backdrop-blur-xs border border-white/90 font-mono text-[#24283A] flex items-center justify-between shadow-2xs">
                    <span>ORD-94821 (ch_stripe_98234)</span>
                    <span className="text-[10px] text-[#5052C9] font-bold">$189.00 USD</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#464B5E] mb-1 uppercase tracking-wider font-mono">
                    Issue Description
                  </label>
                  <div className="p-3 rounded-lg bg-white/70 backdrop-blur-xs border border-white/90 text-[#373B4D] italic leading-relaxed shadow-2xs">
                    &ldquo;My credit card was debited $189.00 for order ORD-94821, but my customer portal still states Unfulfilled and order creation failed. Please check what happened!&rdquo;
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Instant Ingestion Output & CTA */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-[16px] bg-[#E5E4EE]/90 backdrop-blur-md border border-[#BFC1E4]/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#5052C9]">
                    AI Signal Classification
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5052C9] text-white font-mono">
                    0.98 Confidence
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-[#BFC1E4]/50">
                    <span className="text-[#464B5E]">Extracted Intent:</span>
                    <span className="font-bold text-[#24283A]">PAYMENT_CHARGED_ORDER_MISSING</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#BFC1E4]/50">
                    <span className="text-[#464B5E]">Customer Sentiment:</span>
                    <span className="font-bold text-rose-700">Frustrated (0.84)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#BFC1E4]/50">
                    <span className="text-[#464B5E]">Incident Match:</span>
                    <span className="font-bold text-[#5052C9]">INC-2026-041 (Gateway 504)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#464B5E]">Auto Policy Action:</span>
                    <span className="font-bold text-emerald-800">HOLD_FULFILLMENT_RECONCILE</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/support"
                  className="unify-btn-primary w-full flex items-center justify-center gap-2 text-sm shadow-[0_4px_14px_rgba(80,82,201,0.25)]"
                >
                  <span>Open Live Customer Intake Portal</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <p className="text-[11px] text-center text-[#464B5E] mt-2">
                  Interactive evaluation demo with simulated synthetic customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Features (#features) */}
      <section id="features" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-[#D0D7E3]/60">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5E4EE] text-[#5052C9] text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5" /> Core Innovations
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Built for Incident Operations, Not Generic CRM Tickets
          </h2>
          <p className="text-sm text-[#464B5E] mt-2 font-medium">
            Most customer support tools make human agents investigate symptoms one by one. ResolveX correlates the underlying cause and acts autonomously.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="unify-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#E5E4EE] text-[#5052C9] flex items-center justify-center border border-[#BFC1E4]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-[#24283A]">Ticket-to-Incident Intelligence</h3>
            <p className="text-xs text-[#464B5E] leading-relaxed font-medium">
              Multi-signal correlation matrix synthesizes semantic embeddings, timestamps, shared entities, and microservice error codes to cluster dozens of symptoms into a single operational incident.
            </p>
          </div>

          <div className="unify-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-[12px] bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-[#24283A]">Predictive Blast Radius</h3>
            <p className="text-xs text-[#464B5E] leading-relaxed font-medium">
              Scans payment ledgers and warehouse queues during failure windows to discover affected customers who have not yet submitted a ticket, enabling proactive pre-ticket outreach.
            </p>
          </div>

          <div className="unify-card p-6 space-y-3">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-heading font-bold text-[#24283A]">Policy-Gated Safe Actions</h3>
            <p className="text-xs text-[#464B5E] leading-relaxed font-medium">
              Strict deterministic policy gates enforce financial ceilings ($50 limit) and RBAC authorization. Low-risk cases resolve autonomously; consequential actions escalate with complete evidence.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: Incident Narrative (#incident-narrative) */}
      <section id="incident-narrative" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-[#D0D7E3]/60">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Flagship Scenario INC-2026-041
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            The End-to-End Incident Intelligence Narrative
          </h2>
          <p className="text-sm text-[#464B5E] mt-2 font-medium">
            Trace how a single customer symptom unfolds into the automated discovery of an infrastructure incident and proactive remediation for 42 silent victims.
          </p>
        </div>

        <div className="unify-card overflow-hidden">
          {/* Header Bar */}
          <div className="bg-white/60 backdrop-blur-md text-[#464B5E] px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/80 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="ml-1 font-mono text-[11px] font-semibold text-[#24283A] truncate">
                ResolveX Mission Control — Flagship Scenario INC-2026-041
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] shrink-0">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                AI REASONING ACTIVE
              </span>
              <span className="text-[#464B5E] hidden sm:inline">Acme Commerce Tenant</span>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 bg-transparent">
            {/* Column 1: Customer Ticket Symptom */}
            <div className="p-4 sm:p-5 rounded-[16px] bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] font-mono">1. Customer Symptom</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">Urgent</span>
              </div>
              <div>
                <h3 className="text-sm font-heading font-bold text-[#24283A]">Marcus Vance (TCK-1001)</h3>
                <p className="text-xs text-[#464B5E] mt-1 italic">&ldquo;Payment was deducted via credit card, but order still shows pending in portal.&rdquo;</p>
              </div>
              <div className="p-3 rounded-[11px] bg-white/70 border border-white/90 text-[11px] font-mono text-[#24283A] space-y-1 shadow-2xs">
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
                <h3 className="text-sm font-heading font-bold text-[#24283A]">Incident INC-2026-041</h3>
                <p className="text-xs text-[#464B5E] mt-1 font-medium">Stripe Webhook Gateway Timeout (AWS us-east-1 HTTP 504)</p>
              </div>
              <div className="p-3 rounded-[11px] bg-white/70 border border-[#BFC1E4]/70 text-[11px] text-[#24283A] space-y-1.5 font-mono shadow-2xs">
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
            <div className="p-5 rounded-[16px] bg-white/60 backdrop-blur-md border border-white/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] font-mono">3. Blast Radius &amp; Action</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">42 Silent Victims</span>
              </div>
              <div>
                <h3 className="text-sm font-heading font-bold text-[#24283A]">Predictive Pre-Ticket Outreach</h3>
                <p className="text-xs text-[#464B5E] mt-1 font-medium">Discovered 42 uncontacted customers charged during failure window.</p>
              </div>
              <div className="p-3 rounded-[11px] bg-white/70 border border-white/90 text-[11px] space-y-1 shadow-2xs">
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

      {/* SECTION 4: Incident Canvas (#incident-canvas) */}
      <section id="incident-canvas" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-[#D0D7E3]/60">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5E4EE] text-[#5052C9] text-xs font-semibold mb-2">
            <Network className="w-3.5 h-3.5" /> Incident Canvas &amp; Topology
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Mission Control: Topology-Aware Incident Investigation
          </h2>
          <p className="text-sm text-[#464B5E] mt-2 font-medium">
            Investigate cross-service dependencies, correlated ticket clusters, and blast radius projections on a unified visual graph.
          </p>
        </div>

        <div className="unify-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D0D7E3]/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold font-mono">
                  INC-2026-041
                </span>
                <h3 className="text-base font-bold text-[#24283A]">Stripe Gateway Webhook Delivery Failure</h3>
              </div>
              <p className="text-xs text-[#464B5E] mt-1 font-mono">
                Cluster: AWS us-east-1 • Correlated Tickets: 14 • Total Blast Radius: 42 customers
              </p>
            </div>

          </div>

          {/* Visual Topology Diagram Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#5052C9]">Root Service Node</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <p className="text-xs font-mono font-bold text-[#24283A]">webhook-ingress-gw</p>
              <p className="text-[11px] text-[#464B5E]">
                Latency spike: 14,200ms with HTTP 504 Gateway Timeouts on POST /webhooks/stripe.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-amber-800">Symptom Cluster</span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <p className="text-xs font-mono font-bold text-[#24283A]">14 Customer Tickets</p>
              <p className="text-[11px] text-[#464B5E]">
                High semantic similarity (0.91 cosine): &ldquo;Money deducted but order unfulfilled&rdquo;.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-800">Blast Radius Node</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs font-mono font-bold text-[#24283A]">42 Silent Victims</p>
              <p className="text-[11px] text-[#464B5E]">
                $2,450.00 GMV reconciled automatically via policy-gated safe actions before escalation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: CX Analytics (#cx-analytics) */}
      <section id="cx-analytics" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-[#D0D7E3]/60">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5E4EE] text-[#5052C9] text-xs font-semibold mb-2">
            <BarChart3 className="w-3.5 h-3.5" /> Incident &amp; CX Intelligence Analytics
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Measurable Operational &amp; Customer Retention ROI
          </h2>
          <p className="text-sm text-[#464B5E] mt-2 font-medium">
            Monitor real-time incident trends, reduction in customer churn, and policy-gated automated resolution rates.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="unify-card p-5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B5E]">
              Mean Time to Detect (MTTD)
            </span>
            <div className="text-3xl font-heading font-extrabold text-[#24283A] mt-2">1.4 min</div>
            <div className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1">
              <span>↓ 97% vs manual triage</span>
            </div>
          </div>

          <div className="unify-card p-5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B5E]">
              Pre-Ticket Interceptions
            </span>
            <div className="text-3xl font-heading font-extrabold text-[#5052C9] mt-2">42</div>
            <div className="text-xs text-[#464B5E] font-medium mt-1">Silent victims reached first</div>
          </div>

          <div className="unify-card p-5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B5E]">
              Safe Autonomy Rate
            </span>
            <div className="text-3xl font-heading font-extrabold text-emerald-700 mt-2">78.4%</div>
            <div className="text-xs text-[#464B5E] font-medium mt-1">Passed policy safety ceilings</div>
          </div>

          <div className="unify-card p-5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#464B5E]">
              GMV Preserved
            </span>
            <div className="text-3xl font-heading font-extrabold text-[#24283A] mt-2">$28,450</div>
            <div className="text-xs text-[#464B5E] font-medium mt-1">Across 14 operational incidents</div>
          </div>
        </div>

        <div className="unify-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#24283A]">Deep CX &amp; Root Cause Analytics</h3>
            <p className="text-xs text-[#464B5E] mt-0.5">
              Inspect root-cause distributions across Stripe, Shopify, carriers, and warehouse management systems.
            </p>
          </div>

        </div>
      </section>
      {/* Pre-Footer Call to Action */}
      <section className="bg-white/50 backdrop-blur-md text-[#24283A] py-16 px-4 sm:px-6 border-t border-white/80">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Experience the 90-Second Autonomous Support Flow
          </h2>
          <p className="text-xs sm:text-sm text-[#464B5E] max-w-xl mx-auto leading-relaxed font-medium">
            Acme Commerce synthetic enterprise simulation with 520 customers, 315 tickets, and full multi-agent orchestration is ready for evaluation.
          </p>

        </div>
      </section>

      {/* Dark Midnight / Navy Slate Enterprise Footer (#151827) */}
      <footer className="bg-[#151827] text-white pt-16 pb-12 px-4 sm:px-8 lg:px-12 border-t border-[#23283E]">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12">
            {/* Left Column: Brand, Description, All Systems Operational Status */}
            <div className="lg:col-span-4 space-y-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold shadow-[0_2px_10px_rgba(80,82,201,0.35)] group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-heading font-extrabold tracking-[-0.02em] text-white">
                  Resolve<span className="text-[#7779D8]">X</span>
                </span>
              </Link>

              <p className="text-xs text-[#8E95B8] max-w-sm leading-relaxed font-normal">
                Autonomous Customer Incident Intelligence platform. Correlates disparate customer complaints across payment ledgers, warehouse logs, and telemetry to uncover root causes and protect silent victims.
              </p>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C2033] border border-[#2D3352] text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>

            {/* Right Columns: Navigation & Trust */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:pl-10">
              {/* Col 1: Product Features */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7E85A6]">
                  Product Features
                </h4>
                <ul className="space-y-2.5 text-xs text-[#A5ADC8]">
                  <li>
                    <a
                      href="#customer-intake"
                      onClick={(e) => handleScrollTo(e, "customer-intake")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Customer Intake
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      onClick={(e) => handleScrollTo(e, "features")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Signal Correlation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#incident-narrative"
                      onClick={(e) => handleScrollTo(e, "incident-narrative")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Incident Narrative
                    </a>
                  </li>
                  <li>
                    <a
                      href="#incident-canvas"
                      onClick={(e) => handleScrollTo(e, "incident-canvas")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Topology Canvas
                    </a>
                  </li>
                  <li>
                    <a
                      href="#cx-analytics"
                      onClick={(e) => handleScrollTo(e, "cx-analytics")}
                      className="hover:text-white transition-colors cursor-pointer"
                    >
                      Predictive Blast Radius
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 2: Workspace & Access */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7E85A6]">
                  Workspace &amp; Access
                </h4>
                <ul className="space-y-2.5 text-xs text-[#A5ADC8]">
                  <li>
                    <Link href="/incidents" className="hover:text-white transition-colors">
                      Incident Command
                    </Link>
                  </li>
                  <li>
                    <Link href="/cases" className="hover:text-white transition-colors">
                      Customer Queue
                    </Link>
                  </li>
                  <li>
                    <Link href="/analytics" className="hover:text-white transition-colors">
                      CX Analytics
                    </Link>
                  </li>
                  <li>
                    <Link href="/support" className="hover:text-white transition-colors">
                      Intake Portal
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-white transition-colors">
                      Mission Control Login
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Col 3: Trust & Privacy */}
              <div className="space-y-3 col-span-2 sm:col-span-1">
                <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7E85A6]">
                  Trust &amp; Privacy
                </h4>
                <ul className="space-y-2.5 text-xs text-[#A5ADC8]">
                  <li className="hover:text-white transition-colors cursor-default">
                    Deterministic Baseline
                  </li>
                  <li className="hover:text-white transition-colors cursor-default">
                    Policy-Gated Safety
                  </li>
                  <li className="hover:text-white transition-colors cursor-default">
                    Strict RBAC &amp; Audit Logs
                  </li>
                  <li className="hover:text-white transition-colors cursor-default">
                    Zero Hallucination Gate
                  </li>
                  <li className="hover:text-white transition-colors cursor-default">
                    Acme Synthetic Tenant
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sub-footer bottom bar */}
          <div className="pt-8 border-t border-[#22273D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B7294]">
            <div className="flex items-center gap-2">
              <span>© 2024–{new Date().getFullYear()} ResolveX Platform. All rights reserved.</span>
              <span className="text-[#3C425F]">•</span>
              <span className="font-mono text-[#7E85A6]">v1.2.0-stable</span>
            </div>
            <div className="flex items-center gap-6 text-[#8E95B8]">
              <Link href="/support" className="hover:text-white transition-colors">Support</Link>
              <Link href="/login" className="hover:text-white transition-colors">Security</Link>
              <Link href="/settings" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/settings" className="hover:text-white transition-colors">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
