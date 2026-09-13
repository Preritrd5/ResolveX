import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  description?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading real-time records...",
  description = "Fetching data from Supabase backend services.",
  className = "",
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/30 ${className}`}>
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{message}</h4>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
