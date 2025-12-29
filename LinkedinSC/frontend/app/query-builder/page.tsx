"use client";

import { useState } from "react";
import { toast } from "sonner";
import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { SavedSearchesList } from "@/components/query-builder/SavedSearchesList";
import { PresetCommandPalette } from "@/components/query-builder/PresetCommandPalette";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { type UnifiedResult, type RawSearchResponse } from "@/lib/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function QueryBuilderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedResult[] | null>(null);
  const [metadata, setMetadata] = useState<RawSearchResponse['metadata'] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSearchComplete = (response: RawSearchResponse) => {
    setResults(response.results);
    setMetadata(response.metadata);
    setError(null);
    setIsLoading(false);

    // Show success toast
    toast.success(`Found ${response.total_results} results`, {
      description: `Search completed in ${response.metadata.time_taken_seconds.toFixed(1)}s`,
    });
  };

  const handleSearchError = (err: Error) => {
    setError(err.message || "Search failed");
    setIsLoading(false);

    // Show error toast
    toast.error("Search failed", {
      description: err.message || "An unexpected error occurred",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      {/* Global Command Palette - Ctrl+K / Cmd+K */}
      <PresetCommandPalette />

      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">LinkedIn Query Builder</h1>
        <p className="text-lg text-gray-600">
          Build advanced search queries with toggles
          <span className="ml-2 text-sm text-gray-400">
            (Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs font-mono">⌘K</kbd> for quick search)
          </span>
        </p>
      </header>

      <ErrorBoundary sessionStorageKey="query-builder-session">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="sticky top-4 z-10">
            <QueryPreview />
          </div>
          <SavedSearchesList />
          <QueryPresets />
          <UnifiedSearchForm
            onSearchComplete={handleSearchComplete}
            onSearchError={handleSearchError}
          />

          <ProgressBar isLoading={isLoading} />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {results && <UnifiedResultsTable results={results} metadata={metadata} />}
        </div>
      </ErrorBoundary>

      <footer className="text-center mt-16 text-sm text-gray-500">
        <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
      </footer>
    </div>
  );
}
