"use client";

import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
  Handle,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertOctagon,
  Server,
  Network,
  Ticket,
  User,
  Radio,
  ExternalLink,
  ShieldAlert,
  Map
} from "lucide-react";
import Link from "next/link";

// -----------------------------------------------------------------------------
// Custom Node Components
// -----------------------------------------------------------------------------

function RootCauseNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 bg-white rounded-xl border-2 border-rose-500 shadow-md min-w-[220px] text-xs">
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-rose-500!" />
      <div className="flex items-center gap-1.5 text-rose-600 font-bold uppercase text-[10px] tracking-wider mb-1">
        <AlertOctagon className="w-3.5 h-3.5" /> Root Cause Telemetry
      </div>
      <div className="font-bold text-slate-900 text-[13px]">{data.service}</div>
      <div className="font-mono text-[11px] text-rose-700 mt-1 bg-rose-50 p-1.5 rounded border border-rose-100">
        {data.error}
      </div>
      <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
        <span>Time: {data.timestamp}</span>
        <span className="font-bold text-rose-600 uppercase">{data.severity}</span>
      </div>
    </div>
  );
}

function InfraNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 bg-white rounded-xl border border-amber-400 shadow-sm min-w-[190px] text-xs">
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-amber-500!" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-amber-500!" />
      <div className="flex items-center gap-1.5 text-amber-700 font-semibold uppercase text-[10px] tracking-wider mb-1">
        <Server className="w-3.5 h-3.5" /> Gateway / Worker
      </div>
      <div className="font-bold text-slate-900">{data.service}</div>
      <div className="text-[11px] text-slate-500 mt-1">{data.detail}</div>
    </div>
  );
}

function IncidentHubNode({ data }: { data: any }) {
  return (
    <div className="px-5 py-4 bg-slate-900 text-white rounded-xl border-2 border-indigo-500 shadow-xl min-w-[240px] text-xs">
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-indigo-500!" />
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-indigo-500!" />
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-mono text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
          {data.label}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
          {data.severity} SEVERITY
        </span>
      </div>
      <div className="font-bold text-sm text-white">{data.title}</div>
      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-[11px]">
        <div>
          <span className="text-slate-400 text-[10px] uppercase">Confidence</span>
          <div className="font-mono font-bold text-indigo-400">{Math.round((data.confidence || 0) * 100)}%</div>
        </div>
        <div>
          <span className="text-slate-400 text-[10px] uppercase">Blast Radius</span>
          <div className="font-mono font-bold text-emerald-400">{data.blastRadius} Customers</div>
        </div>
      </div>
    </div>
  );
}

function TicketNode({ data }: { data: any }) {
  return (
    <div className="px-3.5 py-2.5 bg-white rounded-lg border border-blue-200 shadow-xs min-w-[190px] text-xs hover:border-blue-400 transition-colors">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-blue-500!" />
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-500!" />
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-blue-700 flex items-center gap-1">
          <Ticket className="w-3 h-3" /> {data.label}
        </span>
        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
          {Math.round((data.score || 0) * 100)}% match
        </span>
      </div>
      <div className="text-[11px] text-slate-600 mt-1 font-medium">{data.customer}</div>
    </div>
  );
}

function CustomerNode({ data }: { data: any }) {
  return (
    <div className="px-3 py-2 bg-emerald-50/70 rounded-lg border border-emerald-200 min-w-[160px] text-xs">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-emerald-500!" />
      <div className="flex items-center gap-1.5 font-semibold text-emerald-950">
        <User className="w-3.5 h-3.5 text-emerald-600" />
        <span>{data.name}</span>
      </div>
      <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">{data.badge || "Customer"}</div>
    </div>
  );
}

function UnreportedGroupNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 bg-violet-50/80 rounded-xl border-2 border-dashed border-violet-400 shadow-xs min-w-[240px] text-xs">
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 bg-violet-500!" />
      <div className="flex items-center gap-1.5 text-violet-800 font-bold uppercase text-[10px] tracking-wider mb-1">
        <Radio className="w-3.5 h-3.5 text-violet-600 animate-pulse" /> Proactive Discovery
      </div>
      <div className="font-bold text-violet-950 text-xs">{data.label}</div>
      <div className="text-[11px] text-violet-800 mt-1">{data.detail}</div>
      <div className="mt-2 text-[11px] font-mono font-bold text-violet-900 bg-violet-100/80 px-2 py-1 rounded inline-block">
        Trapped Funds: {data.exposure}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

interface IncidentImpactGraphProps {
  nodes: Node[];
  edges: Edge[];
}

export function IncidentImpactGraph({ nodes: initialNodes, edges: initialEdges }: IncidentImpactGraphProps) {
  const [showMiniMap, setShowMiniMap] = useState(false);

  const nodeTypes = useMemo(
    () => ({
      rootCause: RootCauseNode,
      infra: InfraNode,
      incidentHub: IncidentHubNode,
      ticket: TicketNode,
      customer: CustomerNode,
      unreportedGroup: UnreportedGroupNode
    }),
    []
  );

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl flex flex-col h-[440px] sm:h-[520px]">
      {/* Canvas Top Bar */}
      <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-white">
        <div className="flex items-center gap-2 min-w-0">
          <Network className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-bold tracking-tight truncate">Customer Impact &amp; Root Cause Graph</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">React Flow Canvas</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Root Telemetry
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Incident Hub
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Tickets
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Reported
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> Unreported
          </span>

          <button
            type="button"
            onClick={() => setShowMiniMap(!showMiniMap)}
            className={`ml-1 px-2.5 py-1 rounded-md text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              showMiniMap
                ? "bg-[#5052C9] text-white border-[#5052C9] shadow-xs"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
            title={showMiniMap ? "Hide Minimap" : "Show Minimap"}
          >
            <Map className="w-3 h-3" />
            <span>{showMiniMap ? "Hide Radar Map" : "Radar Map"}</span>
          </button>
        </div>
      </div>

      {/* React Flow Viewport */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          colorMode="dark"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
          <Controls className="!bg-slate-900 !border !border-slate-800 rounded-xl shadow-xl overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!fill-slate-300 [&>button:hover]:!bg-slate-800 [&>button_svg]:!fill-slate-300" />
          {showMiniMap && (
            <MiniMap
              bgColor="#0b0f19"
              maskColor="rgba(15, 23, 42, 0.75)"
              maskStrokeColor="#6366f1"
              maskStrokeWidth={1.5}
              nodeColor={(node) => {
                switch (node.type) {
                  case "rootCause":
                    return "#f43f5e";
                  case "incidentHub":
                    return "#6366f1";
                  case "ticket":
                    return "#3b82f6";
                  case "customer":
                    return "#10b981";
                  case "unreportedGroup":
                    return "#a855f7";
                  default:
                    return "#94a3b8";
                }
              }}
              className="!bg-slate-950/95 !border !border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md"
              style={{
                backgroundColor: "#0b0f19"
              }}
            />
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
