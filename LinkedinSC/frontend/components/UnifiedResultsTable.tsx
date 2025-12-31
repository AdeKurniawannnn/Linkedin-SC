"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DownloadSimple, Buildings, ArrowsOut, X } from "@phosphor-icons/react";
import type { AggregatedResult, AggregatedMetadata } from "@/lib/api";
import { ResultRow } from "@/components/ResultRow";

/**
 * UnifiedResultsTable Component
 *
 * Displays search results with type badges and selection capabilities.
 * Supports multi-query aggregation, CSV export, and company scraping.
 *
 * Features:
 * - Table with columns: #, Type (badge), Query, Title, Description, URL
 * - Type badges with colors: profile=blue, company=purple, post=green, job=orange, other=gray
 * - Query column with tooltip showing all source queries
 * - Row selection checkboxes
 * - Export CSV button (includes query column)
 * - Scrape Companies button (only for selected company URLs)
 */

interface UnifiedResultsTableProps {
  results: AggregatedResult[];
  metadata?: AggregatedMetadata;
  onScrapeCompanies?: (urls: string[]) => void;
}

export function UnifiedResultsTable({
  results,
  metadata,
  onScrapeCompanies,
}: UnifiedResultsTableProps) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle single row selection
  const handleToggle = (url: string) => {
    setSelectedUrls((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(url)) {
        newSelected.delete(url);
      } else {
        newSelected.add(url);
      }
      return newSelected;
    });
  };

  // Toggle all rows
  const handleSelectAll = () => {
    if (selectedUrls.size === results.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(results.map((result) => result.url)));
    }
  };

  // Get selected company URLs
  const selectedCompanyUrls = useMemo(() => {
    return results
      .filter((result) => selectedUrls.has(result.url) && result.type === "company")
      .map((result) => result.url);
  }, [selectedUrls, results]);

  // Handle CSV export
  const handleExportCSV = () => {
    const headers = [
      "No",
      "Selected",
      "Type",
      "Query",
      "Title",
      "Description",
      "URL",
      "Author",
      "Company",
      "Followers",
      "Location",
    ];

    const rows = results.map((result, index) => {
      const descriptionPreview =
        result.description.length > 150
          ? result.description.substring(0, 150) + "..."
          : result.description;

      // Join multiple source queries with pipe separator
      const queryString = result.sourceQueries?.join(" | ") || "";

      return [
        index + 1,
        selectedUrls.has(result.url) ? "Yes" : "No",
        result.type.toUpperCase(),
        `"${queryString.replace(/"/g, '""')}"`,
        `"${result.title.replace(/"/g, '""')}"`,
        `"${descriptionPreview.replace(/"/g, '""').replace(/\n/g, " ")}"`,
        result.url,
        result.author_name || "",
        result.company_name || "",
        result.followers || "",
        result.location || "",
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkedin-unified-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle scrape companies
  const handleScrapeCompanies = () => {
    if (onScrapeCompanies && selectedCompanyUrls.length > 0) {
      onScrapeCompanies(selectedCompanyUrls);
    }
  };

  // Empty state
  if (results.length === 0) {
    return (
      <Card className="w-full max-w-7xl mx-auto mt-8">
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found
          </h3>
          <p className="text-sm text-gray-500">
            Try adjusting your search criteria or using different keywords.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-7xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Search Results</CardTitle>
          <CardDescription>
            Found {metadata?.totalUniqueResults ?? results.length} unique results
            {metadata && metadata.queryCount > 1 && (
              <span className="text-purple-600 font-medium">
                {" "}from {metadata.queryCount} queries
              </span>
            )}
            {metadata && (
              <>
                {" "}in {metadata.totalTimeSeconds.toFixed(2)}s
                {" "}({metadata.totalPagesFetched} pages)
              </>
            )}
            {metadata && metadata.totalRawResults > metadata.totalUniqueResults && (
              <span className="ml-2 text-orange-600">
                ({metadata.totalRawResults - metadata.totalUniqueResults} duplicates removed)
              </span>
            )}
            {selectedUrls.size > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedUrls.size} selected)
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSelectAll} variant="outline" size="sm">
            {selectedUrls.size === results.length
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <DownloadSimple className="mr-2 h-4 w-4" weight="bold" />
            Export CSV
          </Button>
          {onScrapeCompanies && (
            <Button
              onClick={handleScrapeCompanies}
              variant="default"
              size="sm"
              disabled={selectedCompanyUrls.length === 0}
            >
              <Buildings className="mr-2 h-4 w-4" weight="bold" />
              Scrape Companies ({selectedCompanyUrls.length})
            </Button>
          )}
          <Button
            onClick={() => setIsFullscreen(true)}
            variant="outline"
            size="sm"
            title="View fullscreen"
          >
            <ArrowsOut className="h-4 w-4" weight="bold" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-12 text-center">
                  <Checkbox
                      checked={
                        results.length > 0 &&
                        selectedUrls.size === results.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all results"
                    />
                </TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-48">Query</TableHead>
                <TableHead className="w-1/4">Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-16 text-center">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => (
                <ResultRow
                  key={result.url}
                  result={result}
                  index={index + 1}
                  isSelected={selectedUrls.has(result.url)}
                  onToggle={handleToggle}
                  sourceQueries={result.sourceQueries}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          showCloseButton={false}
          className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !p-0 !rounded-none !border-0"
        >
          <div className="flex flex-col h-full">
            {/* Fullscreen Header */}
            <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl">Search Results</DialogTitle>
                  <DialogDescription>
                    Found {metadata?.totalUniqueResults ?? results.length} unique results
                    {metadata && metadata.queryCount > 1 && (
                      <span className="text-purple-600 font-medium">
                        {" "}from {metadata.queryCount} queries
                      </span>
                    )}
                    {metadata && (
                      <>
                        {" "}in {metadata.totalTimeSeconds.toFixed(2)}s
                        {" "}({metadata.totalPagesFetched} pages)
                      </>
                    )}
                    {metadata && metadata.totalRawResults > metadata.totalUniqueResults && (
                      <span className="ml-2 text-orange-600">
                        ({metadata.totalRawResults - metadata.totalUniqueResults} duplicates removed)
                      </span>
                    )}
                    {selectedUrls.size > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({selectedUrls.size} selected)
                      </span>
                    )}
                  </DialogDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Button onClick={handleSelectAll} variant="outline" size="sm">
                    {selectedUrls.size === results.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                  <Button onClick={handleExportCSV} variant="outline" size="sm">
                    <DownloadSimple className="mr-2 h-4 w-4" weight="bold" />
                    Export CSV
                  </Button>
                  {onScrapeCompanies && (
                    <Button
                      onClick={handleScrapeCompanies}
                      variant="default"
                      size="sm"
                      disabled={selectedCompanyUrls.length === 0}
                    >
                      <Buildings className="mr-2 h-4 w-4" weight="bold" />
                      Scrape Companies ({selectedCompanyUrls.length})
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsFullscreen(false)}
                    variant="ghost"
                    size="sm"
                    className="ml-2"
                  >
                    <X className="h-5 w-5" weight="bold" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Fullscreen Table Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="rounded-md border overflow-x-auto">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center">#</TableHead>
                      <TableHead className="w-[50px] text-center">
                        <Checkbox
                      checked={
                        results.length > 0 &&
                        selectedUrls.size === results.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all results"
                    />
                      </TableHead>
                      <TableHead className="w-[80px]">Type</TableHead>
                      <TableHead className="w-[200px]">Query</TableHead>
                      <TableHead className="w-[20%]">Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[60px] text-center">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <ResultRow
                        key={result.url}
                        result={result}
                        index={index + 1}
                        isSelected={selectedUrls.has(result.url)}
                        onToggle={handleToggle}
                        sourceQueries={result.sourceQueries}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
