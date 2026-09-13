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
  Zap,
  Share2
} from "lucide-react";
import { useAuth, RoleType } from "@/lib/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const ALL_NAV_ITEMS: Record<string, NavItem> = {
  overview: { name: "Overview", href: "/overview", icon: LayoutDashboard },
  cases: { name: "Live Cases", href: "/cases", icon: Inbox, badge: "315" },
  incidents: { name: "Incident Canvas", href: "/incidents", icon: Activity, badge: "Emerging" },
  investigations: { name: "Investigations", href: "/investigations", icon: SearchCode },
  proactive: { name: "Proactive Support", href: "/proactive", icon: Zap, badge: "Queue" },
  customers: { name: "Customers", href: "/customers", icon: Users },
  knowledge: { name: "Knowledge", href: "/knowledge", icon: BookOpen },
  agents: { name: "AI Agents", href: "/agents", icon: Bot, badge: "12" },
  integrations: { name: "Integrations", href: "/integrations", icon: Share2, badge: "6 Active" },
  escalations: { name: "Escalations", href: "/escalations", icon: AlertTriangle, badge: "18" },
  analytics: { name: "CX Analytics", href: "/analytics", icon: BarChart3 },
  settings: { name: "Settings", href: "/settings", icon: Settings },
};

const ROLE_NAV_KEYS: Record<RoleType, string[]> = {
  support_agent: ["cases", "customers", "knowledge", "investigations", "escalations"],
  support_manager: ["overview", "cases", "incidents", "investigations", "escalations", "customers", "analytics"],
  lead_investigator: ["overview", "incidents", "investigations", "proactive", "escalations", "analytics"],
  admin: ["overview", "cases", "incidents", "agents", "knowledge", "integrations", "analytics", "settings"],
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, role } = useAuth();

  // Active navigation items for the current role
  const activeKeys = ROLE_NAV_KEYS[role] || ROLE_NAV_KEYS.lead_investigator;
  const navigationItems = activeKeys.map((k) => ALL_NAV_ITEMS[k]).filter(Boolean);

  return (
    <aside className="w-64 h-screen bg-[#F8F7F3] text-[#24283A] flex flex-col shrink-0 border-r-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.04)] select-none">
      {/* Brand Header */}
      <div className="h-[72px] flex items-center gap-3 px-6 border-b-[1.5px] border-[#C6C5BE]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-[11px] bg-gradient-to-r from-[#7779D8] to-[#5052C9] flex items-center justify-center text-white font-bold shadow-[0_2px_8px_rgba(80,82,201,0.25)] transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-heading font-extrabold tracking-[-0.02em] text-[#24283A] flex items-center gap-1 leading-tight">
              Resolve<span className="text-[#5052C9]">X</span>
            </div>
            <p className="text-[10px] text-[#464B5E] font-medium tracking-wide uppercase">Enterprise Operations</p>
          </div>
        </Link>
      </div>

      {/* Tenant Indicator & Persona Role Banner */}
      <div className="px-5 py-2.5 border-b-[1.5px] border-[#D8D6CE] bg-[#EFEEE9]/80 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#464B5E] uppercase font-bold tracking-wider font-mono">Workspace</span>
          <span className="font-semibold text-[#24283A] text-xs">Acme Commerce</span>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#E5E4EE] text-[#5052C9] border border-[#BFC1E4]">
          {user.roleTitle}
        </span>
      </div>

      {/* Dynamic Role-Aware Navigation Links */}
      <nav className="flex-1 px-3 py-3.5 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/overview" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-[11px] transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#7779D8] to-[#5052C9] text-white shadow-[0_2px_10px_rgba(80,82,201,0.22)]"
                  : "text-[#464B5E] hover:text-[#24283A] hover:bg-[#EDEBE5]/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#464B5E]"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : item.badge === "Emerging"
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-[#E5E4EE] text-[#5052C9]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
