"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Activity,
  SearchCode,
  Users,
  BookOpen,
  Bot,
  AlertTriangle,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAVIGATION_ITEMS: NavItem[] = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Live Cases", href: "/cases", icon: Inbox, badge: "315" },
  { name: "Incident Intelligence", href: "/incidents", icon: Activity, badge: "Emerging" },
  { name: "Investigations", href: "/investigations", icon: SearchCode },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Knowledge", href: "/knowledge", icon: BookOpen },
  { name: "AI Agents", href: "/agents", icon: Bot, badge: "12" },
  { name: "Escalations", href: "/escalations", icon: AlertTriangle, badge: "18" },
  { name: "CX Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            Resolve<span className="text-indigo-400">X</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Incident Intelligence</p>
        </div>
      </div>

      {/* Tenant Indicator */}
      <div className="px-6 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Tenant:</span>
          <span className="font-semibold text-slate-200">Acme Commerce</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                    isActive
                      ? "bg-indigo-700 text-white"
                      : item.badge === "Emerging"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Supabase Connected</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Hack Briven — Build Bengaluru 2026</p>
      </div>
    </aside>
  );
}
