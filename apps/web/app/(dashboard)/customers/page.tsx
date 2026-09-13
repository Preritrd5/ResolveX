"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, User, ArrowRight } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

interface CustomerItem {
  id: string;
  external_customer_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  status: string;
  created_at?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      let q = `?page=${page}&limit=15`;
      if (searchQuery) q += `&query=${encodeURIComponent(searchQuery)}`;
      const res = await fetchApi<CustomerItem[]>(`/customers${q}`);
      setCustomers(res.data);
      if (res.meta) {
        setTotal(res.meta.total || 0);
        setTotalPages(res.meta.total_pages || 1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load customers";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#24283A]">Customer 360 Directory</h1>
        <p className="text-sm text-[#464B5E] mt-1 font-sans">
          Profiles, transaction histories, and support touchpoints ({total} registered customers)
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)]">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#464B5E]" />
          <input
            type="text"
            placeholder="Search by customer name, email, or external ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[11px] text-[#24283A] placeholder:text-[#464B5E]/60 focus:outline-none focus:border-[#5B5CE2] focus:ring-1 focus:ring-[#5B5CE2]"
          />
        </form>
      </div>

      {loading ? (
        <LoadingState message="Loading customers..." description="Querying Supabase customer records." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadCustomers} />
      ) : customers.length === 0 ? (
        <EmptyState title="No customers found" description="Try searching for a different name or email address." />
      ) : (
        <div className="bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FBFAF7] border-b border-[#D8D6CE] text-[#464B5E] uppercase tracking-wider font-heading font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">External ID</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8D6CE] text-[#24283A]">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#FBFAF7]/60 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/customers/${c.id}`} className="font-heading font-bold text-[#24283A] hover:text-[#5052C9] block">
                      {c.full_name}
                    </Link>
                    <div className="text-[10px] text-[#464B5E] font-mono">{c.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#464B5E]">
                    {c.external_customer_id || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-[#464B5E] font-mono text-[11px]">
                    {c.phone || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-[6px] text-[10px] font-heading font-semibold capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#464B5E] whitespace-nowrap font-mono text-[11px]">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs text-[#5052C9] hover:underline font-heading font-semibold"
                    >
                      View 360 <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-[#D8D6CE] bg-[#FBFAF7] flex items-center justify-between text-xs text-[#464B5E]">
            <div>
              Showing page <span className="font-heading font-bold text-[#24283A]">{page}</span> of{" "}
              <span className="font-heading font-bold text-[#24283A]">{totalPages}</span> ({total} customers)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3.5 py-1.5 rounded-[9px] bg-[#FBFAF7] border border-[#D8D6CE] text-[#24283A] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#BDBCB5] font-heading font-semibold transition-all cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3.5 py-1.5 rounded-[9px] bg-[#FBFAF7] border border-[#D8D6CE] text-[#24283A] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#BDBCB5] font-heading font-semibold transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
