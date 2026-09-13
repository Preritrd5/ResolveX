"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Activity, Clock } from "lucide-react";

export interface ImpactTrendPoint {
  timestamp: string;
  affected_customers: number;
  related_tickets: number;
  impacted_transactions: number;
}

interface ImpactTrendChartProps {
  data?: ImpactTrendPoint[];
  points?: ImpactTrendPoint[];
  incidentNumber?: string;
}

export function ImpactTrendChart({ data, points, incidentNumber }: ImpactTrendChartProps) {
  const chartPoints = data || points || [];
  if (!chartPoints || chartPoints.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#73778B] bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE]">
        No chronological telemetry trend available for this incident candidate.
      </div>
    );
  }

  return (
    <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D8D6CE] pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5052C9]">
            <Activity className="w-3.5 h-3.5" /> Chronological Customer Impact Trend
          </div>
          <h3 className="text-sm font-heading font-bold text-[#24283A] mt-0.5">
            Incident Telemetry Progression ({incidentNumber || "INC-ACTIVE"})
          </h3>
          <p className="text-[11px] text-[#464B5E]">
            Real-time progression of affected customers vs reported complaint tickets over time.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#5052C9]" />
            <span className="text-[#464B5E]">Affected Customers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[#464B5E]">Reported Tickets</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                border: "none",
                fontSize: "12px",
                color: "#ffffff",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
              }}
              labelStyle={{ color: "#94a3b8", fontWeight: "bold", marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="affected_customers"
              name="Affected Customers"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorCustomers)"
            />
            <Area
              type="monotone"
              dataKey="related_tickets"
              name="Reported Tickets"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTickets)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          Data aggregated at 5-minute operational intervals
        </span>
        <span className="font-mono text-indigo-700 font-semibold">
          Unreported gap: {chartPoints[chartPoints.length - 1].affected_customers - chartPoints[chartPoints.length - 1].related_tickets} customers at risk of unguided complaint
        </span>
      </div>
    </div>
  );
}
