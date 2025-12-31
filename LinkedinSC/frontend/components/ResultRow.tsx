"use client";

import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowSquareOut } from "@phosphor-icons/react";
import type { UnifiedResult } from "@/lib/api";
import { QueryCell } from "@/components/QueryCell";

/**
 * ResultRow Component
 *
 * A memoized table row component for displaying search results.
 * Extracted from UnifiedResultsTable to enable row-level memoization
 * and reduce code duplication between normal and fullscreen views.
 */

// Type badge color mapping - fully typed to ensure all result types are covered
type ResultType = UnifiedResult["type"];

export const TYPE_BADGE_COLORS: Record<ResultType, string> = {
  profile: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  company: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  post: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  job: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
} as const satisfies Record<ResultType, string>;

interface ResultRowProps {
  /** The search result to display */
  result: UnifiedResult;
  /** The 1-based index of the row */
  index: number;
  /** Whether this row is selected */
  isSelected: boolean;
  /** Callback when selection state changes */
  onToggle: (url: string) => void;
  /** Maximum characters for description preview */
  maxDescriptionLength?: number;
  /** Source queries for this result (for multi-query aggregation) */
  sourceQueries?: string[];
}

/**
 * Get the badge color for a result type
 */
export function getBadgeColor(type: ResultType): string {
  return TYPE_BADGE_COLORS[type] || TYPE_BADGE_COLORS.other;
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Memoized table row component for search results
 */
export const ResultRow = memo(function ResultRow({
  result,
  index,
  isSelected,
  onToggle,
  maxDescriptionLength = 200,
  sourceQueries,
}: ResultRowProps) {
  const descriptionPreview = truncateText(result.description, maxDescriptionLength);
  const badgeColor = getBadgeColor(result.type);

  return (
    <TableRow
      key={result.url}
      data-state={isSelected ? "selected" : undefined}
      className={
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }
    >
      {/* Row Number */}
      <TableCell className="font-medium text-center">
        {index}
      </TableCell>

      {/* Checkbox */}
      <TableCell className="text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggle(result.url)}
          aria-label={`Select ${result.title}`}
        />
      </TableCell>

      {/* Type Badge */}
      <TableCell>
        <span
          className={`text-xs px-2 py-1 rounded font-medium ${badgeColor}`}
        >
          {result.type.toUpperCase()}
        </span>
      </TableCell>

      {/* Query Source */}
      {sourceQueries && sourceQueries.length > 0 && (
        <TableCell>
          <QueryCell queries={sourceQueries} />
        </TableCell>
      )}

      {/* Title & Author/Company */}
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

      {/* Description & Badges */}
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

      {/* External Link */}
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
});

// Re-export for convenience
export type { ResultRowProps };
