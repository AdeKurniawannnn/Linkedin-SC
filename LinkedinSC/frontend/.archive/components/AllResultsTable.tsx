"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ExternalLink } from "lucide-react";

export interface LinkedInAllResult {
  url: string;
  title: string;
  description: string;
  type: "profile" | "company" | "post" | "job" | "other";
  rank: number;
}

interface AllResultsTableProps {
  results: LinkedInAllResult[];
  metadata?: {
    keywords: string;
    total_results: number;
    pages_fetched: number;
  };
}

export function AllResultsTable({ results, metadata }: AllResultsTableProps) {
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedResults(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResults.size === results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(results.map((_, index) => index)));
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "No",
      "Selected",
      "Type",
      "Title",
      "Description",
      "URL"
    ];

    const rows = results.map((result, index) => {
      const descriptionPreview = result.description.length > 150
        ? result.description.substring(0, 150) + "..."
        : result.description;

      return [
        index + 1,
        selectedResults.has(index) ? "Yes" : "No",
        result.type.toUpperCase(),
        `"${result.title.replace(/"/g, '""')}"`,
        `"${descriptionPreview.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        result.url
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
    a.download = `linkedin-all-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "profile":
        return "bg-blue-100 text-blue-800";
      case "company":
        return "bg-green-100 text-green-800";
      case "post":
        return "bg-purple-100 text-purple-800";
      case "job":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (results.length === 0) {
    return (
      <Card className="w-full max-w-6xl mx-auto mt-8">
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-sm text-gray-500">
            Try adjusting your search criteria or using different keywords.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Search Results</CardTitle>
          <CardDescription>
            Found {results.length} LinkedIn results
            {metadata && (
              <>
                {" • "}
                Keywords: "{metadata.keywords}"
              </>
            )}
            {selectedResults.size > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedResults.size} selected)
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSelectAll} variant="outline" size="sm">
            {selectedResults.size === results.length ? "Deselect All" : "Select All"}
          </Button>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="w-12 text-center">✓</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-80">Title</TableHead>
                <TableHead className="min-w-96">Description</TableHead>
                <TableHead className="w-16 text-center">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result, index) => {
                const descriptionPreview = result.description.length > 200
                  ? result.description.substring(0, 200) + "..."
                  : result.description;

                return (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedResults.has(index)}
                        onCheckedChange={() => handleToggle(index)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getTypeBadgeColor(result.type)}`}>
                        {result.type.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm text-gray-900">
                        {result.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700 line-clamp-3">
                        {descriptionPreview}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
