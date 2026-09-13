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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer 360 Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Profiles, transaction histories, and support touchpoints ({total} registered customers)
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-lg border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, or external ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
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
        <div className="bg-white rounded-lg border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">External ID</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/customers/${c.id}`} className="font-semibold text-slate-900 hover:text-indigo-600 block">
                      {c.full_name}
                    </Link>
                    <div className="text-[10px] text-slate-400 font-mono">{c.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {c.external_customer_id || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {c.phone || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/customers/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View 360 <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-800">{page}</span> of{" "}
              <span className="font-semibold text-slate-800">{totalPages}</span> ({total} customers)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium"
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
