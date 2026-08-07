"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateTmdbIds } from "@/lib/utils/validation";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils/cn";

type ImportResult = {
  id: string | number;
  success: boolean;
  title?: string;
  error?: string;
};

export default function ImportForm() {
  const [input, setInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<ImportResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    setResults([]);
    
    // Parse and validate IDs
    const validIds = validateTmdbIds(input);

    if (validIds.length === 0) {
      setError("Please enter valid TMDB IDs.");
      return;
    }

    setIsImporting(true);
    setProgress({ current: 0, total: validIds.length });

    const newResults: ImportResult[] = [];

    // Process sequentially or in small batches to not overwhelm TMDB/Supabase
    for (let i = 0; i < validIds.length; i++) {
      const id = validIds[i];
      setProgress({ current: i + 1, total: validIds.length });
      
      try {
        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId: id }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          newResults.push({ id, success: true, title: data.movie?.title || `Movie ${id}` });
        } else {
          newResults.push({ id, success: false, error: data.error || "Failed to import" });
        }
      } catch (err) {
        newResults.push({ id, success: false, error: "Network error" });
      }
      
      setResults([...newResults]); // Update UI progressively
    }

    setIsImporting(false);
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="bg-surface border border-vborder rounded-2xl p-6 md:p-8 max-w-4xl shadow-xl shadow-black/20">
      <div className="space-y-4">
        <div>
          <label htmlFor="tmdbIds" className="block text-sm font-medium text-vtext-muted mb-2">
            TMDB IDs
          </label>
          <textarea
            id="tmdbIds"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isImporting}
            className="w-full h-40 bg-background border border-vborder rounded-xl p-4 text-vtext font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="e.g. 550, 680&#10;13, 27205"
          />
          <p className="mt-2 text-xs text-vtext-muted">
            Enter TMDB IDs separated by commas or new lines.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={isImporting || !input.trim()}
          className="w-full sm:w-auto px-8 py-3 bg-primary text-background font-semibold rounded-xl hover:bg-primary-hover disabled:bg-surface-light disabled:text-vtext-muted transition-colors flex items-center justify-center gap-2"
        >
          {isImporting ? (
            <>
              <div className="w-4 h-4 flex items-center justify-center"><LoadingSpinner /></div>
              Importing...
            </>
          ) : (
            <>
              <ImportIcon />
              Import Movies
            </>
          )}
        </button>
      </div>

      {/* Progress & Results Section */}
      <AnimatePresence>
        {(isImporting || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-8 space-y-6 pt-8 border-t border-vborder overflow-hidden"
          >
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-vtext">
                  {isImporting ? `Importing movie ${progress.current} of ${progress.total}...` : "Import Complete"}
                </span>
                <span className="text-primary">{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Summary */}
            {!isImporting && results.length > 0 && (
              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-4",
                failCount === 0 ? "bg-success/10 border-success/20 text-success" 
                  : successCount === 0 ? "bg-danger/10 border-danger/20 text-danger"
                  : "bg-surface-light border-vborder text-vtext"
              )}>
                <div className="flex-1 font-medium">
                  Successfully imported {successCount} movies. {failCount} failed.
                </div>
              </div>
            )}

            {/* Results List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {results.map((result, idx) => (
                <motion.div
                  key={`${result.id}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-sm",
                    result.success 
                      ? "bg-success/5 border-success/10" 
                      : "bg-danger/5 border-danger/10"
                  )}
                >
                  {result.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-danger shrink-0" />
                  )}
                  <div className="flex-1 truncate">
                    <span className="font-mono text-xs text-vtext-muted mr-2">#{result.id}</span>
                    {result.success ? (
                      <span className="text-vtext">{result.title}</span>
                    ) : (
                      <span className="text-danger">{result.error}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImportIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
