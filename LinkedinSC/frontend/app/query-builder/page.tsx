"use client";

import { useState } from "react";
import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { type UnifiedResult, type RawSearchResponse } from "@/lib/api";

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
  };

  const handleSearchError = (err: Error) => {
    setError(err.message || "Search failed");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">LinkedIn Query Builder</h1>
        <p className="text-lg text-gray-600">Build advanced search queries with toggles</p>
      </header>

      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="sticky top-4 z-10">
          <QueryPreview />
        </div>
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

      <footer className="text-center mt-16 text-sm text-gray-500">
        <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
      </footer>
    </div>
  );
}
