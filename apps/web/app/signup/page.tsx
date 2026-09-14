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
  Building,
  User,
  CheckCircle2,
  Cpu,
  Layers,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";

export default function SignUpPage() {
  const router = useRouter();
  const { loginAsPersona, updateUserProfile } = useAuth();
  const [name, setName] = useState("Operations Director");
  const [org, setOrg] = useState("Acme Global Commerce");
  const [email, setEmail] = useState("director@acmecommerce.com");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      updateUserProfile({
        fullName: name,
        orgName: org,
        email: email,
        role: "admin",
        roleTitle: "Organization Admin",
        initials: name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "AD",
      });
      loginAsPersona("admin");
    } catch {
      // Fallback
    }

    setTimeout(() => {
      router.push("/overview");
    }, 600);
  };

  const handleDemoSignIn = () => {
    setLoading(true);
    loginAsPersona("admin");
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
            LEFT PANEL: Storytelling, Workspace Provisioning & Architecture (Dark Midnight)
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
                <span>Workspace Onboarding</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] leading-[1.18] text-white">
                Deploy Autonomous <br />
                <span className="bg-gradient-to-r from-[#818CF8] to-[#C4B5FD] bg-clip-text text-transparent">
                  Incident Intelligence.
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-[#A5ADC8] leading-relaxed font-normal max-w-sm">
                Instantly provision an isolated tenant workspace equipped with autonomous multi-agent root cause analysis, cross-system signal correlation, and policy-gated mitigation.
              </p>

              {/* Mobile/Tablet Compact Highlights Row */}
              <div className="lg:hidden flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[11px] text-[#C4C9E5] font-medium">
                <span className="inline-flex items-center gap-1 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Multi-Tenant RLS
                </span>
                <span className="text-[#6B7294]">•</span>
                <span className="inline-flex items-center gap-1 text-white">
                  <Layers className="w-3.5 h-3.5 text-[#818CF8]" /> seed=42 Sandbox
                </span>
                <span className="text-[#6B7294]">•</span>
                <span className="inline-flex items-center gap-1 text-white">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" /> Multi-Agent Engine
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Expanded Highlights & Enterprise Architecture */}
          <div className="hidden lg:block relative z-10 mt-8 pt-6 border-t border-white/10 space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-snug">Multi-Tenant Isolation</div>
                <div className="text-[11px] text-[#8E95B8] leading-tight mt-0.5">
                  Strict cryptographic and row-level separation across all organizations
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[#818CF8]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-snug">Pre-Seeded Synthetic Operations</div>
                <div className="text-[11px] text-[#8E95B8] leading-tight mt-0.5">
                  Instant demo sandbox with seed=42 e-commerce telemetry, carriers &amp; logs
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-snug">Autonomous Agent Orchestration</div>
                <div className="text-[11px] text-[#8E95B8] leading-tight mt-0.5">
                  Gemini 2.5 Flash agents with LangGraph state machines &amp; policy guardrails
                </div>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-[#6B7294] font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Multi-tenant isolation protected by Supabase Row-Level Security</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: Registration Form & 1-Click Fast-Track Sandbox (Light Surface)
            ========================================================================= */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
          
          {/* Header */}
          <div>
            <h2 className="text-2xl sm:text-[26px] font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
              Create Workspace Account
            </h2>
            <p className="text-xs sm:text-sm text-[#464B5E] mt-1 font-normal">
              Set up your tenant environment or fast-track with the pre-seeded demo sandbox.
            </p>
          </div>

          {/* 1-Click Fast-Track Demo Workspace Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full p-3 rounded-[14px] bg-[#EEF0FA] hover:bg-[#E5E4EE] border border-[#BFC1E4] text-left transition-all group shadow-2xs cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#5052C9] group-hover:text-[#4344AC] flex items-center gap-1.5">
                      <span>1-Click Deploy Demo Workspace</span>
                      <span className="px-1.5 py-0.2 rounded bg-white text-[10px] font-mono font-semibold border border-[#BFC1E4]">
                        seed=42
                      </span>
                    </div>
                    <div className="text-[11px] text-[#464B5E] leading-tight mt-0.5">
                      Instant access to Acme Commerce with 4 active simulated cases &amp; telemetry
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#5052C9] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </div>
            </button>
          </div>

          {/* Form Divider */}
          <div className="relative flex items-center">
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#7E85A6] uppercase font-bold tracking-wider font-mono">
              Or register custom workspace
            </span>
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
          </div>

          {/* Manual Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#464B5E] mb-1 uppercase tracking-wider font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operations Director"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="unify-input w-full pl-10 text-xs h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#464B5E] mb-1 uppercase tracking-wider font-mono">
                  Organization Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Global Commerce"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    className="unify-input w-full pl-10 text-xs h-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#464B5E] mb-1 uppercase tracking-wider font-mono">
                Institutional Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                <input
                  type="email"
                  required
                  placeholder="e.g. director@acmecommerce.com"
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

            <div className="pt-1">
              <label className="flex items-start gap-2 text-xs text-[#464B5E] cursor-pointer select-none leading-tight">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-[#BDBCB5] text-[#5052C9] focus:ring-[#5052C9]"
                />
                <span>
                  I agree to the Enterprise Master Services Agreement and AI Safety Guardrails policy.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="unify-btn-primary w-full h-11 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_2px_10px_rgba(80,82,201,0.25)] hover:shadow-[0_4px_14px_rgba(80,82,201,0.35)] cursor-pointer mt-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Provisioning Tenant Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Workspace &amp; Deploy Operations</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Ancillary Links */}
          <div className="pt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#464B5E]">
            <Link href="/login" className="hover:text-[#5052C9] transition-colors">
              Already have a workspace? <span className="font-semibold text-[#5052C9] underline">Sign In</span>
            </Link>

            <Link href="/" className="inline-flex items-center gap-1 text-[#464B5E] hover:text-[#24283A] font-medium transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home Page</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
