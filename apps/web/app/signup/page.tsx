"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Sparkles, Lock, Mail, Building, User } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("Operations Director");
  const [org, setOrg] = useState("Acme Global Commerce");
  const [email, setEmail] = useState("director@acmecommerce.com");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/overview");
    }, 600);
  };

  const handleDemoSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      router.push("/overview");
    }, 400);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#EDEBE5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#5052C9] selection:text-white font-sans text-[#24283A]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold text-lg shadow-[0_2px_8px_rgba(80,82,201,0.25)]">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
              Resolve<span className="text-[#5052C9]">X</span>
            </span>
          </div>
          <h2 className="mt-4 text-xl font-heading font-bold text-[#24283A]">
            Create an Incident Intelligence Workspace
          </h2>
          <p className="mt-1 text-xs text-[#464B5E]">
            Deploy multi-agent customer support operations in seconds
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="unify-card p-6 sm:p-9 flex items-center justify-center min-h-[380px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-[#5052C9] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-[#464B5E] font-medium font-mono">Loading Workspace...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEBE5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-[#5052C9] selection:text-white font-sans text-[#24283A]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold text-lg shadow-[0_2px_8px_rgba(80,82,201,0.25)] group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Resolve<span className="text-[#5052C9]">X</span>
          </span>
        </Link>
        <h2 className="mt-4 text-xl font-heading font-bold text-[#24283A]">
          Create an Incident Intelligence Workspace
        </h2>
        <p className="mt-1 text-xs text-[#464B5E]">
          Deploy multi-agent customer support operations in seconds
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="unify-card p-6 sm:p-9 space-y-6">
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full h-11 px-4 rounded-[11px] bg-[#E5E4EE] hover:bg-[#dedde8] border-[1.5px] border-[#BFC1E4] text-[#5052C9] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-[#7779D8]" />
        
            <ArrowRight className="w-3.5 h-3.5 ml-auto" />
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t-[1.5px] border-[#D8D6CE]"></div>
            <span className="flex-shrink mx-3 text-[10px] text-[#464B5E] uppercase font-bold tracking-wider font-mono">Or register new workspace</span>
            <div className="flex-grow border-t-[1.5px] border-[#D8D6CE]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#24283A] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5052C9]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="unify-input w-full pl-10 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24283A] mb-1">Company / Organization Name</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5052C9]" />
                <input
                  type="text"
                  required
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className="unify-input w-full pl-10 text-xs"
                />
              </div>
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="unify-btn-primary w-full text-xs"
            >
              {loading ? "Provisioning Workspace..." : "Create Tenant Workspace"}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#464B5E]">
            Already have a tenant?{" "}
            <Link href="/login" className="text-[#5052C9] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-[#464B5E]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Multi-tenant isolation protected by Supabase Row-Level Security</span>
        </div>
      </div>
    </div>
  );
}
