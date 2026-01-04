"use client";
"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Convex-compatible query status types
 */
type QueryStatus = "pending" | "passed" | "failed";
type ExecStatus = "pending" | "running" | "completed" | "error";

/**
 * Convex-compatible generated query type
 */
interface ConvexGeneratedQuery {
  _id: Id<"generatedQueries">;
  _creationTime: number;
  sessionId: Id<"agentSessions">;
  round: number;
  query: string;
  generationReasoning?: string;
  pass1Score?: number;
  pass1Status: QueryStatus;
  pass1Reasoning?: string;
  pass2Score?: number;
  pass2Status?: QueryStatus;
  pass2Reasoning?: string;
  pass2SampleResults?: Array<{
    url: string;
    title: string;
    description: string;
    type: "profile" | "company" | "post" | "job" | "other";
    rank: number;
    author_name?: string | null;
    company_name?: string | null;
    followers?: number | null;
    location?: string | null;
  }>;
  compositeScore?: number;
  execStatus?: ExecStatus;
  fullResults?: Array<{
    url: string;
    title: string;
    description: string;
    type: "profile" | "company" | "post" | "job" | "other";
    rank: number;
  }>;
  resultsCount?: number;
  createdAt: number;
  updatedAt: number;
}

// Status display labels
const STATUS_LABELS: Record<QueryStatus, string> = {
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
};

// Status badge colors
const getStatusBadgeVariant = (status: QueryStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "passed": return "default";
    case "failed": return "destructive";
    case "pending": return "secondary";
    default: return "outline";
  }
};

/**
 * AgentQueryTable Component
 *
 * Table showing all generated queries with scores and status.
 *
 * Columns:
 * - #: Row number
 * - Query: Truncated query text (max 60 chars), full on hover/tooltip
 * - P1 Score: Pass 1 score with color coding
 * - P1 Status: Badge (pending, scored, rejected)
 * - P2 Score: Pass 2 score
 * - P2 Status: Badge
 * - Composite: Composite score
 * - Results: Result count (if executed)
 *
 * Features:
 * - Sortable by composite score
 * - Filterable by status
 * - Row click to expand and show full query + reasoning
 * - Score cells colored based on value (red < 50, yellow 50-70, green > 70)
 */

interface AgentQueryTableProps {
  queries: ConvexGeneratedQuery[];
  onQueryClick?: (query: ConvexGeneratedQuery) => void;
}

type FilterStatus = "all" | "pass1_passed" | "pass2_passed" | "executed" | "rejected";

export function AgentQueryTable({ queries, onQueryClick }: AgentQueryTableProps) {
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortByScore, setSortByScore] = useState<"asc" | "desc">("desc");

  // Filter queries by status
  const filteredQueries = useMemo(() => {
    let filtered = [...queries];

    switch (filterStatus) {
      case "pass1_passed":
        filtered = filtered.filter((q) => q.pass1Score && q.pass1Score >= 70);
        break;
      case "pass2_passed":
        filtered = filtered.filter((q) => q.pass2Score && q.pass2Score >= 60);
        break;
      case "executed":
        filtered = filtered.filter((q) => q.execStatus === "completed");
        break;
      case "rejected":
        filtered = filtered.filter(
          (q) => q.pass1Status === "failed" || q.pass2Status === "failed"
        );
        break;
    }

    // Sort by composite score
    filtered.sort((a, b) => {
      const scoreA = a.compositeScore ?? 0;
      const scoreB = b.compositeScore ?? 0;
      return sortByScore === "desc" ? scoreB - scoreA : scoreA - scoreB;
    });

    return filtered;
  }, [queries, filterStatus, sortByScore]);

  // Get score color
  const getScoreColor = (score: number | undefined): string => {
    if (!score) return "text-gray-400";
    if (score >= 70) return "text-green-600 dark:text-green-400 font-semibold";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400 font-semibold";
    return "text-red-600 dark:text-red-400 font-semibold";
  };



  // Toggle row expansion
  const toggleExpand = (queryId: string) => {
    setExpandedQueryId(expandedQueryId === queryId ? null : queryId);
    if (onQueryClick) {
      const query = queries.find((q) => q._id === queryId);
      if (query) onQueryClick(query);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter:</span>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Queries</SelectItem>
              <SelectItem value="pass1_passed">Pass 1 Passed</SelectItem>
              <SelectItem value="pass2_passed">Pass 2 Passed</SelectItem>
              <SelectItem value="executed">Executed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by Score:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortByScore(sortByScore === "desc" ? "asc" : "desc")}
          >
            {sortByScore === "desc" ? "High to Low" : "Low to High"}
          </Button>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          Showing {filteredQueries.length} of {queries.length} queries
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-1/3">Query</TableHead>
              <TableHead className="w-24 text-center">P1 Score</TableHead>
              <TableHead className="w-32">P1 Status</TableHead>
              <TableHead className="w-24 text-center">P2 Score</TableHead>
              <TableHead className="w-32">P2 Status</TableHead>
              <TableHead className="w-24 text-center">Composite</TableHead>
              <TableHead className="w-24 text-center">Results</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQueries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No queries match the current filter
                </TableCell>
              </TableRow>
            ) : (
              filteredQueries.map((query, index) => {
                const isExpanded = expandedQueryId === query._id;
                const truncatedQuery =
                  query.query.length > 60 ? query.query.substring(0, 60) + "..." : query.query;

                return (
                  <>
                    <TableRow
                      key={query._id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleExpand(query._id)}
                    >
                      <TableCell className="font-medium text-center">{index + 1}</TableCell>
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell title={query.query} className="font-mono text-xs">
                        {truncatedQuery}
                      </TableCell>
                      <TableCell className={cn("text-center", getScoreColor(query.pass1Score))}>
                        {query.pass1Score !== undefined ? `${Math.round(query.pass1Score)}%` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(query.pass1Status)}>
                          {STATUS_LABELS[query.pass1Status]}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn("text-center", getScoreColor(query.pass2Score))}>
                        {query.pass2Score !== undefined ? `${Math.round(query.pass2Score)}%` : "-"}
                      </TableCell>
                      <TableCell>
                        {query.pass2Status && (
                          <Badge variant={getStatusBadgeVariant(query.pass2Status)}>
                            {STATUS_LABELS[query.pass2Status]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={cn("text-center", getScoreColor(query.compositeScore))}>
                        {query.compositeScore !== undefined
                          ? `${Math.round(query.compositeScore)}%`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {query.resultsCount !== undefined ? query.resultsCount : "-"}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <TableRow key={`${query._id}-expanded`}>
                        <TableCell colSpan={9} className="bg-muted/30 p-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold mb-2">Full Query:</h4>
                              <p className="text-sm font-mono bg-background p-3 rounded border">
                                {query.query}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-2">Generation Reasoning:</h4>
                              <p className="text-sm text-muted-foreground">{query.generationReasoning}</p>
                            </div>

                            {query.pass1Reasoning && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Pass 1 Reasoning:</h4>
                                <p className="text-sm text-muted-foreground">{query.pass1Reasoning}</p>
                              </div>
                            )}

                            {query.pass2Reasoning && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Pass 2 Reasoning:</h4>
                                <p className="text-sm text-muted-foreground">{query.pass2Reasoning}</p>
                              </div>
                            )}

                            {query.pass2SampleResults && query.pass2SampleResults.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2">Sample Results:</h4>
                                <div className="space-y-2">
                                  {query.pass2SampleResults.slice(0, 3).map((result, idx) => (
                                    <div
                                      key={idx}
                                      className="text-sm bg-background p-3 rounded border"
                                    >
                                      <div className="font-medium">{result.title}</div>
                                      <div className="text-muted-foreground text-xs mt-1">
                                        {result.description}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
