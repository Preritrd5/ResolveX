"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Terminal, Search, Sparkles, LogOut, ChevronDown, User, Settings } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";
import { useAuth } from "@/lib/auth-context";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <>
      <header className="h-[72px] bg-[#F8F7F3]/90 backdrop-blur-[16px] border-b-[1.5px] border-[#C6C5BE] flex items-center justify-between px-6 sm:px-8 shrink-0 z-30 transition-all">
        {/* Incident Status Pulse */}
        <div className="flex items-center gap-3">
          <Link
            href="/incidents/inc_acme_041"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF0FA] border-[1.5px] border-[#BFC1E4] text-[#24283A] text-xs font-semibold hover:border-[#5052C9] transition-all shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-heading font-bold text-[#5052C9] mr-1">INC-2026-041:</span>
            <span className="text-[#464B5E] hidden sm:inline">Stripe Webhook Dropping Orders (AWS us-east-1)</span>
            <span className="text-[#464B5E] sm:hidden">Stripe Webhook Dropping</span>
          </Link>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Global Search Trigger (Styled according to Unify input/button baseline) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="h-10 px-3.5 rounded-[11px] bg-[#FBFAF7] hover:bg-[#EDEBE5] text-[#464B5E] hover:text-[#24283A] border-[1.5px] border-[#BDBCB5] text-xs transition-all shadow-2xs flex items-center gap-2.5 cursor-pointer"
            title="Search tickets, incidents, customers, orders (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#5052C9]" />
            <span className="hidden md:inline font-medium text-xs">Quick Search...</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#F8F7F3] text-[#464B5E] border border-[#C6C5BE] font-semibold">
              ⌘K
            </kbd>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#464B5E] bg-[#EFEEE9] rounded-[11px] border-[1.5px] border-[#D8D6CE] font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-[#5052C9]" />
            <span>seed=42</span>
          </div>

          {/* Active Logged-in User Profile */}
          <div className="relative pl-3 border-l-[1.5px] border-[#D8D6CE]">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-[#EDEBE5] transition-colors text-left"
              title="View account & switch role"
            >
              <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-xs ${user.avatarColor}`}>
                {user.initials}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-heading font-bold text-[#24283A] leading-tight">{user.fullName}</div>
                <div className="text-[10px] text-[#464B5E] font-medium leading-tight">{user.roleTitle}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#464B5E] hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-60 p-2 bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] rounded-xl shadow-xl z-50">
                <div className="px-3 py-2 border-b border-[#D8D6CE]">
                  <p className="text-xs font-bold text-[#24283A]">{user.fullName}</p>
                  <p className="text-[11px] text-[#464B5E] truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E5E4EE] text-[#5052C9]">
                    {user.roleTitle}
                  </span>
                </div>

                <div className="py-1 space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#EDEBE5] text-[#24283A] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-[#5052C9]" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[#EDEBE5] text-[#24283A] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#5052C9]" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-[#D8D6CE]">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      router.push("/login");
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
