"use client";

import React from "react";
import {
  TrendingUp,
  AlertCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Inbox,
  HelpCircle
} from "lucide-react";

export interface ImpactForecastData {
  has_sufficient_data: boolean;
  current_affected: number;
  estimated_near_term_low?: number | null;
  estimated_near_term_high?: number | null;
  horizon_minutes: number;
  confidence: string;
  method: string;
  assumptions: string[];
  notice?: string | null;
}

export interface SupportLoadData {
  has_sufficient_data: boolean;
  current_ticket_rate_per_hour: number;
  baseline_ticket_rate_per_hour: number;
  projected_tickets_next_hour?: number | null;
  method: string;
  confidence: string;
  assumptions: string[];
  notice?: string | null;
}

interface ForecastCardProps {
  forecast?: ImpactForecastData;
  supportLoad?: SupportLoadData;
}

export function ForecastCard({ forecast, supportLoad }: ForecastCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Near-term Customer Impact Forecast */}
      <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#5052C9] uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" /> Near-Term Customer Impact Forecast
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-amber-50 text-amber-800 border border-amber-200/70 uppercase">
            ESTIMATE (Not Certainty)
          </span>
        </div>

        {forecast && forecast.has_sufficient_data ? (
          <div className="space-y-3">
            <div className="p-4 bg-gradient-to-br from-[#EEF0FA] to-[#E5E4EE] rounded-[16px] border-2 border-[#BFC1E4] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-heading font-semibold text-[#464B5E] uppercase tracking-wider">
                  Current Affected
                </span>
                <div className="text-2xl font-bold font-mono text-[#24283A] mt-0.5">
                  {forecast.current_affected}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-heading font-semibold text-[#5052C9] uppercase tracking-wider">
                  Estimated in Next {forecast.horizon_minutes}m
                </span>
                <div className="text-2xl font-bold font-mono text-[#5052C9] mt-0.5">
                  ~{forecast.estimated_near_term_low}–{forecast.estimated_near_term_high}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#464B5E]">
                <span>Projection Model:</span>
                <span className="font-mono font-semibold text-[#24283A]">{forecast.method}</span>
              </div>
              <div className="flex items-center justify-between text-[#464B5E]">
                <span>Evidence Confidence:</span>
                <span className="font-bold text-emerald-700">{forecast.confidence}</span>
              </div>
            </div>

            {forecast.assumptions && forecast.assumptions.length > 0 && (
              <div className="pt-2 border-t border-[#D8D6CE]">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#73778B]">
                  Model Assumptions:
                </span>
                <ul className="mt-1 space-y-1 text-[11px] text-[#464B5E] list-disc list-inside">
                  {forecast.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-[#FBFAF7] rounded-[14px] border border-[#BDBCB5] text-xs text-[#464B5E] space-y-2 shadow-xs">
            <div className="flex items-center gap-2 text-amber-800 font-semibold font-heading">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>{forecast?.notice || "Insufficient historical data for reliable projection."}</span>
            </div>
            <p className="text-[11px] text-[#73778B]">
              ResolveX never fabricates forecasts. A minimum of 3 chronological observation points is required before statistical extrapolation is computed.
            </p>
          </div>
        )}
      </div>

      {/* 2. Support Load & Ticket Demand Estimation */}
      <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#24283A] uppercase tracking-wider">
            <Inbox className="w-3.5 h-3.5 text-[#5052C9]" /> Support Queue Load Estimation
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[6px] bg-blue-50 text-blue-800 border border-blue-200/70 uppercase">
            DEMAND ESTIMATE
          </span>
        </div>

        {supportLoad && supportLoad.has_sufficient_data ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-[#FBFAF7] rounded-[14px] border border-[#BDBCB5] shadow-xs">
                <span className="text-[10px] font-heading font-bold text-[#73778B] uppercase">Baseline</span>
                <div className="text-base font-bold font-mono text-[#24283A] mt-1">
                  {supportLoad.baseline_ticket_rate_per_hour}/hr
                </div>
              </div>
              <div className="p-3 bg-rose-50 rounded-[14px] border border-rose-200 shadow-xs">
                <span className="text-[10px] font-heading font-bold text-rose-700 uppercase">Current Velocity</span>
                <div className="text-base font-bold font-mono text-rose-900 mt-1">
                  {supportLoad.current_ticket_rate_per_hour}/hr
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#EEF0FA] to-[#E5E4EE] rounded-[14px] border-2 border-[#BFC1E4] shadow-xs">
                <span className="text-[10px] font-heading font-bold text-[#5052C9] uppercase">Projected 60m</span>
                <div className="text-base font-bold font-mono text-[#5052C9] mt-1">
                  ~{supportLoad.projected_tickets_next_hour}
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-[14px] border border-emerald-200 text-xs text-emerald-900 space-y-1 shadow-xs">
              <div className="font-heading font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Proactive Deflection Opportunity
              </div>
              <p className="text-[11px] text-emerald-800">
                Proactive notifications sent to predicted affected customers can deflect up to 70% of inbound complaint tickets.
              </p>
            </div>

            {supportLoad.assumptions && supportLoad.assumptions.length > 0 && (
              <div className="pt-2 border-t border-[#D8D6CE]">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#73778B]">
                  Load Assumptions:
                </span>
                <ul className="mt-1 space-y-1 text-[11px] text-[#464B5E] list-disc list-inside">
                  {supportLoad.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-[#FBFAF7] rounded-[14px] border border-[#BDBCB5] text-xs text-[#73778B] shadow-xs">
            Support load data gathering in progress.
          </div>
        )}
      </div>
    </div>
  );
}
