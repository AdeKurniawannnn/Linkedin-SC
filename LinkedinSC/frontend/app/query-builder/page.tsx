"use client";

import { useState } from "react";
import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { LayoutSelector } from "@/components/LayoutSelector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SquaresFour, X } from "@phosphor-icons/react";
import { type UnifiedResult, type RawSearchResponse } from "@/lib/api";

export default function QueryBuilderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedResult[] | null>(null);
  const [metadata, setMetadata] = useState<RawSearchResponse['metadata'] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);

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
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">LinkedIn Query Builder</h1>
        <p className="text-lg text-gray-600">Build advanced search queries with toggles</p>

        {/* Layout Switcher Button */}
        <div className="mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLayoutSelector(!showLayoutSelector)}
            className="gap-2"
          >
            <SquaresFour className="h-4 w-4" weight="duotone" />
            {showLayoutSelector ? 'Sembunyikan' : 'Lihat'} Opsi Layout Alternatif
          </Button>
        </div>
      </header>

      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Layout Selector Card */}
        {showLayoutSelector && (
          <Card className="p-6 bg-white border-2 border-blue-200 shadow-lg relative">
            <button
              onClick={() => setShowLayoutSelector(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" weight="bold" />
            </button>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Layout yang Cocok untuk Anda</h2>
              <p className="text-gray-600">
                Kami punya 3 opsi tampilan alternatif dengan kelebihan masing-masing. Coba sekarang!
              </p>
            </div>
            <LayoutSelector />
          </Card>
        )}

        {/* Original Layout Content */}
        <div className="max-w-4xl mx-auto space-y-6">
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
      </div>

      <footer className="text-center mt-16 text-sm text-gray-500">
        <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
      </footer>
    </div>
  );
}
