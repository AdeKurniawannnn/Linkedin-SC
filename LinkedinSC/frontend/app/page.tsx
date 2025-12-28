"use client";

import { useState } from "react";
import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusIndicator } from "@/components/StatusIndicator";
import { type UnifiedResult, type RawSearchResponse } from "@/lib/api";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedResult[] | null>(null);
  const [metadata, setMetadata] = useState<RawSearchResponse['metadata'] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleSearchComplete = (response: RawSearchResponse) => {
    setResults(response.results);
    setMetadata(response.metadata);
    setError(null);
    setIsLoading(false);
  };

  const handleSearchError = (err: Error) => {
    setError(err.message || "Search failed");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      {/* Header */}
      <header className="text-center mb-12 relative">
        <div className="absolute top-0 right-4">
          <StatusIndicator />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          LinkedIn Query Builder
        </h1>
        <p className="text-lg text-muted-foreground">
          Build advanced search queries with toggles
        </p>
      </header>

      <div className="w-full max-w-4xl mx-auto space-y-6">
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
        {results && <UnifiedResultsTable results={results} metadata={metadata} />}
      </div>

      {/* Footer */}
      <footer className="text-center mt-16 text-sm text-muted-foreground">
        <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
      </footer>
    </div>
  );
}
