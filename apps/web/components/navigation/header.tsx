"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Terminal, Search, Sparkles, LogOut, ChevronDown, User, Settings, Menu } from "lucide-react";
import { SearchModal } from "@/components/search/search-modal";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <>
      <header className="h-[72px] bg-white/80 backdrop-blur-[20px] border-b border-[#D0D7E3]/70 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-30 transition-all shadow-[0_1px_3px_rgba(31,38,135,0.03)]">
        {/* Left: Mobile Menu Toggle & Incident Status Pulse */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="md:hidden w-10 h-10 rounded-xl bg-white/70 hover:bg-white/95 border border-white/90 text-[#24283A] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs backdrop-blur-md"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-[#24283A]" />
            </button>
          )}

          <Link
            href="/incidents/inc_acme_041"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF0FA] border-[1.5px] border-[#BFC1E4] text-[#24283A] text-xs font-semibold hover:border-[#5052C9] transition-all shadow-2xs min-w-0"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-heading font-bold text-[#5052C9] shrink-0">INC-041:</span>
            <span className="text-[#464B5E] truncate max-w-[110px] sm:max-w-[240px] lg:max-w-none">
              Stripe Webhook Dropping
            </span>
          </Link>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Global Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="h-10 w-10 md:w-auto px-0 md:px-3.5 rounded-[11px] bg-white/70 hover:bg-white/95 text-[#464B5E] hover:text-[#24283A] border border-white/90 text-xs transition-all shadow-2xs flex items-center justify-center md:justify-start gap-2.5 cursor-pointer backdrop-blur-md"
            title="Search tickets, incidents, customers, orders (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#5052C9] shrink-0" />
            <span className="hidden md:inline font-medium text-xs">Quick Search...</span>
            <kbd className="hidden md:inline text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/80 text-[#464B5E] border border-[#D0D7E3]/70 font-semibold">
              ⌘K
            </kbd>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#464B5E] bg-white/60 rounded-[11px] border border-white/80 font-mono text-[11px] backdrop-blur-xs">
            <Terminal className="w-3.5 h-3.5 text-[#5052C9]" />
            <span>seed=42</span>
          </div>

          {/* Active Logged-in User Profile */}
          <div className="relative pl-3 border-l border-[#D0D7E3]/70">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/70 transition-colors text-left"
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
              <div className="absolute right-0 mt-2 w-60 p-2 bg-white/90 backdrop-blur-xl border border-white/90 rounded-xl shadow-xl z-50">
                <div className="px-3 py-2 border-b border-[#D0D7E3]/60">
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
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/70 text-[#24283A] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-[#5052C9]" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/70 text-[#24283A] flex items-center gap-2.5 font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#5052C9]" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-[#D0D7E3]/60">
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
