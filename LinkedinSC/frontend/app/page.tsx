"use client";

import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { SavedSearchesList } from "@/components/query-builder/SavedSearchesList";
import { PresetCommandPalette } from "@/components/query-builder/PresetCommandPalette";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SearchHistoryPanel } from "@/components/search-history";
import { Button } from "@/components/ui/button";
import { useResultsStore } from "@/stores/resultsStore";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { useConvexSearchHistory, useBuildQueryWithPresets } from "@/hooks";
import { type RawSearchResponse } from "@/lib/api";
import { TrashSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function Home() {
  // Use persisted stores
  const { results, aggregatedMetadata, error, isLoading, appendResults, setError, clearResults } = useResultsStore();
  const { resetAll: resetQueryBuilder } = useQueryBuilderStore();
  const { addEntry: addHistoryEntry } = useConvexSearchHistory();
  
  // Get composed query including custom presets from Convex
  const composedQuery = useBuildQueryWithPresets();

  const handleSearchComplete = (response: RawSearchResponse) => {
    // Get the query state for history capture
    const queryState = useQueryBuilderStore.getState();

    // Append results with deduplication (aggregates across multiple queries)
    appendResults(response.results, response.metadata, composedQuery);

    // Capture search to history
    addHistoryEntry(
      {
        baseQuery: queryState.baseQuery,
        activePresetIds: queryState.activePresetIds,
        activeLocationIds: queryState.activeLocationIds,
        country: queryState.country,
        language: queryState.language,
        maxResults: queryState.maxResults,
        composedQuery,
      },
      response
    );

    toast.success(`Found ${response.total_results} results`, {
      description: `Search completed in ${response.metadata.time_taken_seconds.toFixed(1)}s`,
    });
  };

  const handleSearchError = (err: Error) => {
    setError(err.message || "Search failed");
    toast.error("Search failed", {
      description: err.message || "An unexpected error occurred",
    });
  };

  const handleClearAll = () => {
    clearResults();
    resetQueryBuilder();
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Global Command Palette - Ctrl+K / Cmd+K */}
      <PresetCommandPalette />

      {/* Header */}
      <header className="text-center mb-12 relative">
        <div className="absolute top-0 right-4 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-destructive"
            title="Clear all data"
          >
            <TrashSimple className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <StatusIndicator />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          LinkedIn Query Builder
        </h1>
        <p className="text-lg text-muted-foreground">
          Build advanced search queries with toggles
          <span className="ml-2 text-sm text-muted-foreground/70">
            (Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">⌘K</kbd> for quick search)
          </span>
        </p>
      </header>

      <ErrorBoundary sessionStorageKey="query-builder-session">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          {/* Sticky Query Preview */}
          <div className="sticky top-4 z-10">
            <QueryPreview />
          </div>

          {/* Saved Searches - Quick recall for returning users */}
          <SavedSearchesList />

          {/* Search History - Automatic capture of all searches */}
          <SearchHistoryPanel />

          {/* Query Presets - Configuration before search */}
          <QueryPresets />

          {/* Search Form - Primary action */}
          <UnifiedSearchForm
            onSearchComplete={handleSearchComplete}
            onSearchError={handleSearchError}
          />

          {/* Progress Bar */}
          <ProgressBar isLoading={isLoading} />

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Results Table */}
          {results && <UnifiedResultsTable results={results} metadata={aggregatedMetadata ?? undefined} />}
        </div>
      </ErrorBoundary>

      {/* Footer */}
      <footer className="text-center mt-16 text-sm text-muted-foreground">
        <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
      </footer>
    </div>
  );
}
