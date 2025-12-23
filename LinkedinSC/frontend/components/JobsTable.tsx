"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ExternalLink } from "lucide-react";

export interface LinkedInJob {
  job_url: string;
  job_title: string;
  company_name: string;
  location: string;
  description: string;
  rank: number;
}

interface JobsTableProps {
  jobs: LinkedInJob[];
  metadata?: {
    job_title: string;
    total_results: number;
    pages_fetched: number;
  };
}

export function JobsTable({ jobs, metadata }: JobsTableProps) {
  const [selectedJobs, setSelectedJobs] = useState<Set<number>>(new Set());

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedJobs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(jobs.map((_, index) => index)));
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "No",
      "Selected",
      "Job Title",
      "Company",
      "Location",
      "Description",
      "Job URL"
    ];

    const rows = jobs.map((job, index) => {
      const descriptionPreview = job.description.length > 150
        ? job.description.substring(0, 150) + "..."
        : job.description;

      return [
        index + 1,
        selectedJobs.has(index) ? "Yes" : "No",
        `"${job.job_title.replace(/"/g, '""')}"`,
        `"${job.company_name.replace(/"/g, '""')}"`,
        `"${job.location.replace(/"/g, '""')}"`,
        `"${descriptionPreview.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        job.job_url
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
    a.download = `linkedin-jobs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (jobs.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-6xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Search Results</CardTitle>
          <CardDescription>
            Found {jobs.length} job openings
            {metadata && (
              <>
                {" • "}
                Searching for: "{metadata.job_title}"
              </>
            )}
            {selectedJobs.size > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedJobs.size} selected)
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSelectAll} variant="outline" size="sm">
            {selectedJobs.size === jobs.length ? "Deselect All" : "Select All"}
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
                <TableHead className="w-64">Job Title</TableHead>
                <TableHead className="w-48">Company</TableHead>
                <TableHead className="w-40">Location</TableHead>
                <TableHead className="min-w-96">Description</TableHead>
                <TableHead className="w-16 text-center">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job, index) => {
                const descriptionPreview = job.description.length > 200
                  ? job.description.substring(0, 200) + "..."
                  : job.description;

                return (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedJobs.has(index)}
                        onCheckedChange={() => handleToggle(index)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm text-gray-900">
                        {job.job_title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700">
                        {job.company_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {job.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700 line-clamp-3">
                        {descriptionPreview}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <a
                        href={job.job_url}
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
