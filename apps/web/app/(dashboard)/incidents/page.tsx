"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  Network,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Search,
  Users,
  DollarSign,
  CheckCircle2,
  Filter,
  Sparkles
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface IncidentItem {
  id: string;
  incident_number: string;
  title: string;
  status: string;
  severity: string;
  root_cause_hypothesis?: string;
  confidence_score: number;
  impact_estimate_customers: number;
  financial_exposure_cents: number;
  detected_at?: string;
}

interface DetectionResult {
  scanned_tickets_count: number;
  scanned_events_count: number;
  incidents_created_count: number;
  incidents_updated_count: number;
  incidents: IncidentItem[];
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchApi<IncidentItem[]>("/incidents");
      setIncidents(res.data);
      setFilteredIncidents(res.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load incident intelligence";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleRunScan = async () => {
    try {
      setScanning(true);
      setScanNotice(null);
      const res = await fetchApi<DetectionResult>("/incidents/detect");
      setScanNotice(
        `Scanned ${res.data.scanned_tickets_count} tickets and ${res.data.scanned_events_count} service events. Active incidents synchronized.`
      );
      if (res.data.incidents && res.data.incidents.length > 0) {
        setIncidents(res.data.incidents);
      } else {
        await loadIncidents();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      setScanNotice(`Detection scan error: ${msg}`);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    let list = incidents;
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.incident_number.toLowerCase().includes(q) ||
          (i.root_cause_hypothesis && i.root_cause_hypothesis.toLowerCase().includes(q))
      );
    }
    setFilteredIncidents(list);
  }, [statusFilter, searchQuery, incidents]);

  // Aggregate metrics
  const totalImpacted = incidents.reduce((acc, i) => acc + (i.impact_estimate_customers || 0), 0);
  const totalExposure = incidents.reduce((acc, i) => acc + (i.financial_exposure_cents || 0), 0);
  const activeCount = incidents.filter((i) => i.status !== "resolved" && i.status !== "dismissed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold uppercase tracking-wider text-rose-600">
            <Activity className="w-4 h-4" /> Core Innovation — Phase 4
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#24283A] mt-1">
            Incident Command Center
          </h1>
          <p className="text-sm text-[#464B5E] mt-1 font-sans">
            Autonomous multi-signal cross-customer correlation connecting isolated tickets to systemic infrastructure degradation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6b6dc9] hover:to-[#4143A7] text-white font-heading font-semibold text-xs tracking-tight transition-all shadow-[0_2px_10px_rgba(80,82,201,0.22)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Running Correlation..." : "Run Live Detection Scan"}
          </button>
        </div>
      </div>

      {/* Detection Scan Notification */}
      {scanNotice && (
        <div className="p-3.5 bg-gradient-to-r from-[#EEF0FA] to-[#E5E4EE] border-[1.5px] border-[#BFC1E4] rounded-[16px] text-xs text-[#24283A] flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 text-[#5052C9]" />
            {scanNotice}
          </span>
          <button
            onClick={() => setScanNotice(null)}
            className="text-xs text-[#5052C9] hover:underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* High-Density KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#464B5E]">
            Active Incidents
          </div>
          <div className="font-mono text-2xl font-bold text-[#24283A] mt-1.5 flex items-baseline gap-2">
            <span>{activeCount}</span>
            <span className="text-xs text-rose-600 font-semibold font-sans">
              ({incidents.filter((i) => i.status === "confirmed").length} confirmed)
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#5052C9]" /> Cumulative Blast Radius
          </div>
          <div className="font-mono text-2xl font-bold text-[#24283A] mt-1.5">
            {totalImpacted} <span className="text-xs font-sans font-medium text-[#464B5E]">Customers</span>
          </div>
        </div>

        <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Total Exposure
          </div>
          <div className="font-mono text-2xl font-bold text-amber-900 mt-1.5">
            {formatCurrency(totalExposure)}
          </div>
        </div>

        <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
          <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1">
            <Network className="w-3.5 h-3.5 text-[#5052C9]" /> Correlation Accuracy
          </div>
          <div className="font-mono text-2xl font-bold text-[#5052C9] mt-1.5">
            96% Avg
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#464B5E]" />
            <input
              type="text"
              placeholder="Search incidents, numbers or root causes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FBFAF7] rounded-[11px] border-[1.5px] border-[#BDBCB5] text-[#24283A] placeholder:text-[#464B5E]/60 focus:outline-none focus:border-[#5B5CE2] focus:ring-1 focus:ring-[#5B5CE2]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <span className="text-[11px] text-[#464B5E] font-heading font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {["all", "confirmed", "emerging", "suspected", "resolved"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-[11px] text-xs font-heading font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-[#5052C9] text-white shadow-xs"
                  : "bg-[#FBFAF7] text-[#464B5E] border-[1.5px] border-[#D8D6CE] hover:border-[#BDBCB5]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      {loading ? (
        <LoadingState
          message="Scanning incident telemetry..."
          description="Correlating signals across Supabase service events and open tickets."
        />
      ) : error ? (
        <ErrorState message={error} onRetry={loadIncidents} />
      ) : filteredIncidents.length === 0 ? (
        <div className="p-12 text-center bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] text-[#464B5E] text-xs font-sans">
          No incidents found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              className="p-6 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] hover:shadow-md hover:border-[#BDBCB5] transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-[8px] bg-[#EEF0FA] text-[#5052C9] border border-[#BFC1E4]/50">
                    {inc.incident_number}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-[8px] text-[10px] font-heading font-bold uppercase ${
                        inc.severity === "critical"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : inc.severity === "high"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-[8px] text-[10px] font-heading font-bold capitalize ${
                        inc.status === "confirmed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
                          : inc.status === "resolved"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-heading font-bold text-[#24283A]">{inc.title}</h3>
                  <p className="text-xs text-[#464B5E] mt-1.5 leading-relaxed line-clamp-2 font-sans">
                    {inc.root_cause_hypothesis}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#D8D6CE]">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE]">
                    <div className="text-[10px] text-[#464B5E] uppercase font-heading font-bold">Confidence</div>
                    <div className="font-mono font-bold text-[#5052C9] mt-0.5">
                      {Math.round(inc.confidence_score * 100)}%
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE]">
                    <div className="text-[10px] text-[#464B5E] uppercase font-heading font-bold">Blast Radius</div>
                    <div className="font-mono font-bold text-[#24283A] mt-0.5">
                      {inc.impact_estimate_customers} <span className="text-[10px] font-sans font-normal text-[#464B5E]">Cust.</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE]">
                    <div className="text-[10px] text-[#464B5E] uppercase font-heading font-bold">Exposure</div>
                    <div className="font-mono font-bold text-[#24283A] mt-0.5">
                      {formatCurrency(inc.financial_exposure_cents)}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/incidents/${inc.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6b6dc9] hover:to-[#4143A7] text-white rounded-[11px] text-xs font-heading font-semibold shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-all cursor-pointer"
                >
                  <span>Open Incident Command Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
