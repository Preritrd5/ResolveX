"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Mail,
  User,
  Package,
  Tag,
  AlertCircle,
  Clock,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Lock
} from "lucide-react";
import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { fetchApi } from "@/lib/api-client";

interface SupportResponseData {
  ticket_id: string;
  ticket_number: string;
  subject: string;
  status: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
  confirmation_code: string;
  message: string;
}

export default function PublicSupportPage() {
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [category, setCategory] = useState("Payment & Billing Issues");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<SupportResponseData | null>(null);
  const [copied, setCopied] = useState(false);

  // 1-Click Demo Scenario Auto-Fill
  const handlePreFillFlagshipScenario = () => {
    setFullName("Rahul Sharma");
    setEmail("rahul@example.com");
    setOrderId("ORD-10452");
    setCategory("Payment & Billing Issues");
    setSubject("Payment was successful but my order is missing");
    setMessage(
      "Hi support, my payment of $49.99 was captured on Stripe 25 minutes ago, but my orders page is completely empty and no confirmation email was received. Please help locate my order!"
    );
    setErrorMessage(null);
  };

  const handleCopyTicketId = () => {
    if (!submittedData) return;
    navigator.clipboard.writeText(submittedData.ticket_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetchApi<SupportResponseData>("/support/intake", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          order_id: orderId.trim() || undefined,
          subject: subject.trim() || undefined,
          message: message.trim(),
          category: category,
        }),
      });

      if (res.data) {
        setSubmittedData(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to submit your complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setFullName("");
    setEmail("");
    setOrderId("");
    setSubject("");
    setMessage("");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen text-[#24283A] selection:bg-[#5052C9] selection:text-white font-sans flex flex-col justify-between relative overflow-x-hidden">
      {/* Global Atmospheric Visual System — Portal Variant */}
      <AtmosphericBackground variant="portal" />

      {/* Public Header (72px Unify Baseline) */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-[20px] border-b border-[#D0D7E3]/70 px-6 sm:px-10 h-[72px] flex items-center transition-all shadow-[0_1px_3px_rgba(31,38,135,0.03)]">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold text-base shadow-[0_2px_8px_rgba(80,82,201,0.22)] group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
                  Acme<span className="text-[#5052C9]">Commerce</span>
                </span>
                <span className="block text-[10px] text-[#464B5E] font-medium tracking-wide uppercase">
                  Customer Support Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5E4EE] border border-[#BFC1E4] text-[11px] text-[#5052C9] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operations Active · Avg response 15m</span>
            </div>
            
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        {!submittedData ? (
          <div className="space-y-6">
            {/* Header Hero */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
                How can we help with your order?
              </h1>
              <p className="text-xs sm:text-sm text-[#464B5E] max-w-lg mx-auto">
                Experiencing a payment error, delayed refund, or missing order? Submit your complaint below. Our autonomous incident intelligence monitors and triages every issue in real time.
              </p>
            </div>

            {/* Demo Quick-Fill Helper Banner */}
            <div className="unify-card p-3.5 bg-gradient-to-r from-[#EEF0FA] to-[#F8F7F3] border-[1.5px] border-[#BFC1E4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#5052C9] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#24283A] flex flex-wrap items-center gap-1.5">
                    <span>Demo Flagship Scenario: Missing Order after Payment</span>
                    <span className="text-[10px] bg-[#5052C9] text-white font-mono px-1.5 py-0.5 rounded font-semibold">
                      Rahul Sharma
                    </span>
                  </div>
                  <p className="text-[11px] text-[#464B5E]">
                    Populate the form with the flagship payment webhook drop case (ORD-10452) for end-to-end evaluation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePreFillFlagshipScenario}
                className="w-full sm:w-auto justify-center shrink-0 unify-btn-secondary h-8 px-3 text-xs bg-white text-[#5052C9] border-[#BFC1E4] hover:bg-[#dedde8]"
              >
                <span>⚡ Fill Demo Case</span>
              </button>
            </div>

            {/* Intake Form Card */}
            <div className="unify-card p-6 sm:p-8 space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-[11px] bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#24283A] mb-1.5">
                      Your Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="unify-input w-full pl-10 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24283A] mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                      <input
                        type="email"
                        required
                        placeholder="rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="unify-input w-full pl-10 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#24283A] mb-1.5">
                      Order ID <span className="text-[10px] font-normal text-[#464B5E]">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Package className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                      <input
                        type="text"
                        placeholder="e.g. ORD-10452"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        className="unify-input w-full pl-10 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#24283A] mb-1.5">
                      Issue Category
                    </label>
                    <div className="relative">
                      <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7779D8]" />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="unify-input w-full pl-10 text-xs bg-white cursor-pointer"
                      >
                        <option value="Payment & Billing Issues">Payment & Billing Issues</option>
                        <option value="Missing Order / Fulfillment">Missing Order / Fulfillment</option>
                        <option value="Returns & Refund Delay">Returns & Refund Delay</option>
                        <option value="Account & Subscription">Account & Subscription</option>
                        <option value="General Inquiry">Other Customer Inquiry</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24283A] mb-1.5">
                    Subject <span className="text-[10px] font-normal text-[#464B5E]">(Optional brief title)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Payment was successful but my order is missing"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="unify-input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#24283A] mb-1.5">
                    Complaint / Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe what happened in detail (e.g. charge amount, payment method, missing confirmation, error messages)..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="unify-input w-full text-xs py-2.5 resize-y leading-relaxed"
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px] text-[#464B5E]">
                    <span>Minimum 10 characters required</span>
                    <span>{message.length} / 3000</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || message.trim().length < 10 || !email || !fullName}
                    className="unify-btn-primary w-full h-11 text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting to Operations Queue...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Support Complaint</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t-[1.5px] border-[#D8D6CE] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#464B5E] gap-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Your complaint is securely protected & assigned to Acme Support.</span>
                </div>
                <span>No customer password or account required</span>
              </div>
            </div>
          </div>
        ) : (
          /* Confirmation State View */
          <div className="unify-card p-8 sm:p-10 text-center space-y-6 shadow-[0_4px_20px_rgba(35,39,55,0.06)] animate-in fade-in duration-300">
            {/* Animated Success Badge */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#24283A]">
                Your Request Has Been Submitted
              </h2>
              <p className="text-xs text-[#464B5E] max-w-md mx-auto">
                Our support operations team and autonomous incident intelligence engine have received your complaint and initiated investigation.
              </p>
            </div>

            {/* Ticket Identifier Highlight Box */}
            <div className="p-4 sm:p-5 rounded-[13px] bg-[#E5E4EE] border-[1.5px] border-[#BFC1E4] max-w-md mx-auto space-y-2">
              <div className="text-[11px] font-bold text-[#5052C9] uppercase tracking-wider font-mono">
                Assigned Ticket Number
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl sm:text-3xl font-heading font-extrabold text-[#24283A] font-mono tracking-tight">
                  {submittedData.ticket_number}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTicketId}
                  className="p-1.5 rounded-md hover:bg-white/60 border border-[#BFC1E4] text-[#5052C9] transition-all"
                  title="Copy Ticket ID"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[#464B5E]">
                Please keep this ticket ID for your reference. Updates will be sent to{" "}
                <span className="font-semibold text-[#24283A]">{submittedData.customer_email}</span>.
              </p>
            </div>

            {/* Case Snapshot Grid */}
            <div className="p-4 rounded-[11px] bg-white/70 backdrop-blur-xs border border-white/90 text-left max-w-md mx-auto space-y-2 text-xs shadow-2xs">
              <div className="flex justify-between py-1 border-b border-[#D0D7E3]/60">
                <span className="text-[#464B5E]">Customer</span>
                <span className="font-semibold text-[#24283A]">{submittedData.customer_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D0D7E3]/60">
                <span className="text-[#464B5E]">Subject</span>
                <span className="font-semibold text-[#24283A] truncate max-w-[240px]" title={submittedData.subject}>
                  {submittedData.subject}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#D0D7E3]/60">
                <span className="text-[#464B5E]">Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  QUEUED FOR INVESTIGATION
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#464B5E]">Estimated Resolution</span>
                <span className="font-medium text-[#24283A] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#5052C9]" />
                  Within 15 minutes
                </span>
              </div>
            </div>

            {/* Action Buttons for Demo Flow */}
            <div className="pt-3 max-w-md mx-auto space-y-2.5">
              {/* Highlighted Button for Hackathon Evaluators/Presenters */}
              <Link
                href={`/cases/${submittedData.ticket_id}`}
                className="unify-btn-primary w-full h-11 text-xs font-bold flex items-center justify-center gap-2 shadow-md group"
              >
                <span>Staff View: Open Case in ResolveX Queue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={handleReset}
                className="unify-btn-secondary w-full h-10 text-xs font-semibold hover:bg-white"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-[#23283E] bg-[#151827] py-6 px-6 sm:px-10 text-xs text-[#8E95B8]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#5052C9] text-white flex items-center justify-center font-bold text-[10px]">
              RX
            </div>
            <span className="text-[#A5ADC8]">Powered by <strong className="text-white">ResolveX</strong> Autonomous Incident Intelligence</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Systems Operational
            </span>
            <span className="text-[#6B7294]">•</span>
            <span>Acme Commerce Inc.</span>
            <Link href="/login" className="text-[#A5ADC8] hover:text-white font-medium flex items-center gap-1 transition-colors">
              <Lock className="w-3 h-3" />
              <span>Internal Staff Console</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
