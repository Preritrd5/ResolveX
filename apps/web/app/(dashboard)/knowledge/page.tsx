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
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          <BookOpen className="w-4 h-4" /> Authoritative Knowledge Base
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
          Enterprise Policies & Documentation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Grounded corporate policies, SLAs, and troubleshooting guides indexed in Supabase and ChromaDB.
        </p>
      </div>

      {/* ChromaDB Status Banner */}
      <div className="p-4 bg-slate-900 text-slate-300 rounded-lg text-xs leading-relaxed border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>
            <strong className="text-white">Active RAG Engine:</strong> ChromaDB Persistent Vector Store + PostgreSQL Multi-Tenant Fallback
          </span>
        </div>
        <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
          {policies.length} Policies • 28 Indexed Chunks
        </span>
      </div>

      {/* Live RAG Semantic Search Bar */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search policy knowledge base via ChromaDB RAG (e.g. 'refund clearinghouse delay', 'webhook drop SLA')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> {searching ? "Searching..." : "RAG Query"}
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults.length > 0 && (
          <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Retrieved Policy Chunks ({searchResults.length} matches)
              </span>
              <button
                onClick={() => setSearchResults([])}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((item) => (
                <div key={item.id} className="p-3 bg-white rounded-md border border-indigo-100 text-xs space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.document_title}</span>
                    <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200/60">
                      Score: {Math.round(item.relevance_score * 100)}%
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-indigo-700">{item.section}</div>
                  <p className="text-slate-600 text-[11px] line-clamp-3 leading-relaxed font-sans">{item.content}</p>
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
          <div className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-2 mb-2">
              Authoritative Documents ({policies.length})
            </h3>
            {policies.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPolicy(p)}
                className={`w-full text-left p-3 rounded-md text-xs transition-colors flex items-start justify-between cursor-pointer ${
                  selectedPolicy?.id === p.id
                    ? "bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold"
                    : "hover:bg-slate-50 text-slate-700 border border-transparent"
                }`}
              >
                <div>
                  <div className="font-medium text-slate-900">{p.title}</div>
                  <span className="text-[10px] capitalize text-slate-400 font-mono mt-0.5 block">
                    {p.category}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                  v{p.version}
                </span>
              </button>
            ))}
          </div>

          {/* Policy Document Markdown Viewer (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            {selectedPolicy ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedPolicy.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="capitalize font-medium text-slate-600">Category: {selectedPolicy.category}</span>
                      <span>•</span>
                      <span className="font-mono">Version {selectedPolicy.version}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active & Grounded
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-line font-sans">
                  {selectedPolicy.content_markdown}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-12">
                Select a policy document from the list to view its contents.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
