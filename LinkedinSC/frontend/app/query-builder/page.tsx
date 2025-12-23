"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { CompanySearchForm } from "@/components/CompanySearchForm";
import { PostsSearchForm, type PostsSearchParams } from "@/components/PostsSearchForm";
import { JobsSearchForm, type JobsSearchParams } from "@/components/JobsSearchForm";
import { AllSearchForm, type AllSearchParams } from "@/components/AllSearchForm";
import { ResultsTable } from "@/components/ResultsTable";
import { PostsTable, type LinkedInPost } from "@/components/PostsTable";
import { JobsTable, type LinkedInJob } from "@/components/JobsTable";
import { AllResultsTable, type LinkedInAllResult } from "@/components/AllResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { SiteFilter } from "@/components/query-builder/SiteFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { searchLinkedIn, searchLinkedInPosts, searchLinkedInJobs, searchLinkedInAll, type SearchResponse } from "@/lib/api";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";

/**
 * LinkedIn Query Builder - Advanced Search
 *
 * Halaman pencarian LinkedIn dengan multiple options (Profile, Posts, Jobs, Company).
 * Route: /query-builder
 */
export default function QueryBuilderPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [postsResults, setPostsResults] = useState<LinkedInPost[] | null>(null);
  const [postsMetadata, setPostsMetadata] = useState<any>(null);
  const [jobsResults, setJobsResults] = useState<LinkedInJob[] | null>(null);
  const [jobsMetadata, setJobsMetadata] = useState<any>(null);
  const [allResults, setAllResults] = useState<LinkedInAllResult[] | null>(null);
  const [allMetadata, setAllMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Get siteFilter from Zustand store
  const siteFilter = useQueryBuilderStore((state) => state.siteFilter);

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

  const handlePostsSearch = async (params: PostsSearchParams) => {
    setIsLoading(true);
    setError(null);
    setPostsResults(null);
    setPostsMetadata(null);

    try {
      const data = await searchLinkedInPosts(params);
      setPostsResults(data.posts);
      setPostsMetadata({
        keywords: params.keywords,
        total_results: data.total_results,
        pages_fetched: data.metadata.pages_fetched
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to search posts. Please try again.");
      console.error("Posts search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobsSearch = async (params: JobsSearchParams) => {
    setIsLoading(true);
    setError(null);
    setJobsResults(null);
    setJobsMetadata(null);

    try {
      const data = await searchLinkedInJobs(params);
      setJobsResults(data.jobs);
      setJobsMetadata({
        job_title: params.job_title,
        total_results: data.total_results,
        pages_fetched: data.metadata.pages_fetched
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to search jobs. Please try again.");
      console.error("Jobs search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllSearch = async (params: AllSearchParams) => {
    setIsLoading(true);
    setError(null);
    setAllResults(null);
    setAllMetadata(null);

    try {
      const data = await searchLinkedInAll(params);
      setAllResults(data.results);
      setAllMetadata({
        keywords: params.keywords,
        total_results: data.total_results,
        pages_fetched: data.metadata.pages_fetched
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to search all content. Please try again.");
      console.error("All search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          LinkedIn Query Builder
        </h1>
        <p className="text-lg text-gray-600">
          Buat query pencarian LinkedIn yang advanced dengan toggle UI
        </p>
      </header>

      {/* Cara Pakai Box */}
      <div className="w-full max-w-4xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Cara Pakai</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <ol className="list-decimal list-inside space-y-2">
              <li>Pilih tipe konten LinkedIn yang ingin dicari (Profile, Posts, Jobs, atau Company)</li>
              <li>Tambahkan keywords yang harus ada (Must Have) - minimal 1 keyword</li>
              <li>Optional: Tambahkan keywords exclude dan exact match phrases</li>
              <li>Optional: Atur location, country, language, dan max pages</li>
              <li>Lihat preview query yang ter-generate otomatis</li>
              <li>Pilih action:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Search LinkedIn</strong> - Execute query via backend API (dapat hasil scraping)</li>
                  <li><strong>Copy Query</strong> - Copy query string ke clipboard</li>
                  <li><strong>Open in Google</strong> - Buka query di Google search</li>
                </ul>
              </li>
              <li>Jika search via API, results akan muncul di bawah dengan option export CSV</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Site Filter - Always Visible */}
      <div className="w-full max-w-4xl mx-auto mb-8">
        <SiteFilter />
      </div>

      {/* Conditional Content Based on Site Filter */}

      {/* Profile Search */}
      {siteFilter === 'profile' && (
        <>
          {/* Search Form - Same as homepage */}
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
              dataType={siteFilter}
            />
          )}
        </>
      )}

      {/* Company Search */}
      {siteFilter === 'company' && (
        <>
          {/* Company Search Form - Custom for company search */}
          <CompanySearchForm onSearch={handleSearch} isLoading={isLoading} />

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
              dataType={siteFilter}
            />
          )}
        </>
      )}

      {/* Posts Search */}
      {siteFilter === 'posts' && (
        <>
          {/* Posts Search Form */}
          <PostsSearchForm onSearch={handlePostsSearch} isLoading={isLoading} />

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

          {/* Posts Results Table */}
          {postsResults && (
            <PostsTable
              posts={postsResults}
              metadata={postsMetadata}
            />
          )}
        </>
      )}

      {/* Jobs Search */}
      {siteFilter === 'jobs' && (
        <>
          {/* Jobs Search Form */}
          <JobsSearchForm onSearch={handleJobsSearch} isLoading={isLoading} />

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

          {/* Jobs Results Table */}
          {jobsResults && (
            <JobsTable
              jobs={jobsResults}
              metadata={jobsMetadata}
            />
          )}
        </>
      )}

      {/* All Content Search */}
      {siteFilter === 'all' && (
        <>
          {/* All Search Form */}
          <AllSearchForm onSearch={handleAllSearch} isLoading={isLoading} />

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

          {/* All Results Table */}
          {allResults && (
            <AllResultsTable
              results={allResults}
              metadata={allMetadata}
            />
          )}
        </>
      )}

      {/* Footer */}
      <footer className="text-center mt-16 text-sm text-gray-500">
        <p>Powered by Bright Data API • Built with Next.js & FastAPI</p>
      </footer>
    </div>
  );
}
