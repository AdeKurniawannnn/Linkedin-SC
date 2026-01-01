"use client";

import { useState, useCallback, useEffect, useDeferredValue, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBuildQueryWithPresets } from "@/hooks";
import { Copy, ArrowSquareOut, Check, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { SaveSearchDialog } from "./SaveSearchDialog";
import {
  GOOGLE_MAX_QUERY_LENGTH,
  GOOGLE_QUERY_WARNING_THRESHOLD,
} from "@/config/searchOptions";

// Calculate warning threshold
const WARNING_THRESHOLD = Math.floor(GOOGLE_MAX_QUERY_LENGTH * GOOGLE_QUERY_WARNING_THRESHOLD);

/**
 * QueryPreview Component
 *
 * Displays the composed query from the store's buildQuery() function.
 * Real-time updates as store state changes.
 *
 * Features:
 * - Monospace font for query text display
 * - Copy to Clipboard button with feedback
 * - Open in Google button
 * - Real-time updates from store
 * - Character limit warnings (yellow at 90%, red at 100%)
 */
export function QueryPreview() {
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering conditional content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get composed query including custom presets from Convex
  const rawQuery = useBuildQueryWithPresets();

  // Debounce query updates using useDeferredValue to prevent re-renders on every keystroke
  const composedQuery = useDeferredValue(rawQuery);

  // Memoize warning state calculations to prevent unnecessary recalculations
  const { queryLength, isOverLimit, isNearLimit } = useMemo(() => {
    const length = composedQuery.length;
    return {
      queryLength: length,
      isOverLimit: length > GOOGLE_MAX_QUERY_LENGTH,
      isNearLimit: length >= WARNING_THRESHOLD && length <= GOOGLE_MAX_QUERY_LENGTH,
    };
  }, [composedQuery]);

  // Copy to clipboard handler
  const handleCopy = useCallback(async () => {
    if (!composedQuery) return;

    try {
      await navigator.clipboard.writeText(composedQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Query copied to clipboard");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy query");
    }
  }, [composedQuery]);

  // Open in Google handler
  const handleOpenInGoogle = useCallback(() => {
    if (!composedQuery) return;

    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(composedQuery)}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");
  }, [composedQuery]);

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-base">Query Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {isMounted && composedQuery ? (
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <div
                className={`bg-gray-50 dark:bg-gray-900 rounded-md p-4 border-2 transition-colors ${
                  isOverLimit
                    ? "border-red-500 dark:border-red-600"
                    : isNearLimit
                    ? "border-yellow-500 dark:border-yellow-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <code className="font-mono text-sm text-gray-800 dark:text-gray-200 break-words whitespace-pre-wrap">
                  {composedQuery}
                </code>
              </div>

              {/* Warning messages */}
              {isOverLimit && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3">
                  <Warning className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" weight="bold" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-medium">Query exceeds Google's limit</p>
                    <p className="text-xs mt-1">
                      Your query is {queryLength - GOOGLE_MAX_QUERY_LENGTH} characters over the maximum length of {GOOGLE_MAX_QUERY_LENGTH}.
                      Google may truncate or reject this search.
                    </p>
                  </div>
                </div>
              )}

              {isNearLimit && (
                <div className="mt-3 flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                  <Warning className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" weight="bold" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">Approaching character limit</p>
                    <p className="text-xs mt-1">
                      {GOOGLE_MAX_QUERY_LENGTH - queryLength} characters remaining before Google's {GOOGLE_MAX_QUERY_LENGTH}-character limit.
                    </p>
                  </div>
                </div>
              )}

              {/* Query character count */}
              <p
                className={`mt-2 text-xs font-medium ${
                  isOverLimit
                    ? "text-red-600 dark:text-red-400"
                    : isNearLimit
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-gray-500"
                }`}
              >
                {queryLength} / {GOOGLE_MAX_QUERY_LENGTH} characters
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <SaveSearchDialog disabled={!composedQuery} />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                disabled={!composedQuery}
                title={copied ? "Copied!" : "Copy to clipboard"}
                className="h-14 w-14"
              >
                {copied ? (
                  <Check className="h-5 w-5" weight="bold" />
                ) : (
                  <Copy className="h-5 w-5" weight="bold" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleOpenInGoogle}
                disabled={!composedQuery}
                title="Open in Google"
                className="h-14 w-14"
              >
                <ArrowSquareOut className="h-5 w-5" weight="bold" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 border text-center">
            <p className="text-sm text-gray-500">
              Start building your query by entering a base query or selecting presets
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
