"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  User,
  Users,
  Activity,
  Headphones,
  CheckCircle2
} from "lucide-react";
import { useAuth, RoleType, PRESET_PERSONAS } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { loginAsPersona } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("admin@acmecommerce.com");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#EDEBE5] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative selection:bg-[#5052C9] selection:text-white font-sans text-[#24283A]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold text-lg shadow-[0_2px_8px_rgba(80,82,201,0.25)]">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
              Resolve<span className="text-[#5052C9]">X</span>
            </span>
          </div>
          <h2 className="mt-3 text-xl font-heading font-bold text-[#24283A]">
            Employee Mission Control Login
          </h2>
          <p className="mt-1 text-xs text-[#464B5E]">
            Autonomous Customer Incident Intelligence Platform
          </p>
        </div>
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
          <div className="unify-card p-6 sm:p-8 flex items-center justify-center min-h-[380px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-[#5052C9] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-[#464B5E] font-medium font-mono">Loading Mission Control...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEBE5] flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative selection:bg-[#5052C9] selection:text-white font-sans text-[#24283A]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold text-lg shadow-[0_2px_8px_rgba(80,82,201,0.25)] group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Resolve<span className="text-[#5052C9]">X</span>
          </span>
        </Link>
        <h2 className="mt-3 text-xl font-heading font-bold text-[#24283A]">
          Employee Mission Control Login
        </h2>
        <p className="mt-1 text-xs text-[#464B5E]">
          Autonomous Customer Incident Intelligence Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="unify-card p-6 sm:p-8 space-y-6">
          {/* Quick Demo Persona Access */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#464B5E] uppercase font-mono tracking-wider">
                1-Click Evaluator Personas (RBAC)
              </span>
              <span className="text-[10px] text-[#7779D8] font-semibold bg-[#E5E4EE] px-2 py-0.5 rounded">
                Acme Commerce Inc.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Support Agent */}
              <button
                type="button"
                onClick={() => handlePersonaSelect("support_agent", "/cases")}
                disabled={loading}
                className="p-3 text-left rounded-[11px] bg-[#FBFAF7] hover:bg-[#E5E4EE]/60 border-[1.5px] border-[#C6C5BE] hover:border-[#5052C9] transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    AR
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#24283A] group-hover:text-[#5052C9]">Alex Rivera</div>
                    <div className="text-[10px] text-[#464B5E]">Support Agent</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#464B5E] line-clamp-1">
                  Assigned cases, customer context, AI suggested replies.
                </p>
              </button>

              {/* Support Manager */}
              <button
                type="button"
                onClick={() => handlePersonaSelect("support_manager", "/overview")}
                disabled={loading}
                className="p-3 text-left rounded-[11px] bg-[#FBFAF7] hover:bg-[#E5E4EE]/60 border-[1.5px] border-[#C6C5BE] hover:border-[#5052C9] transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                    SJ
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#24283A] group-hover:text-[#5052C9]">Sarah Jenkins</div>
                    <div className="text-[10px] text-[#464B5E]">Support Manager</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#464B5E] line-clamp-1">
                  Team workload, resolution SLAs, CX sentiment metrics.
                </p>
              </button>

              {/* Lead Investigator */}
              <button
                type="button"
                onClick={() => handlePersonaSelect("lead_investigator", "/overview")}
                disabled={loading}
                className="p-3 text-left rounded-[11px] bg-[#FBFAF7] hover:bg-[#E5E4EE]/60 border-[1.5px] border-[#C6C5BE] hover:border-[#5052C9] transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-[#5052C9] text-white flex items-center justify-center text-[10px] font-bold">
                    MP
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#24283A] group-hover:text-[#5052C9]">Maya Patel</div>
                    <div className="text-[10px] text-[#464B5E]">Lead Investigator</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#464B5E] line-clamp-1">
                  Incident Command Center, correlation, root causes.
                </p>
              </button>

              {/* Organization Admin */}
              <button
                type="button"
                onClick={() => handlePersonaSelect("admin", "/settings")}
                disabled={loading}
                className="p-3 text-left rounded-[11px] bg-[#FBFAF7] hover:bg-[#E5E4EE]/60 border-[1.5px] border-[#C6C5BE] hover:border-[#5052C9] transition-all group shadow-2xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    DW
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#24283A] group-hover:text-[#5052C9]">Devin Wright</div>
                    <div className="text-[10px] text-[#464B5E]">Organization Admin</div>
                  </div>
                </div>
                <p className="text-[10px] text-[#464B5E] line-clamp-1">
                  Tenant settings, integrations, AI autonomy safety gates.
                </p>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t-[1.5px] border-[#D8D6CE]"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#464B5E] uppercase font-bold tracking-wider font-mono">Or manual enterprise sign-in</span>
            <div className="flex-grow border-t-[1.5px] border-[#D8D6CE]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#24283A] mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5052C9]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="unify-input w-full pl-10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24283A] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5052C9]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="unify-input w-full pl-10 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[#464B5E] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-[#BDBCB5] text-[#5052C9] focus:ring-[#5052C9]" />
                <span>Remember session</span>
              </label>
              <a href="#" className="text-[#5052C9] font-semibold hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="unify-btn-primary w-full text-xs font-bold h-10"
            >
              {loading ? "Authenticating Persona..." : "Sign In to Operations Console"}
            </button>
          </form>

          {/* Customer Support Callout */}
          <div className="p-3 rounded-xl bg-[#EDEBE5] border border-[#C6C5BE] flex items-center justify-between text-xs text-[#464B5E]">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-[#5052C9]" />
              <span>Looking for public customer support?</span>
            </div>
            <Link href="/support" className="text-[#5052C9] font-bold hover:underline flex items-center gap-1">
              <span>Public Intake</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#464B5E]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Protected by Supabase Auth with PostgreSQL Row-Level Security</span>
        </div>
      </div>
    </div>
  );
}
