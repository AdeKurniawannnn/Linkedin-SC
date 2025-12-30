"use client";

import { useState } from "react";
import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { type UnifiedResult, type RawSearchResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react";
import Link from "next/link";

export default function SplitLayoutPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Minimal Top Bar */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-white/60 text-sm font-mono">LINKEDIN SEARCH</span>
          </div>
          <Link href="/query-builder">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Asymmetric Bento Grid */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-4 auto-rows-[minmax(200px,auto)]">

          {/* Large Title Block - Spans 8 columns */}
          <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h1 className="text-5xl lg:text-7xl font-black text-white mb-4 leading-tight">
                Find Your<br/>Next Hire
              </h1>
              <p className="text-xl text-white/80 max-w-md">
                Advanced LinkedIn search powered by intelligent query building
              </p>
            </div>
          </div>

          {/* Quick Preview - Spans 4 columns */}
          <div className="col-span-12 lg:col-span-4 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <QueryPreview />
          </div>

          {/* Presets Section - Spans 5 columns */}
          <div className="col-span-12 lg:col-span-5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <QueryPresets />
          </div>

          {/* Search Form - Spans 7 columns */}
          <div className="col-span-12 lg:col-span-7 bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <UnifiedSearchForm
              onSearchComplete={handleSearchComplete}
              onSearchError={handleSearchError}
            />
          </div>

          {/* Loading State - Full width when loading */}
          {isLoading && (
            <div className="col-span-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl p-8 border border-white/10">
              <ProgressBar isLoading={isLoading} />
              <div className="mt-6 text-center">
                <MagnifyingGlass className="h-12 w-12 text-purple-400 mx-auto mb-3 animate-pulse" weight="duotone" />
                <p className="text-white/60 font-mono text-sm">Scanning LinkedIn profiles...</p>
              </div>
            </div>
          )}

          {/* Error State - Full width */}
          {error && (
            <div className="col-span-12 bg-red-500/10 backdrop-blur-md rounded-3xl p-8 border border-red-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-lg text-red-400">Search Failed</p>
                  <p className="text-red-300/80 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State - Full width with unique design */}
          {!results && !error && !isLoading && (
            <div className="col-span-12 row-span-2 bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-md rounded-3xl p-12 border border-white/10 flex items-center justify-center">
              <div className="text-center max-w-lg">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-20 animate-ping"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-40"></div>
                  <div className="absolute inset-4 bg-slate-900 rounded-full flex items-center justify-center">
                    <MagnifyingGlass className="w-16 h-16 text-purple-400" weight="duotone" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">
                  Ready to Search
                </h3>
                <p className="text-white/60 text-lg">
                  Configure your search parameters and hit enter to discover profiles
                </p>
              </div>
            </div>
          )}

          {/* Results Section - Full width when has results */}
          {results && (
            <>
              {/* Results Header */}
              <div className="col-span-12 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-md rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-white/60 font-mono text-sm uppercase tracking-wider">Search Complete</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white">
                      {results.length} Profiles Found
                    </h2>
                    {query && (
                      <p className="text-white/60 mt-1">Query: <span className="text-white/90 font-mono">"{query}"</span></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="col-span-12 bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10">
                <UnifiedResultsTable results={results} metadata={metadata} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="mt-12 border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-6 py-6 text-center">
          <p className="text-white/40 text-sm font-mono">
            Bright Data × Next.js × FastAPI
          </p>
        </div>
      </div>
    </div>
  );
}
