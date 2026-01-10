"use client";

import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { SavedSearchesList } from "@/components/query-builder/SavedSearchesList";
import { PresetCommandPalette } from "@/components/query-builder/PresetCommandPalette";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SearchHistorySection } from "@/components/search-history";
import {
  HeaderBar,
  SplitPanelLayout,
  MobileTabs,
  EmptyState,
} from "@/components/layout";
import { useResultsStore } from "@/stores/resultsStore";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { useConvexSearchHistory, useBuildQueryWithPresets } from "@/hooks";
import { type RawSearchResponse } from "@/lib/api";
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

  // Left panel content: Query building tools
  const leftPanelContent = (
    <div className="space-y-6">
      {/* Search Form - Primary action */}
      <UnifiedSearchForm
        onSearchComplete={handleSearchComplete}
        onSearchError={handleSearchError}
      />

      {/* Query Presets - Configuration before search */}
      <QueryPresets />

      {/* Saved Searches - Quick recall for returning users */}
      <SavedSearchesList />
    </div>
  );

  // Right panel content: Results and history
  const rightPanelContent = (
    <div className="space-y-6 h-full flex flex-col">
      {/* Results Section */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ProgressBar isLoading={isLoading} />

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Results Table or Empty State */}
        {results ? (
          <UnifiedResultsTable results={results} metadata={aggregatedMetadata ?? undefined} />
        ) : (
          !isLoading && !error && <EmptyState />
        )}
      </div>

      {/* Search History - collapsible */}
      <SearchHistorySection autoCollapse={!!results} />
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Global Command Palette - Ctrl+K / Cmd+K */}
      <PresetCommandPalette />

      <ErrorBoundary sessionStorageKey="query-builder-session">
        {/* Header Bar */}
        <HeaderBar onClear={handleClearAll} />

        {/* Desktop: Split Panel Layout (lg and up) */}
        <div className="hidden lg:flex flex-1 min-h-0 w-full">
          <SplitPanelLayout
            leftPanel={leftPanelContent}
            rightPanel={rightPanelContent}
          />
        </div>

        {/* Mobile: Tabbed Layout (below lg) */}
        <div className="lg:hidden flex-1 min-h-0">
          <MobileTabs
            queryTab={leftPanelContent}
            resultsTab={rightPanelContent}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
