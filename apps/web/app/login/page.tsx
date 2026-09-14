"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
  Mail,
  User,
  Users,
  Activity,
  Headphones,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth, RoleType, PRESET_PERSONAS } from "@/lib/auth-context";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsPersona } = useAuth();
  const [email, setEmail] = useState("admin@acmecommerce.com");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePersonaSelect = (role: RoleType, targetPath: string = "/overview") => {
    loginAsPersona(role);
    setLoading(true);
    setTimeout(() => {
      router.push(targetPath);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Find matching persona or default to admin
    const found = PRESET_PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase()) || PRESET_PERSONAS[3];
    loginAsPersona(found.role);
    setTimeout(() => {
      router.push("/overview");
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-10 relative selection:bg-[#5052C9] selection:text-white font-sans text-[#24283A]">
      {/* Global Atmospheric Light Canvas */}
      <AtmosphericBackground variant="auth" />

      {/* Main Split-Screen Authentication Container */}
      <div className="w-full max-w-[1060px] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-white border border-[#D0D7E3]/80 shadow-[0_20px_60px_rgba(21,24,39,0.08)] grid grid-cols-1 lg:grid-cols-12 relative z-10 my-auto">
        
        {/* =========================================================================
            LEFT PANEL: Storytelling, Product Authority & Security Highlights (Dark Midnight)
            ========================================================================= */}
        <div className="lg:col-span-5 bg-[#151827] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Light Glows inside Dark Canvas */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#5052C9]/25 blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#7779D8]/20 blur-[90px] pointer-events-none" />

          {/* Top Brand & Narrative Header */}
          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold shadow-[0_2px_10px_rgba(80,82,201,0.35)] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-heading font-extrabold tracking-[-0.02em] text-white">
                  Resolve<span className="text-[#7779D8]">X</span>
                </span>
                <span className="block text-[9px] text-[#8E95B8] font-mono font-medium tracking-wider uppercase">
                  Incident Intelligence
                </span>
              </div>
            </Link>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#C4C9E5] border border-white/15 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Mission Control Access</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] leading-[1.18] text-white">
                Stop chasing tickets. <br />
                <span className="bg-gradient-to-r from-[#818CF8] to-[#C4B5FD] bg-clip-text text-transparent">
                  Uncover the incident.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-[#A5ADC8] leading-relaxed font-normal max-w-sm">
                Correlate customer complaints across payment ledgers, warehouse logs, and telemetry into systemic root causes and protect silent victims.
              </p>

              {/* Mobile/Tablet Compact Highlights Row */}
              <div className="lg:hidden flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[11px] text-[#C4C9E5] font-medium">
                <span className="inline-flex items-center gap-1 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> seed=42
                </span>
                <span className="text-[#6B7294]">•</span>
                <span className="inline-flex items-center gap-1 text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#818CF8]" /> Policy-Gated ($50)
                </span>
                <span className="text-[#6B7294]">•</span>
                <span className="inline-flex items-center gap-1 text-white">
                  <Activity className="w-3.5 h-3.5 text-amber-400" /> &lt;2m Detection
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Expanded Highlights & Security Guarantees */}
          <div className="hidden lg:block relative z-10 mt-8 pt-6 border-t border-white/10 space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-snug">Deterministic Baseline</div>
                <div className="text-[11px] text-[#8E95B8] leading-tight mt-0.5">
                  seed=42 synthetic tenant for airtight evaluation
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#818CF8]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-snug">Policy-Gated Safety</div>
                <div className="text-[11px] text-[#8E95B8] leading-tight mt-0.5">
                  Financial ceilings ($50 limit) &amp; strict RBAC authorization
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-snug">Signal Correlation Matrix</div>
                <div className="text-[11px] text-[#8E95B8] leading-tight mt-0.5">
                  Discovers underlying root causes in under 2 minutes
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-[#6B7294] font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Protected by Supabase Auth with PostgreSQL RLS</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: Authentication Form & Quick Persona Selector (Light Surface)
            ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
          
          {/* Header */}
          <div>
            <h2 className="text-2xl sm:text-[26px] font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
              Sign In to Mission Control
            </h2>
            <p className="text-xs sm:text-sm text-[#464B5E] mt-1 font-normal">
              Enter your enterprise credentials or choose an evaluator persona below.
            </p>
          </div>

          {/* 1-Click Evaluator Personas (RBAC Demo Accelerator) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#464B5E] uppercase font-mono tracking-wider">
                1-Click Evaluator Personas (RBAC)
              </span>
              <span className="text-[10px] text-[#5052C9] font-semibold bg-[#E5E4EE] px-2 py-0.5 rounded font-mono">
                Acme Commerce Inc.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Persona 1: Support Agent */}
              <button
                type="button"
                onClick={() => handlePersonaSelect("support_agent", "/cases")}
                disabled={loading}
                className="p-2.5 sm:p-3 text-left rounded-[12px] bg-[#F8FAFC] hover:bg-[#EEF0FA] border border-[#E2E8F0] hover:border-[#BFC1E4] transition-all group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    AR
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#24283A] group-hover:text-[#5052C9] truncate">
                      Alex Rivera
                    </div>
                    <div className="text-[10px] text-[#464B5E] leading-tight">Support Agent</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#464B5E] line-clamp-1">
                  Case queue triage, customer context, AI suggested replies.
                </p>
              </button>

              {/* Persona 2: Support Manager */}
              <button
                type="button"
                onClick={() => handlePersonaSelect("support_manager", "/overview")}
                disabled={loading}
                className="p-2.5 sm:p-3 text-left rounded-[12px] bg-[#F8FAFC] hover:bg-[#EEF0FA] border border-[#E2E8F0] hover:border-[#BFC1E4] transition-all group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    SJ
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#24283A] group-hover:text-[#5052C9] truncate">
                      Sarah Jenkins
                    </div>
                    <div className="text-[10px] text-[#464B5E] leading-tight">Support Manager</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#464B5E] line-clamp-1">
                  Team workload, resolution SLAs, CX sentiment metrics.
                </p>
              </button>

              {/* Persona 3: Lead Investigator */}
              <button
                type="button"
                onClick={() => handlePersonaSelect("lead_investigator", "/overview")}
                disabled={loading}
                className="p-2.5 sm:p-3 text-left rounded-[12px] bg-[#F8FAFC] hover:bg-[#EEF0FA] border border-[#E2E8F0] hover:border-[#BFC1E4] transition-all group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-[#5052C9] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    MP
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#24283A] group-hover:text-[#5052C9] truncate">
                      Maya Patel
                    </div>
                    <div className="text-[10px] text-[#464B5E] leading-tight">Lead Investigator</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#464B5E] line-clamp-1">
                  Incident Command Center, correlation, root causes.
                </p>
              </button>

              {/* Persona 4: Organization Admin */}
              <button
                type="button"
                onClick={() => handlePersonaSelect("admin", "/settings")}
                disabled={loading}
                className="p-2.5 sm:p-3 text-left rounded-[12px] bg-[#F8FAFC] hover:bg-[#EEF0FA] border border-[#E2E8F0] hover:border-[#BFC1E4] transition-all group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    DW
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#24283A] group-hover:text-[#5052C9] truncate">
                      Devin Wright
                    </div>
                    <div className="text-[10px] text-[#464B5E] leading-tight">Org Admin</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#464B5E] line-clamp-1">
                  Tenant settings, integrations, AI autonomy safety gates.
                </p>
              </button>
            </div>
          </div>

          {/* Form Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#7E85A6] uppercase font-bold tracking-wider font-mono">
              Or enter work credentials
            </span>
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
          </div>

          {/* Manual Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#464B5E] mb-1 uppercase tracking-wider font-mono">
                Institutional Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@acmecommerce.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="unify-input w-full pl-10 text-xs h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#464B5E] mb-1 uppercase tracking-wider font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="unify-input w-full pl-10 pr-10 text-xs h-10 font-mono"
                />
                {/* Password Visibility Control */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E85A6] hover:text-[#24283A] transition-colors p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[#464B5E] cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-[#BDBCB5] text-[#5052C9] focus:ring-[#5052C9]"
                />
                <span>Remember session</span>
              </label>
              <a href="#" className="text-[#5052C9] font-semibold hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="unify-btn-primary w-full h-11 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(80,82,201,0.25)] hover:shadow-[0_4px_14px_rgba(80,82,201,0.35)] cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Persona...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Operations Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Ancillary Links & Public Support Callout */}
          <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
            {/* Customer Support Callout */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs text-[#464B5E]">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#5052C9] shrink-0" />
                <span>Customer seeking support?</span>
              </div>
              <Link href="/support" className="text-[#5052C9] font-bold hover:underline flex items-center gap-1 shrink-0">
                <span>Public Intake</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Registration & Back to Home */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#464B5E] pt-1">
              <Link href="/signup" className="hover:text-[#5052C9] transition-colors">
                Need a new tenant? <span className="font-semibold text-[#5052C9] underline">Create Workspace</span>
              </Link>

              <Link href="/" className="inline-flex items-center gap-1 text-[#464B5E] hover:text-[#24283A] font-medium transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Home Page</span>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
