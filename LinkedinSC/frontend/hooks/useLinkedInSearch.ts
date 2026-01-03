"use client";

import { useState, useRef, useCallback } from "react";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { useBuildQueryWithPresets } from "./useBuildQueryWithPresets";
import { searchRaw, isAbortError, type RawSearchResponse } from "@/lib/api";
import {
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  DEFAULT_MAX_RESULTS,
} from "@/config/searchOptions";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { toast } from "sonner";
import { validateSearchForm } from "@/lib/validation/searchSchema";

interface UseLinkedInSearchOptions {
  onSearchComplete?: (response: RawSearchResponse) => void;
  onSearchError?: (error: Error) => void;
  onFocusSearch?: () => void;
}

interface UseLinkedInSearchReturn {
  handleSearch: () => Promise<void>;
  handleCancel: () => void;
  isLoading: boolean;
}

/**
 * Hook for LinkedIn search functionality
 *
 * Extracts search logic from UnifiedSearchForm for use across components.
 * Handles API calls, loading state, cancellation, and keyboard shortcuts.
 */
export function useLinkedInSearch({
  onSearchComplete,
  onSearchError,
  onFocusSearch,
}: UseLinkedInSearchOptions = {}): UseLinkedInSearchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Store state
  const baseQuery = useQueryBuilderStore((state) => state.baseQuery);
  const location = useQueryBuilderStore((state) => state.location);
  const country = useQueryBuilderStore((state) => state.country);
  const language = useQueryBuilderStore((state) => state.language);
  const maxResults = useQueryBuilderStore((state) => state.maxResults);
  const clearPresets = useQueryBuilderStore((state) => state.clearPresets);

  // Composed query including custom presets
  const composedQuery = useBuildQueryWithPresets();

  // Cancel ongoing search
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      toast.info("Search cancelled");
    }
  }, []);

  // Handle search submission
  const handleSearch = useCallback(async () => {
    const query = composedQuery;

    // Validate form before submission
    const validationErrors = validateSearchForm(
      {
        baseQuery,
        location,
        country: country || DEFAULT_COUNTRY,
        language: language || DEFAULT_LANGUAGE,
        maxResults: maxResults || DEFAULT_MAX_RESULTS,
      },
      query
    );

    if (validationErrors.length > 0) {
      toast.error("Validation Error", {
        description: validationErrors[0],
      });
      onSearchError?.(new Error(validationErrors[0]));
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const response = await searchRaw(
        {
          query,
          country: country || DEFAULT_COUNTRY,
          language: language || DEFAULT_LANGUAGE,
          max_results: maxResults || DEFAULT_MAX_RESULTS,
        },
        abortControllerRef.current.signal
      );

      onSearchComplete?.(response);
    } catch (error) {
      // Don't report cancellation as an error
      if (isAbortError(error)) {
        console.log("Search was cancelled");
        return;
      }
      console.error("Search error:", error);
      onSearchError?.(error instanceof Error ? error : new Error("Search failed"));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [composedQuery, baseQuery, location, country, language, maxResults, onSearchComplete, onSearchError]);

  // Register keyboard shortcuts at hook level
  useKeyboardShortcuts({
    onSearch: handleSearch,
    onFocusSearch: onFocusSearch || (() => {}),
    onEscape: clearPresets,
    enabled: !isLoading,
  });

  return {
    handleSearch,
    handleCancel,
    isLoading,
  };
}
