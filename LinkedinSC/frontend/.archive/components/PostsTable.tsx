"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ExternalLink } from "lucide-react";

export interface LinkedInPost {
  post_url: string;
  author_name: string;
  author_profile_url: string;
  posted_date: string;
  content: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  post_type: string;
  rank: number;
}

interface PostsTableProps {
  posts: LinkedInPost[];
  metadata?: {
    keywords: string;
    total_results: number;
    pages_fetched: number;
  };
}

export function PostsTable({ posts, metadata }: PostsTableProps) {
  const [selectedPosts, setSelectedPosts] = useState<Set<number>>(new Set());

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPosts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map((_, index) => index)));
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "No",
      "Selected",
      "Author",
      "Content Preview",
      "Type",
      "Hashtags",
      "Post URL",
      "Author URL"
    ];

    const rows = posts.map((post, index) => {
      const contentPreview = post.content.length > 100
        ? post.content.substring(0, 100) + "..."
        : post.content;

      return [
        index + 1,
        selectedPosts.has(index) ? "Yes" : "No",
        `"${post.author_name.replace(/"/g, '""')}"`,
        `"${contentPreview.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        post.post_type,
        `"${post.hashtags.join(', ')}"`,
        post.post_url,
        post.author_profile_url
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
    a.download = `linkedin-posts-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (posts.length === 0) {
    return (
      <Card className="w-full max-w-6xl mx-auto mt-8">
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
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
            Found {posts.length} LinkedIn posts
            {metadata && (
              <>
                {" • "}
                Keywords: "{metadata.keywords}"
              </>
            )}
            {selectedPosts.size > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedPosts.size} selected)
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSelectAll} variant="outline" size="sm">
            {selectedPosts.size === posts.length ? "Deselect All" : "Select All"}
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
                <TableHead className="w-48">Author</TableHead>
                <TableHead className="min-w-96">Content Preview</TableHead>
                <TableHead className="w-20">Type</TableHead>
                <TableHead className="w-16 text-center">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post, index) => {
                const contentPreview = post.content.length > 150
                  ? post.content.substring(0, 150) + "..."
                  : post.content;

                return (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-center">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedPosts.has(index)}
                        onCheckedChange={() => handleToggle(index)}
                      />
                    </TableCell>
                    <TableCell>
                      <a
                        href={post.author_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-sm"
                      >
                        {post.author_name}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-700 line-clamp-3">
                        {contentPreview}
                      </div>
                      {post.hashtags.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {post.hashtags.slice(0, 3).join(' ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {post.post_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <a
                        href={post.post_url}
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
