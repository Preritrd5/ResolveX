"use client";

import React from "react";
import { Users, DollarSign, ShieldAlert, Radio, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BlastRadiusProps {
  reportedCustomersCount: number;
  unreportedCustomersCount: number;
  totalAffectedCustomers: number;
  totalFinancialExposureCents: number;
  gatewaysAffected?: string[];
  servicesAffected?: string[];
}

export function BlastRadiusMetricCard({
  reportedCustomersCount,
  unreportedCustomersCount,
  totalAffectedCustomers,
  totalFinancialExposureCents,
  gatewaysAffected = [],
  servicesAffected = []
}: BlastRadiusProps) {
  const reportedPercent = totalAffectedCustomers > 0
    ? Math.round((reportedCustomersCount / totalAffectedCustomers) * 100)
    : 0;
  const unreportedPercent = 100 - reportedPercent;

  return (
    <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#24283A] flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Incident Blast Radius & Exposure
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-[8px] bg-rose-50 text-rose-700 font-bold border border-rose-200">
          Proactive Detection
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Customers */}
        <div className="p-3.5 bg-[#FBFAF7] rounded-[12px] border border-[#D8D6CE]">
          <div className="text-[10px] text-[#464B5E] uppercase font-heading font-bold flex items-center gap-1">
            <Users className="w-3 h-3 text-[#5052C9]" /> Total Impacted
          </div>
          <div className="font-mono text-xl font-black text-[#24283A] mt-1">
            {totalAffectedCustomers}
          </div>
          <div className="text-[10px] text-[#464B5E] mt-0.5 font-sans">Customers identified</div>
        </div>

        {/* Reported vs Unreported */}
        <div className="p-3.5 bg-emerald-50/50 rounded-[12px] border border-emerald-200">
          <div className="text-[10px] text-emerald-800 uppercase font-heading font-bold">Reported Tickets</div>
          <div className="font-mono text-xl font-black text-emerald-900 mt-1">
            {reportedCustomersCount}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">{reportedPercent}% of cluster</div>
        </div>

        <div className="p-3.5 bg-[#EEF0FA] rounded-[12px] border border-[#BFC1E4]">
          <div className="text-[10px] text-[#5052C9] uppercase font-heading font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 text-[#5052C9] animate-pulse" /> Unreported At-Risk
          </div>
          <div className="font-mono text-xl font-black text-[#24283A] mt-1">
            {unreportedCustomersCount}
          </div>
          <div className="text-[10px] text-[#5052C9] mt-0.5 font-medium">{unreportedPercent}% discovered</div>
        </div>

        {/* Financial Exposure */}
        <div className="p-3.5 bg-amber-50/60 rounded-[12px] border border-amber-200">
          <div className="text-[10px] text-amber-800 uppercase font-heading font-bold flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-amber-600" /> Exposure
          </div>
          <div className="font-mono text-xl font-black text-amber-950 mt-1">
            {formatCurrency(totalFinancialExposureCents)}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5 font-sans">Trapped payments</div>
        </div>
      </div>

      {/* Progress Bar of Reported vs Unreported */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-[#464B5E] font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Reported Complaints ({reportedCustomersCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5052C9]"></span>
            Proactively Discovered ({unreportedCustomersCount})
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#D8D6CE]/60 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${reportedPercent}%` }}
          />
          <div
            className="bg-[#5052C9] h-full transition-all duration-500"
            style={{ width: `${unreportedPercent}%` }}
          />
        </div>
      </div>

      {/* Domain scope */}
      {(gatewaysAffected.length > 0 || servicesAffected.length > 0) && (
        <div className="pt-2 border-t border-[#D8D6CE] flex flex-wrap items-center gap-3 text-xs text-[#464B5E]">
          {gatewaysAffected.length > 0 && (
            <div>
              <span className="font-heading font-semibold text-[#24283A]">Gateways: </span>
              {gatewaysAffected.join(", ")}
            </div>
          )}
          {servicesAffected.length > 0 && (
            <div>
              <span className="font-heading font-semibold text-[#24283A]">Services: </span>
              <span className="font-mono text-[11px] text-[#24283A]">{servicesAffected.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
