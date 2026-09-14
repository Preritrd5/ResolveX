"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, FileText, CheckCircle2, Search, Database, Sparkles, Layers } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

interface PolicyItem {
  id: string;
  title: string;
  category: string;
  content_markdown: string;
  version: number;
  is_active: boolean;
}

interface SearchResultItem {
  id: string;
  source_id: string;
  document_title: string;
  section: string;
  category: string;
  content: string;
  relevance_score: number;
}

export default function KnowledgePage() {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    async function loadPolicies() {
      try {
        setLoading(true);
        const res = await fetchApi<PolicyItem[]>("/knowledge");
        setPolicies(res.data);
        if (res.data.length > 0) {
          setSelectedPolicy(res.data[0]);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load knowledge records";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const res = await fetchApi<SearchResultItem[]>(
        `/knowledge/search?q=${encodeURIComponent(searchQuery)}`
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5052C9]">
          <BookOpen className="w-4 h-4" /> Authoritative Knowledge Base
        </div>
        <h1 className="text-2xl font-heading font-bold tracking-tight text-[#24283A] mt-1">
          Enterprise Policies &amp; Documentation
        </h1>
        <p className="text-sm text-[#464B5E] mt-1">
          Grounded corporate policies, SLAs, and troubleshooting guides indexed in Supabase and ChromaDB.
        </p>
      </div>

      {/* ChromaDB Status Banner */}
      <div className="p-4 bg-[#24283A] text-[#EDEBE5] rounded-[16px] text-xs leading-relaxed border border-[#3E4358] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-[0_2px_12px_rgba(35,39,55,0.08)]">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-[#7779D8]" />
          <span>
            <strong className="text-white font-heading">Active RAG Engine:</strong> ChromaDB Persistent Vector Store + PostgreSQL Multi-Tenant Fallback
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-[8px] text-[11px] font-mono bg-[#1C1F2E] text-[#BFC1E4] border border-[#3E4358]">
          {policies.length} Policies • 28 Indexed Chunks
        </span>
      </div>

      {/* Live RAG Semantic Search Bar */}
      <div className="p-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#73778B]" />
            <input
              type="text"
              suppressHydrationWarning
              placeholder="Search policy knowledge base via ChromaDB RAG (e.g. 'refund clearinghouse delay', 'webhook drop SLA')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#FBFAF7] border-[1.5px] border-[#BDBCB5] rounded-[11px] focus:outline-none focus:border-[#5052C9] text-[#24283A]"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-gradient-to-r from-[#7779D8] to-[#5052C9] hover:from-[#6A6CD2] hover:to-[#4547B8] text-white text-xs font-heading font-semibold rounded-[11px] shadow-[0_2px_10px_rgba(80,82,201,0.22)] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" /> {searching ? "Searching..." : "RAG Query"}
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults.length > 0 && (
          <div className="p-4 bg-gradient-to-br from-[#EEF0FA] to-[#E5E4EE] rounded-[16px] border-2 border-[#BFC1E4] space-y-3">
            <div className="flex items-center justify-between text-xs font-heading font-semibold text-[#24283A]">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#5052C9]" />
                Retrieved Policy Chunks ({searchResults.length} matches)
              </span>
              <button
                onClick={() => setSearchResults([])}
                className="text-[11px] text-[#464B5E] hover:text-[#24283A] font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((item) => (
                <div key={item.id} className="p-3 bg-[#FBFAF7] rounded-[12px] border border-[#BDBCB5] text-xs space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-[#24283A]">{item.document_title}</span>
                    <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded-[6px] border border-emerald-200">
                      Score: {Math.round(item.relevance_score * 100)}%
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-[#5052C9]">{item.section}</div>
                  <p className="text-[#464B5E] text-[11px] line-clamp-3 leading-relaxed font-sans">{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState message="Loading policy documents..." description="Fetching corporate guidelines from Supabase." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Policy Document Catalog (4 cols) */}
          <div className="lg:col-span-4 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-4 space-y-2">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-[#464B5E] px-2 mb-2">
              Authoritative Documents ({policies.length})
            </h3>
            {policies.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPolicy(p)}
                className={`w-full text-left p-3 rounded-[12px] text-xs transition-all flex items-start justify-between cursor-pointer ${
                  selectedPolicy?.id === p.id
                    ? "bg-[#E5E4EE] border-[1.5px] border-[#5052C9] text-[#24283A] font-semibold shadow-xs"
                    : "hover:bg-[#EDEBE5] text-[#464B5E] border border-transparent"
                }`}
              >
                <div>
                  <div className="font-heading font-medium text-[#24283A]">{p.title}</div>
                  <span className="text-[10px] capitalize text-[#73778B] font-mono mt-0.5 block">
                    {p.category}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-[#FBFAF7] border border-[#BDBCB5] px-1.5 py-0.5 rounded-[6px] text-[#464B5E]">
                  v{p.version}
                </span>
              </button>
            ))}
          </div>

          {/* Policy Document Markdown Viewer (8 cols) */}
          <div className="lg:col-span-8 bg-[#F8F7F3] rounded-[20px] border-[1.5px] border-[#C6C5BE] shadow-[0_2px_12px_rgba(35,39,55,0.06)] p-6">
            {selectedPolicy ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#D8D6CE] pb-3">
                  <div>
                    <h2 className="text-lg font-heading font-bold text-[#24283A]">{selectedPolicy.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-[#73778B] mt-1">
                      <span className="capitalize font-medium text-[#464B5E]">Category: {selectedPolicy.category}</span>
                      <span>•</span>
                      <span className="font-mono">Version {selectedPolicy.version}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active &amp; Grounded
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-xs leading-relaxed text-[#24283A] whitespace-pre-line font-sans">
                  {selectedPolicy.content_markdown}
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#73778B] text-center py-12">
                Select a policy document from the list to view its contents.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
