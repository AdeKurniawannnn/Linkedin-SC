"use client";

import { useState } from "react";
import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { QueryPreview } from "@/components/query-builder/QueryPreview";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { type UnifiedResult, type RawSearchResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gear, List } from "@phosphor-icons/react";
import Link from "next/link";

export default function TabsLayoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UnifiedResult[] | null>(null);
  const [metadata, setMetadata] = useState<RawSearchResponse['metadata'] | undefined>(undefined);
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("config");

  const handleSearchComplete = (response: RawSearchResponse) => {
    setResults(response.results);
    setMetadata(response.metadata);
    setQuery(response.query);
    setError(null);
    setIsLoading(false);
    // Auto switch to results tab after successful search
    setActiveTab("results");
  };

  const handleSearchError = (err: Error) => {
    setError(err.message || "Search failed");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LinkedIn Query Builder</h1>
              <p className="text-sm text-gray-600">Tabs Layout - Focused Workflow</p>
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

      {/* Main Content - Tabs Layout */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs Navigation */}
          <div className="bg-white rounded-t-lg border-b shadow-sm">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent rounded-none">
              <TabsTrigger
                value="config"
                className="px-6 py-4 rounded-none data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-50 data-[state=active]:to-pink-50 data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
              >
                <Gear className="mr-2 h-5 w-5" weight="duotone" />
                <span className="font-semibold">Configuration</span>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="px-6 py-4 rounded-none data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-50 data-[state=active]:to-pink-50 data-[state=active]:border-b-2 data-[state=active]:border-purple-600"
                disabled={!results && !error}
              >
                <List className="mr-2 h-5 w-5" weight="duotone" />
                <span className="font-semibold">Results</span>
                {results && (
                  <Badge variant="secondary" className="ml-2">
                    {results.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Configuration Tab */}
          <TabsContent value="config" className="mt-0">
            <div className="bg-white rounded-b-lg shadow-sm p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Configure Your Search</h2>
                  <p className="text-gray-600">Set up your LinkedIn search parameters below.</p>
                </div>

                <QueryPreview />
                <QueryPresets />
                <UnifiedSearchForm
                  onSearchComplete={handleSearchComplete}
                  onSearchError={handleSearchError}
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-sm">
                    <p className="font-semibold text-lg">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-0">
            <div className="bg-white rounded-b-lg shadow-sm p-6">
              <ProgressBar isLoading={isLoading} />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-sm">
                  <p className="font-semibold text-lg">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setActiveTab("config")}
                  >
                    Back to Configuration
                  </Button>
                </div>
              )}

              {results && (
                <div className="space-y-4">
                  {/* Results Header */}
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Found {results.length} results
                        {query && (
                          <> for "<span className="font-medium">{query}</span>"</>
                        )}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("config")}
                    >
                      New Search
                    </Button>
                  </div>

                  {/* Results Table */}
                  <UnifiedResultsTable results={results} metadata={metadata} />
                </div>
              )}

              {!results && !error && (
                <div className="text-center py-12">
                  <p className="text-gray-600">No results yet. Configure your search first.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("config")}
                  >
                    Go to Configuration
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
