"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { useBuildQueryWithPresets } from "@/hooks";
import { searchRaw, isAbortError, type RawSearchResponse } from "@/lib/api";
import { SpinnerGap, MagnifyingGlass, X } from "@phosphor-icons/react";
import {
  COUNTRY_OPTIONS,
  LANGUAGE_OPTIONS,
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  DEFAULT_MAX_RESULTS,
  MIN_RESULTS,
  MAX_RESULTS,
  MAX_RESULTS_PRESETS,
} from "@/config/searchOptions";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { toast } from "sonner";
import {
  validateSearchForm,
  fieldValidators,
} from "@/lib/validation/searchSchema";

/**
 * UnifiedSearchForm Component
 *
 * Form for configuring and executing raw search queries.
 * Connects to the Zustand store for query building and calls the API.
 *
 * Features:
 * - Base query input connected to store
 * - Location input (optional)
 * - Country select (default: id)
 * - Language select (default: id)
 * - Max results input (default: 50)
 * - Search button with loading state
 */

interface UnifiedSearchFormProps {
  onSearchComplete?: (response: RawSearchResponse) => void;
  onSearchError?: (error: Error) => void;
}

export function UnifiedSearchForm({
  onSearchComplete,
  onSearchError,
}: UnifiedSearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
  const baseQueryInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Zustand store
  const baseQuery = useQueryBuilderStore((state) => state.baseQuery);
  const setBaseQuery = useQueryBuilderStore((state) => state.setBaseQuery);
  const location = useQueryBuilderStore((state) => state.location);
  const setLocation = useQueryBuilderStore((state) => state.setLocation);
  const country = useQueryBuilderStore((state) => state.country);
  const setCountry = useQueryBuilderStore((state) => state.setCountry);
  const language = useQueryBuilderStore((state) => state.language);
  const setLanguage = useQueryBuilderStore((state) => state.setLanguage);
  const maxResults = useQueryBuilderStore((state) => state.maxResults);
  const setMaxResults = useQueryBuilderStore((state) => state.setMaxResults);
  const clearPresets = useQueryBuilderStore((state) => state.clearPresets);

  // Get composed query including custom presets from Convex
  const composedQuery = useBuildQueryWithPresets();
  const resetAll = useQueryBuilderStore((state) => state.resetAll);

  // Focus handler for keyboard shortcut
  const handleFocusSearch = useCallback(() => {
    baseQueryInputRef.current?.focus();
    baseQueryInputRef.current?.select();
  }, []);

  // Field blur validation handlers
  const handleBaseQueryBlur = useCallback(() => {
    const error = fieldValidators.baseQuery(baseQuery);
    setFieldErrors((prev) => ({ ...prev, baseQuery: error }));
  }, [baseQuery]);

  const handleLocationBlur = useCallback(() => {
    const error = fieldValidators.location(location);
    setFieldErrors((prev) => ({ ...prev, location: error }));
  }, [location]);

  const handleMaxResultsBlur = useCallback(() => {
    const error = fieldValidators.maxResults(maxResults || DEFAULT_MAX_RESULTS);
    setFieldErrors((prev) => ({ ...prev, maxResults: error }));
  }, [maxResults]);

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
      // Show first error as toast
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: handleSearch,
    onFocusSearch: handleFocusSearch,
    onEscape: clearPresets,
    enabled: !isLoading,
  });

  // Handle max results change
  const handleMaxResultsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setMaxResults(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Configuration</CardTitle>
        <CardDescription>
          Configure your search parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base Query Input */}
        <div className="space-y-2">
          <Label htmlFor="baseQuery">Base Query</Label>
          <Input
            ref={baseQueryInputRef}
            id="baseQuery"
            placeholder="Enter your search keywords..."
            value={baseQuery}
            onChange={(e) => setBaseQuery(e.target.value)}
            onBlur={handleBaseQueryBlur}
            className={fieldErrors.baseQuery ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {fieldErrors.baseQuery ? (
            <p className="text-xs text-red-500">{fieldErrors.baseQuery}</p>
          ) : (
            <p className="text-xs text-gray-500">
              Keywords to search for (combined with selected presets)
            </p>
          )}
        </div>

        {/* Location Input */}
        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <Input
            id="location"
            placeholder="e.g., Jakarta, Singapore"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={handleLocationBlur}
            className={fieldErrors.location ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {fieldErrors.location && (
            <p className="text-xs text-red-500">{fieldErrors.location}</p>
          )}
        </div>

        {/* Country and Language Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Country Select */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={country || DEFAULT_COUNTRY}
              onValueChange={(value) => setCountry(value)}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language Select */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={language || DEFAULT_LANGUAGE}
              onValueChange={(value) => setLanguage(value)}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Max Results Input */}
        <div className="space-y-2">
          <Label htmlFor="maxResults">Max Results</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={MAX_RESULTS_PRESETS.includes(maxResults as typeof MAX_RESULTS_PRESETS[number]) ? String(maxResults) : undefined}
            onValueChange={(value) => {
              if (value) {
                setMaxResults(Number(value));
              }
            }}
            className="flex flex-wrap gap-1"
          >
            {MAX_RESULTS_PRESETS.map((preset) => (
              <ToggleGroupItem
                key={preset}
                value={String(preset)}
                className="text-xs px-3"
              >
                {preset === MAX_RESULTS ? "Max" : preset}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Input
            id="maxResults"
            type="number"
            min={MIN_RESULTS}
            max={MAX_RESULTS}
            value={maxResults || DEFAULT_MAX_RESULTS}
            onChange={handleMaxResultsChange}
            onBlur={handleMaxResultsBlur}
            className={fieldErrors.maxResults ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {fieldErrors.maxResults ? (
            <p className="text-xs text-red-500">{fieldErrors.maxResults}</p>
          ) : (
            <p className="text-xs text-gray-500">
              Maximum number of results to fetch ({MIN_RESULTS}-{MAX_RESULTS})
            </p>
          )}
        </div>

        {/* Search/Cancel Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex-1"
            title="Search LinkedIn (⌘+Enter)"
          >
            {isLoading ? (
              <>
                <SpinnerGap className="mr-2 h-4 w-4 animate-spin" weight="bold" />
                Searching...
              </>
            ) : (
              <>
                <MagnifyingGlass className="mr-2 h-4 w-4" weight="bold" />
                Search LinkedIn
                <kbd className="ml-2 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>↵
                </kbd>
              </>
            )}
          </Button>
          {isLoading && (
            <Button
              onClick={handleCancel}
              variant="destructive"
              title="Cancel search"
            >
              <X className="mr-2 h-4 w-4" weight="bold" />
              Cancel
            </Button>
          )}
        </div>

        {/* Keyboard Shortcuts Hint */}
        <p className="text-xs text-center text-gray-400">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">⌘K</kbd> focus •{" "}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">⌘↵</kbd> search •{" "}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px]">Esc</kbd> clear
        </p>
      </CardContent>
    </Card>
  );
}
