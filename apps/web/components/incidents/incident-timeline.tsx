"use client";

import React from "react";
import { Clock, AlertTriangle, AlertOctagon, CheckCircle2, Ticket, CreditCard, Radio } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  event_type: string;
  timestamp: string;
  title: string;
  description: string;
  entity_id?: string;
  severity?: string;
  metadata?: Record<string, any>;
}

interface IncidentTimelineProps {
  events: TimelineEvent[];
}

export function IncidentTimeline({ events }: IncidentTimelineProps) {
  const getEventIcon = (eventType: string, severity?: string) => {
    switch (eventType) {
      case "service_error":
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      case "payment_captured":
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case "ticket_submitted":
        return <Ticket className="w-4 h-4 text-blue-600" />;
      case "ticket_cluster":
        return <Radio className="w-4 h-4 text-purple-600 animate-pulse" />;
      case "incident_detected":
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getEventBadge = (eventType: string, severity?: string) => {
    if (severity === "critical") {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    if (severity === "warning" || severity === "high") {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-500" />
          Chronological Incident Reconstruction ({events.length} Events)
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">UTC Sequence</span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((event, idx) => (
          <div key={event.id || idx} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
              {getEventIcon(event.event_type, event.severity)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{event.title}</h4>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase font-semibold ${getEventBadge(event.event_type, event.severity)}`}>
                    {event.event_type.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {formatDate(event.timestamp)}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {event.description}
              </p>

              {event.entity_id && (
                <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <span>Entity Ref:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-800">
                    {event.entity_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
