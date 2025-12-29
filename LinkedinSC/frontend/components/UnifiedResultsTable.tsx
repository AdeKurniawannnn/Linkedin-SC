"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DownloadSimple, ArrowSquareOut, Buildings, ArrowsOut, X } from "@phosphor-icons/react";
import type { UnifiedResult, RawSearchResponse } from "@/lib/api";

/**
 * UnifiedResultsTable Component
 *
 * Displays search results with type badges and selection capabilities.
 * Supports CSV export and company scraping for selected URLs.
 *
 * Features:
 * - Table with columns: #, Type (badge), Title, Description, URL
 * - Type badges with colors: profile=blue, company=purple, post=green, job=orange, other=gray
 * - Row selection checkboxes
 * - Export CSV button
 * - Scrape Companies button (only for selected company URLs)
 */

interface UnifiedResultsTableProps {
  results: UnifiedResult[];
  metadata?: RawSearchResponse["metadata"];
  onScrapeCompanies?: (urls: string[]) => void;
}

// Type badge color mapping
const TYPE_BADGE_COLORS: Record<string, string> = {
  profile: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  company: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  post: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  job: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export function UnifiedResultsTable({
  results,
  metadata,
  onScrapeCompanies,
}: UnifiedResultsTableProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle single row selection
  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  // Toggle all rows
  const handleSelectAll = () => {
    if (selectedIndices.size === results.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(results.map((_, index) => index)));
    }
  };

  // Get selected company URLs
  const selectedCompanyUrls = useMemo(() => {
    return Array.from(selectedIndices)
      .map((index) => results[index])
      .filter((result) => result.type === "company")
      .map((result) => result.url);
  }, [selectedIndices, results]);

  // Handle CSV export
  const handleExportCSV = () => {
    const headers = [
      "No",
      "Selected",
      "Type",
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

      return [
        index + 1,
        selectedIndices.has(index) ? "Yes" : "No",
        result.type.toUpperCase(),
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
            Found {results.length} LinkedIn results
            {metadata && (
              <>
                {" "}
                in {metadata.time_taken_seconds.toFixed(2)}s
                {" "}({metadata.pages_fetched} pages)
              </>
            )}
            {selectedIndices.size > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedIndices.size} selected)
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSelectAll} variant="outline" size="sm">
            {selectedIndices.size === results.length
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
                      selectedIndices.size === results.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-1/4">Title</TableHead>
                <TableHead className="w-1/2">Description</TableHead>
                <TableHead className="w-20 text-center">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => {
                const descriptionPreview =
                  result.description.length > 200
                    ? result.description.substring(0, 200) + "..."
                    : result.description;

                const badgeColor =
                  TYPE_BADGE_COLORS[result.type] || TYPE_BADGE_COLORS.other;

                return (
                  <TableRow
                    key={index}
                    className={
                      selectedIndices.has(index)
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }
                  >
                    <TableCell className="font-medium text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedIndices.has(index)}
                        onCheckedChange={() => handleToggle(index)}
                      />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${badgeColor}`}
                      >
                        {result.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {result.title}
                      </div>
                      {result.author_name && (
                        <div className="text-xs text-gray-500">
                          by {result.author_name}
                        </div>
                      )}
                      {result.company_name && (
                        <div className="text-xs text-gray-500">
                          at {result.company_name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {descriptionPreview}
                      </div>
                      {(result.followers || result.location) && (
                        <div className="flex gap-2 mt-1">
                          {result.followers && (
                            <Badge variant="secondary" className="text-xs">
                              {result.followers.toLocaleString()} followers
                            </Badge>
                          )}
                          {result.location && (
                            <Badge variant="outline" className="text-xs">
                              {result.location}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <ArrowSquareOut className="h-4 w-4" weight="bold" />
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
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
                    Found {results.length} LinkedIn results
                    {metadata && (
                      <>
                        {" "}
                        in {metadata.time_taken_seconds.toFixed(2)}s
                        {" "}({metadata.pages_fetched} pages)
                      </>
                    )}
                    {selectedIndices.size > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({selectedIndices.size} selected)
                      </span>
                    )}
                  </DialogDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Button onClick={handleSelectAll} variant="outline" size="sm">
                    {selectedIndices.size === results.length
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
                            selectedIndices.size === results.length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[25%]">Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[60px] text-center">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => {
                      const descriptionPreview =
                        result.description.length > 200
                          ? result.description.substring(0, 200) + "..."
                          : result.description;

                      const badgeColor =
                        TYPE_BADGE_COLORS[result.type] || TYPE_BADGE_COLORS.other;

                      return (
                        <TableRow
                          key={index}
                          className={
                            selectedIndices.has(index)
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }
                        >
                          <TableCell className="font-medium text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedIndices.has(index)}
                              onCheckedChange={() => handleToggle(index)}
                            />
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs px-2 py-1 rounded font-medium ${badgeColor}`}
                            >
                              {result.type.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {result.title}
                            </div>
                            {result.author_name && (
                              <div className="text-xs text-gray-500">
                                by {result.author_name}
                              </div>
                            )}
                            {result.company_name && (
                              <div className="text-xs text-gray-500">
                                at {result.company_name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                              {descriptionPreview}
                            </div>
                            {(result.followers || result.location) && (
                              <div className="flex gap-2 mt-1">
                                {result.followers && (
                                  <Badge variant="secondary" className="text-xs">
                                    {result.followers.toLocaleString()} followers
                                  </Badge>
                                )}
                                {result.location && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.location}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              <ArrowSquareOut className="h-4 w-4" weight="bold" />
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
