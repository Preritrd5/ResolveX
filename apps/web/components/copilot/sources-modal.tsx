"use client";

import React from "react";
import { BookOpen, FileText, CheckCircle } from "lucide-react";

export interface KnowledgeSnippet {
  id: string;
  source_id: string;
  document_title: string;
  section: string;
  category: string;
  content: string;
  relevance_score: number;
}

interface SourcesModalProps {
  sources: KnowledgeSnippet[];
  isOpen: boolean;
  onClose: () => void;
}

export function SourcesModal({ sources, isOpen, onClose }: SourcesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Authoritative Sources Used</h3>
              <p className="text-xs text-slate-500">Corporate Acme Commerce policy documents retrieved via RAG</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 flex-1 pr-1">
          {sources.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No specific policy documents linked to this response.</p>
          ) : (
            sources.map((src, i) => (
              <div key={src.id || i} className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    {src.document_title}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200/60">
                    {src.category}
                  </span>
                </div>

                <div className="text-[11px] font-semibold text-slate-700">
                  {src.section}
                </div>

                <div className="p-3 bg-white rounded border border-slate-200/60 text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-line">
                  {src.content}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
