"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface QueryCellProps {
  /** Array of source queries for this result */
  queries: string[];
  /** Maximum characters to show before truncating */
  maxLength?: number;
}

/**
 * QueryCell Component
 *
 * Displays truncated query text with tooltip for full queries.
 * Shows badge count if multiple queries produced the same result.
 */
export function QueryCell({ queries, maxLength = 30 }: QueryCellProps) {
  if (!queries || queries.length === 0) return null;

  const primaryQuery = queries[0];
  const truncated =
    primaryQuery.length > maxLength
      ? primaryQuery.substring(0, maxLength) + "..."
      : primaryQuery;

  const hasMultiple = queries.length > 1;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help max-w-[200px]">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
              {truncated}
            </span>
            {hasMultiple && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 shrink-0">
                +{queries.length - 1}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md">
          <div className="space-y-1">
            <p className="font-medium text-xs mb-2">
              Source {queries.length === 1 ? "Query" : "Queries"}:
            </p>
            {queries.map((q, i) => (
              <p key={i} className="text-xs font-mono break-all">
                {queries.length > 1 && `${i + 1}. `}
                {q}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
