"use client";

import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusIndicator } from "@/components/StatusIndicator";
import { Button } from "@/components/ui/button";
import { useResultsStore } from "@/stores/resultsStore";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { type RawSearchResponse } from "@/lib/api";
import { TrashSimple } from "@phosphor-icons/react";

export default function Home() {
  // Use persisted stores
  const { results, metadata, error, isLoading, setResults, setError, clearResults } = useResultsStore();
  const { resetAll: resetQueryBuilder } = useQueryBuilderStore();

  const handleSearchComplete = (response: RawSearchResponse) => {
    setResults(response.results, response.metadata);
  };

  const handleSearchError = (err: Error) => {
    setError(err.message || "Search failed");
  };

  const handleClearAll = () => {
    clearResults();
    resetQueryBuilder();
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
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
        </p>
      </header>

      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Sticky Query Preview */}
        <div className="sticky top-4 z-10">
          <QueryPreview />
        </div>

        {/* Search Form */}
        <UnifiedSearchForm
          onSearchComplete={handleSearchComplete}
          onSearchError={handleSearchError}
        />
        
        {/* Query Presets */}
        <QueryPresets />



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
        {results && <UnifiedResultsTable results={results} metadata={metadata ?? undefined} />}
      </div>

      {/* Footer */}
      <footer className="text-center mt-16 text-sm text-muted-foreground">
        <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
      </footer>
    </div>
  );
}
