"use client";

import React, { useEffect, useState } from "react";
import {
  Share2,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Activity,
  CreditCard,
  Inbox,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Server,
  ArrowRight,
  Clock,
  Radio
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";

interface IntegrationConnector {
  id: string;
  name: string;
  category: string;
  display_name: string;
  description: string;
  status: string;
  icon: string;
  webhook_url?: string;
  last_synced_at?: string;
  events_processed_count: number;
  health_status: string;
}

interface TestResult {
  connector_id: string;
  status: string;
  latency_ms: number;
  message: string;
}

export default function IntegrationsPage() {
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      const res = await fetchApi<IntegrationConnector[]>("/integrations");
      if (res.data) {
        setConnectors(res.data);
      }
    } catch {
      // Fallback display if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnectors();
  }, []);

  const handleTestPing = async (id: string) => {
    try {
      setTestingId(id);
      const res = await fetchApi<TestResult>(`/integrations/${id}/test`, {
        method: "POST"
      });
      if (res.data) {
        setTestResults((prev) => ({ ...prev, [id]: res.data }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          connector_id: id,
          status: "error",
          latency_ms: 0,
          message: err?.message || "Diagnostic test failed"
        }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleCopyWebhook = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "ticketing":
        return Inbox;
      case "payments":
        return CreditCard;
      case "telemetry":
        return Activity;
      default:
        return Radio;
    }
  };

  const categories = [
    { id: "ticketing", label: "Helpdesk & Customer Support", description: "Inbound ticket stream, customer context, and bidirectional agent notes." },
    { id: "payments", label: "E-Commerce & Payment Gateways", description: "Live charge captures, refund state transitions, and order fulfillment events." },
    { id: "telemetry", label: "Observability & Microservice Telemetry", description: "APM traces, Redis timeout alerts, and microservice error spikes for root-cause analysis." },
    { id: "communication", label: "Incident Notification & Broadcast", description: "Automated Slack channels and emergency customer communications." }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="unify-tag bg-[#E5E4EE] text-[#5052C9] border-[#BFC1E4]">
              Enterprise Integration Layer
            </span>
            <span className="text-xs text-[#464B5E] font-medium">• Organization: Acme Commerce</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold tracking-[-0.02em] text-[#24283A]">
            Integrations & Ingestion Hub
          </h1>
          <p className="text-xs text-[#464B5E] mt-0.5">
            ResolveX acts as the autonomous intelligence layer behind your existing tools. Connect external channels to stream tickets and telemetry into ResolveX.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadConnectors}
            disabled={loading}
            className="unify-btn-secondary h-9 text-xs px-3 bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Connectors</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="unify-card p-4">
          <div className="text-[11px] font-bold text-[#464B5E] uppercase font-mono tracking-wider">Active Connectors</div>
          <div className="mt-1 text-2xl font-heading font-extrabold text-[#24283A]">
            6 <span className="text-xs text-emerald-600 font-normal">/ 8 Available</span>
          </div>
          <div className="text-[11px] text-[#464B5E] mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Healthy handshakes</span>
          </div>
        </div>

        <div className="unify-card p-4">
          <div className="text-[11px] font-bold text-[#464B5E] uppercase font-mono tracking-wider">Events Ingested (30d)</div>
          <div className="mt-1 text-2xl font-heading font-extrabold text-[#24283A]">
            48,290
          </div>
          <div className="text-[11px] text-[#464B5E] mt-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-[#5052C9]" />
            <span>~1,610 events / day</span>
          </div>
        </div>

        <div className="unify-card p-4">
          <div className="text-[11px] font-bold text-[#464B5E] uppercase font-mono tracking-wider">Avg Ingestion Latency</div>
          <div className="mt-1 text-2xl font-heading font-extrabold text-[#24283A]">
            32.4<span className="text-xs font-normal text-[#464B5E]">ms</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>P99 &lt; 85ms</span>
          </div>
        </div>

        <div className="unify-card p-4">
          <div className="text-[11px] font-bold text-[#464B5E] uppercase font-mono tracking-wider">Security Guardrail</div>
          <div className="mt-1 text-2xl font-heading font-extrabold text-[#24283A]">
            HMAC-SHA256
          </div>
          <div className="text-[11px] text-[#464B5E] mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cryptographic validation</span>
          </div>
        </div>
      </div>

      {/* Connectors by Category */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catConnectors = connectors.filter((c) => c.category === cat.id);
          const CatIcon = getCategoryIcon(cat.id);

          return (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center gap-2 border-b-[1.5px] border-[#D8D6CE] pb-2">
                <div className="w-6 h-6 rounded-lg bg-[#E5E4EE] text-[#5052C9] flex items-center justify-center">
                  <CatIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-sm font-heading font-bold text-[#24283A]">{cat.label}</h2>
                  <p className="text-[11px] text-[#464B5E]">{cat.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catConnectors.map((conn) => {
                  const isConnected = conn.status === "connected";
                  const testResult = testResults[conn.name];
                  const isTesting = testingId === conn.name;
                  const fullWebhookUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:8000"}${conn.webhook_url || ""}`;

                  return (
                    <div
                      key={conn.name}
                      className="unify-card p-5 bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] flex flex-col justify-between space-y-4 hover:border-[#BFC1E4] transition-all shadow-2xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white border border-[#C6C5BE] flex items-center justify-center font-bold text-xs text-[#24283A] shadow-2xs">
                              {conn.display_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-heading font-bold text-[#24283A] flex items-center gap-1.5">
                                <span>{conn.display_name}</span>
                              </div>
                              <span className="text-[10px] text-[#464B5E] font-mono">id: {conn.name}</span>
                            </div>
                          </div>

                          {isConnected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#464B5E] bg-[#EDEBE5] px-2 py-0.5 rounded-full border border-[#C6C5BE]">
                              Available
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#464B5E] leading-relaxed">
                          {conn.description}
                        </p>

                        {/* Webhook Endpoint Strip */}
                        {isConnected && conn.webhook_url && (
                          <div className="mt-3 p-2.5 rounded-lg bg-[#EDEBE5] border border-[#D8D6CE] text-[11px] font-mono flex items-center justify-between gap-2">
                            <div className="truncate text-[#24283A]">
                              <span className="text-[#7779D8] font-bold">POST </span>
                              <span>{conn.webhook_url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyWebhook(fullWebhookUrl, conn.name)}
                              className="p-1 rounded hover:bg-white text-[#5052C9] transition-colors shrink-0"
                              title="Copy Webhook Endpoint"
                            >
                              {copiedKey === conn.name ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Diagnostic Test Result Output */}
                        {testResult && (
                          <div
                            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 ${
                              testResult.status === "healthy"
                                ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                                : "bg-rose-50 border border-rose-200 text-rose-900"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{testResult.message}</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                              {testResult.latency_ms}ms
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions & Metadata */}
                      <div className="pt-3 border-t border-[#D8D6CE] flex items-center justify-between text-[11px] text-[#464B5E]">
                        <span className="font-mono">
                          {conn.events_processed_count > 0 ? `${conn.events_processed_count} events synced` : "Standing by"}
                        </span>

                        <div className="flex items-center gap-2">
                          {isConnected ? (
                            <button
                              type="button"
                              onClick={() => handleTestPing(conn.name)}
                              disabled={isTesting}
                              className="unify-btn-secondary h-7 px-2.5 text-[11px] bg-white text-[#5052C9] border-[#BFC1E4] hover:bg-[#E5E4EE]"
                            >
                              {isTesting ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-[#5052C9]/30 border-t-[#5052C9] rounded-full animate-spin" />
                                  <span>Testing...</span>
                                </>
                              ) : (
                                <>
                                  <Radio className="w-3 h-3 text-[#7779D8]" />
                                  <span>Test Ping</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="unify-btn-secondary h-7 px-2.5 text-[11px] bg-white opacity-60 cursor-not-allowed"
                              disabled
                            >
                              Configure
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
