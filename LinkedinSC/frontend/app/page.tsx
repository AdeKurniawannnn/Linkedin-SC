"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { ResultsTable } from "@/components/ResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusIndicator } from "@/components/StatusIndicator";
import { searchLinkedIn, type SearchResponse } from "@/lib/api";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (params: {
    role: string;
    location: string;
    country: string;
    language: string;
    max_pages: number;
  }) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await searchLinkedIn(params);
      setResults(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to search. Please try again.");
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      {/* Header */}
      <header className="text-center mb-12 relative">
        <div className="absolute top-0 right-0">
          <StatusIndicator />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          LinkedScraper
        </h1>
        <p className="text-lg text-gray-600">
          Find LinkedIn candidates by job role and location
        </p>
      </header>

      {/* Search Form */}
      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {/* Progress Bar */}
      <ProgressBar isLoading={isLoading} />

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results && (
        <ResultsTable
          profiles={results.profiles}
          metadata={results.metadata}
        />
      )}

      {/* Footer */}
      <footer className="text-center mt-16 text-sm text-gray-500">
        <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
      </footer>
    </div>
  );
}
