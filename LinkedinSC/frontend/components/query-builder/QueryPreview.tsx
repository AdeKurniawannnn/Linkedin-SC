"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { Copy, ExternalLink, Check, AlertTriangle } from "lucide-react";

// Google search query character limits
const GOOGLE_MAX_QUERY_LENGTH = 2048;
const WARNING_THRESHOLD = Math.floor(GOOGLE_MAX_QUERY_LENGTH * 0.9); // 90% = 1843 chars

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

  // Subscribe to the query result directly (not the function)
  // This ensures the component re-renders when any state affecting the query changes
  const composedQuery = useQueryBuilderStore((state) => state.buildQuery());

  // Calculate warning state
  const queryLength = composedQuery.length;
  const isOverLimit = queryLength > GOOGLE_MAX_QUERY_LENGTH;
  const isNearLimit = queryLength >= WARNING_THRESHOLD && !isOverLimit;

  // Copy to clipboard handler
  const handleCopy = useCallback(async () => {
    if (!composedQuery) return;

    try {
      await navigator.clipboard.writeText(composedQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
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
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Query Preview</CardTitle>
          <CardDescription>
            Your composed search query
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!composedQuery}
            className="gap-1"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInGoogle}
            disabled={!composedQuery}
            className="gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Google
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {composedQuery ? (
          <>
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
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
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
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
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
          </>
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
