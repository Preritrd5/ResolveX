import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div className={`p-6 border border-rose-200 dark:border-rose-900/50 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-200 bg-white dark:bg-rose-900/40 border border-rose-300 dark:border-rose-800 rounded hover:bg-rose-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
