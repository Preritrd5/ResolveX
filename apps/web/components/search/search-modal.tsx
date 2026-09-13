"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  User,
  Ticket,
  AlertOctagon,
  ShoppingBag,
  CreditCard,
  ExternalLink,
  Loader2,
  CornerDownLeft,
  Sparkles
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface SearchCustomer {
  id: string;
  full_name: string;
  email: string;
  loyalty_tier: string;
  url: string;
}

interface SearchTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  url: string;
}

interface SearchIncident {
  id: string;
  incident_number: string;
  title: string;
  severity: string;
  status: string;
  url: string;
}

interface SearchOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount_cents: number;
  url: string;
}

interface SearchPayment {
  id: string;
  gateway_transaction_id: string;
  gateway_name: string;
  amount_cents: number;
  status: string;
  url: string;
}

interface SearchResults {
  query: string;
  total_results: number;
  customers: SearchCustomer[];
  tickets: SearchTicket[];
  incidents: SearchIncident[];
  orders: SearchOrder[];
  payments: SearchPayment[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
          inputRef.current?.focus();
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Live debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetchApi<SearchResults>(`/search?q=${encodeURIComponent(query.trim())}&limit=5`);
        setResults(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  const hasResults = results && results.total_results > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#24283A]/40 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div
        className="w-full max-w-2xl bg-[#F8F7F3] border-[1.5px] border-[#C6C5BE] rounded-[20px] shadow-[0_8px_24px_rgba(35,39,55,0.12)] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150 text-[#24283A]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar (44px Unify baseline) */}
        <div className="p-3.5 border-b-[1.5px] border-[#D8D6CE] flex items-center gap-3 bg-[#FBFAF7]">
          <Search className="w-5 h-5 text-[#5052C9] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tickets, incidents, customers, orders, or Stripe traces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-sm text-[#24283A] placeholder-[#464B5E]/60 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-[#5052C9] animate-spin shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-[#464B5E] hover:text-[#24283A] rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-semibold text-[#464B5E] hover:text-[#24283A] px-2 py-1 rounded-[8px] hover:bg-[#EDEBE5] transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="overflow-y-auto p-4 space-y-4 flex-1 text-xs">
          {!query.trim() && (
            <div className="py-8 text-center text-[#464B5E] space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-[#7779D8]" />
              <p className="font-semibold text-xs text-[#24283A]">Global Correlated Search</p>
              <p className="text-[11px] text-[#464B5E]">
                Try searching <code className="text-[#5052C9] font-mono bg-[#E5E4EE] px-1.5 py-0.5 rounded">Marcus</code>,{" "}
                <code className="text-[#5052C9] font-mono bg-[#E5E4EE] px-1.5 py-0.5 rounded">INC-2026-041</code>, or{" "}
                <code className="text-[#5052C9] font-mono bg-[#E5E4EE] px-1.5 py-0.5 rounded">stripe</code>
              </p>
            </div>
          )}

          {query.trim() && !loading && !hasResults && (
            <div className="py-8 text-center text-[#464B5E]">
              No results found for &ldquo;<span className="font-semibold text-[#24283A]">{query}</span>&rdquo;
            </div>
          )}

          {hasResults && results && (
            <>
              {/* Incidents Group */}
              {results.incidents.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5 font-mono">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                    <span>Incidents ({results.incidents.length})</span>
                  </div>
                  <div className="divide-y divide-[#D8D6CE] border-[1.5px] border-[#C6C5BE] rounded-[14px] bg-[#FBFAF7] overflow-hidden">
                    {results.incidents.map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => handleSelect(inc.url)}
                        className="p-3 hover:bg-[#EDEBE5] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#5052C9]">{inc.incident_number}</span>
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              {inc.severity}
                            </span>
                          </div>
                          <div className="font-medium text-[#24283A]">{inc.title}</div>
                        </div>
                        <CornerDownLeft className="w-3.5 h-3.5 text-[#464B5E]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tickets Group */}
              {results.tickets.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5 font-mono">
                    <Ticket className="w-3.5 h-3.5 text-[#5052C9]" />
                    <span>Tickets &amp; Cases ({results.tickets.length})</span>
                  </div>
                  <div className="divide-y divide-[#D8D6CE] border-[1.5px] border-[#C6C5BE] rounded-[14px] bg-[#FBFAF7] overflow-hidden">
                    {results.tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleSelect(t.url)}
                        className="p-3 hover:bg-[#EDEBE5] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#5052C9]">{t.ticket_number}</span>
                            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-[#E5E4EE] text-[#5052C9]">
                              {t.priority}
                            </span>
                          </div>
                          <div className="font-medium text-[#24283A]">{t.subject}</div>
                        </div>
                        <CornerDownLeft className="w-3.5 h-3.5 text-[#464B5E]" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers Group */}
              {results.customers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5 font-mono">
                    <User className="w-3.5 h-3.5 text-[#5052C9]" />
                    <span>Customers ({results.customers.length})</span>
                  </div>
                  <div className="divide-y divide-[#D8D6CE] border-[1.5px] border-[#C6C5BE] rounded-[14px] bg-[#FBFAF7] overflow-hidden">
                    {results.customers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelect(c.url)}
                        className="p-3 hover:bg-[#EDEBE5] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-[#24283A]">{c.full_name}</div>
                          <div className="text-[11px] text-[#464B5E] font-mono">{c.email}</div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#EDEBE5] text-[#24283A]">
                          {c.loyalty_tier}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders Group */}
              {results.orders.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5 font-mono">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#5052C9]" />
                    <span>Orders ({results.orders.length})</span>
                  </div>
                  <div className="divide-y divide-[#D8D6CE] border-[1.5px] border-[#C6C5BE] rounded-[14px] bg-[#FBFAF7] overflow-hidden">
                    {results.orders.map((o) => (
                      <div
                        key={o.id}
                        onClick={() => handleSelect(o.url)}
                        className="p-3 hover:bg-[#EDEBE5] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-mono font-bold text-[#24283A]">{o.order_number}</div>
                          <div className="text-[11px] text-[#464B5E]">Total: {formatCurrency(o.total_amount_cents)}</div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#EDEBE5] text-[#24283A]">
                          {o.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments Group */}
              {results.payments.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#464B5E] flex items-center gap-1.5 font-mono">
                    <CreditCard className="w-3.5 h-3.5 text-[#5052C9]" />
                    <span>Payments ({results.payments.length})</span>
                  </div>
                  <div className="divide-y divide-[#D8D6CE] border-[1.5px] border-[#C6C5BE] rounded-[14px] bg-[#FBFAF7] overflow-hidden">
                    {results.payments.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect(p.url)}
                        className="p-3 hover:bg-[#EDEBE5] cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-mono font-semibold text-[#5052C9]">{p.gateway_transaction_id}</div>
                          <div className="text-[11px] text-[#464B5E]">{p.gateway_name} • {formatCurrency(p.amount_cents)}</div>
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 border-t-[1.5px] border-[#D8D6CE] bg-[#EFEEE9] text-[11px] text-[#464B5E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-mono bg-[#FBFAF7] border border-[#C6C5BE] px-1 py-0.5 rounded text-[10px]">Esc</kbd> to exit</span>
            <span>Navigate with keyboard</span>
          </div>
          <span className="font-mono text-[10px] text-[#5052C9]">Multi-Entity Organization Index</span>
        </div>
      </div>
    </div>
  );
}
