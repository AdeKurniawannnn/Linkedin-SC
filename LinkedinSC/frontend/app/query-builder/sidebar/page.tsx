"use client";

import { useState } from "react";
import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { type UnifiedResult, type RawSearchResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";

export default function SidebarLayoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedResult[] | null>(null);
  const [metadata, setMetadata] = useState<RawSearchResponse['metadata'] | undefined>(undefined);
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSearchComplete = (response: RawSearchResponse) => {
    setResults(response.results);
    setMetadata(response.metadata);
    setQuery(response.query);
    setError(null);
    setIsLoading(false);
  };

  const handleSearchError = (err: Error) => {
    setError(err.message || "Search failed");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LinkedIn Query Builder</h1>
              <p className="text-sm text-gray-600">Sidebar Layout - Form Always Visible</p>
            </div>
            <Link href="/query-builder">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Original
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Sidebar Layout */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Sticky Form */}
          <aside className="w-96 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <QueryPreview />
              <QueryPresets />
              <UnifiedSearchForm
                onSearchComplete={handleSearchComplete}
                onSearchError={handleSearchError}
              />

              {/* Stats Card */}
              {results && (
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Search Stats</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Total Results:</span>
                      <span className="font-medium text-gray-900">{results.length}</span>
                    </div>
                    {query && (
                      <div className="flex justify-between">
                        <span>Query Used:</span>
                        <span className="font-medium text-gray-900 truncate max-w-[150px]" title={query}>
                          {query}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Content - Results */}
          <main className="flex-1 min-w-0">
            <ProgressBar isLoading={isLoading} />

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-sm">
                <p className="font-semibold text-lg">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {!results && !error && !isLoading && (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Search</h3>
                  <p className="text-gray-600">
                    Configure your search parameters on the left sidebar and click "Search LinkedIn" to get started.
                  </p>
                </div>
              </div>
            )}

            {results && <UnifiedResultsTable results={results} metadata={metadata} />}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="container mx-auto px-6 py-6 text-center text-sm text-gray-500">
          <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
        </div>
      </footer>
    </div>
  );
}
