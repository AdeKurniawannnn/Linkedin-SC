"use client";

import { useState } from "react";
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
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { searchRaw, type RawSearchResponse } from "@/lib/api";
import { SpinnerGap, MagnifyingGlass } from "@phosphor-icons/react";

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

// Country options
const COUNTRY_OPTIONS = [
  { value: "id", label: "Indonesia" },
  { value: "sg", label: "Singapore" },
  { value: "my", label: "Malaysia" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "au", label: "Australia" },
  { value: "in", label: "India" },
  { value: "ph", label: "Philippines" },
  { value: "th", label: "Thailand" },
  { value: "vn", label: "Vietnam" },
];

// Language options
const LANGUAGE_OPTIONS = [
  { value: "id", label: "Indonesian" },
  { value: "en", label: "English" },
  { value: "ms", label: "Malay" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
];

export function UnifiedSearchForm({
  onSearchComplete,
  onSearchError,
}: UnifiedSearchFormProps) {
  const [isLoading, setIsLoading] = useState(false);

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
  const buildQuery = useQueryBuilderStore((state) => state.buildQuery);

  // Handle search submission
  const handleSearch = async () => {
    const query = buildQuery();

    if (!query.trim()) {
      onSearchError?.(new Error("Please enter a search query or select presets"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await searchRaw({
        query,
        country: country || "id",
        language: language || "id",
        max_results: maxResults || 50,
      });

      onSearchComplete?.(response);
    } catch (error) {
      console.error("Search error:", error);
      onSearchError?.(error instanceof Error ? error : new Error("Search failed"));
    } finally {
      setIsLoading(false);
    }
  };

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
            id="baseQuery"
            placeholder="Enter your search keywords..."
            value={baseQuery}
            onChange={(e) => setBaseQuery(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Keywords to search for (combined with selected presets)
          </p>
        </div>

        {/* Location Input */}
        <div className="space-y-2">
          <Label htmlFor="location">Location (Optional)</Label>
          <Input
            id="location"
            placeholder="e.g., Jakarta, Singapore"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Country and Language Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Country Select */}
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={country || "id"}
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
              value={language || "id"}
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
          <Input
            id="maxResults"
            type="number"
            min={1}
            max={200}
            value={maxResults || 50}
            onChange={handleMaxResultsChange}
          />
          <p className="text-xs text-gray-500">
            Maximum number of results to fetch (1-200)
          </p>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full"
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
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
