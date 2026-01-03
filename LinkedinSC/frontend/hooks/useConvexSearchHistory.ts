"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { useResultsStore } from "@/stores/resultsStore";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { calculateEntrySize } from "@/lib/utils/storageUtils";
import type { UnifiedResult, RawSearchResponse } from "@/lib/api";

export interface SearchHistoryQuery {
  baseQuery: string;
  activePresetIds: string[];
  activeLocationIds: string[];
  country: string;
  language: string;
  maxResults: number;
  composedQuery: string;
}

/**
 * Hook for Convex-backed search history
 * Provides real-time sync and persistent storage
 */
export function useConvexSearchHistory() {
  // Queries
  const entries = useQuery(api.searchHistory.list, { limit: 50 });
  const starredEntries = useQuery(api.searchHistory.listStarred, { limit: 50 });
  const storageStats = useQuery(api.searchHistory.getStorageStats);

  // Mutations
  const addMutation = useMutation(api.searchHistory.add);
  const removeMutation = useMutation(api.searchHistory.remove);
  const removeManyMutation = useMutation(api.searchHistory.removeMany);
  const clearAllMutation = useMutation(api.searchHistory.clearAll);
  const compressMutation = useMutation(api.searchHistory.compressOldEntries);
  const pruneMutation = useMutation(api.searchHistory.pruneOldest);
  const toggleStarMutation = useMutation(api.searchHistory.toggleStar);

  // Add entry
  const addEntry = async (query: SearchHistoryQuery, response: RawSearchResponse) => {
    // Extend metadata with max_results from query (required by Convex schema)
    const metadata = {
      ...response.metadata,
      max_results: query.maxResults,
    };

    const entry = {
      query,
      results: response.results,
      metadata,
      totalResults: response.total_results,
      sizeBytes: calculateEntrySize({
        query,
        results: response.results,
        metadata,
        totalResults: response.total_results,
      }),
    };

    try {
      await addMutation(entry);
    } catch (error) {
      console.error("Failed to add search history:", error);
      toast.error("Failed to save search to history");
    }
  };

  // Delete entry
  const deleteEntry = async (id: Id<"searchHistory">) => {
    try {
      await removeMutation({ id });
    } catch (error) {
      console.error("Failed to delete history entry:", error);
      toast.error("Failed to delete history entry");
    }
  };

  // Clear all history
  const clearHistory = async () => {
    try {
      await clearAllMutation();
      toast.success("Search history cleared");
    } catch (error) {
      console.error("Failed to clear history:", error);
      toast.error("Failed to clear history");
    }
  };

  // Get entry by ID
  const getEntryById = (id: Id<"searchHistory">) => {
    return entries?.find((entry) => entry._id === id);
  };

  // Get recent entries (already sorted by query)
  const getRecentEntries = (limit = 50) => {
    return entries?.slice(0, limit) ?? [];
  };

  // Search history by term
  const searchHistory = (searchTerm: string) => {
    if (!entries) return [];
    const term = searchTerm.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.query.composedQuery.toLowerCase().includes(term) ||
        entry.query.baseQuery.toLowerCase().includes(term)
    );
  };

  // Storage info
  const getStorageInfo = () => {
    return storageStats ?? { used: 0, max: 4 * 1024 * 1024, percentage: 0, count: 0 };
  };

  // Prune old entries
  const pruneOldEntries = async () => {
    try {
      const result = await pruneMutation({ targetPercentage: 70 });
      if (result.removed > 0) {
        toast.info(`Removed ${result.removed} old history entries`);
      }
      return result.removed;
    } catch (error) {
      console.error("Failed to prune entries:", error);
      return 0;
    }
  };

  // Export to CSV
  const exportToCSV = (entryIds?: Id<"searchHistory">[]) => {
    const entriesToExport = entryIds
      ? entries?.filter((e) => entryIds.includes(e._id))
      : entries;

    if (!entriesToExport) return "";

    const headers = [
      "Search Date",
      "Query",
      "Country",
      "Language",
      "Max Results",
      "Total Results",
      "Time (seconds)",
      "Pages Fetched",
      "Result #",
      "Type",
      "Title",
      "URL",
      "Description",
    ];

    const rows: string[] = [headers.join(",")];

    const escapeCSV = (value: string | number | undefined): string => {
      if (value === undefined || value === null) return "";
      const str = String(value);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    entriesToExport.forEach((entry) => {
      const baseFields = [
        new Date(entry.timestamp).toISOString(),
        entry.query.composedQuery,
        entry.query.country,
        entry.query.language,
        entry.query.maxResults,
        entry.totalResults,
        entry.metadata.time_taken_seconds.toFixed(2),
        entry.metadata.pages_fetched,
      ];

      if (entry.compressed || entry.results.length === 0) {
        rows.push(
          [...baseFields, "-", "-", "[Results compressed]", "-", "-"]
            .map(escapeCSV)
            .join(",")
        );
      } else {
        entry.results.forEach((result, index) => {
          rows.push(
            [
              ...baseFields,
              index + 1,
              result.type,
              result.title,
              result.url,
              result.description.replace(/\n/g, " "),
            ]
              .map(escapeCSV)
              .join(",")
          );
        });
      }
    });

    return rows.join("\n");
  };

  // Download CSV
  const downloadCSV = (entryIds?: Id<"searchHistory">[]) => {
    const csv = exportToCSV(entryIds);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkedin-search-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("History exported to CSV");
  };

  // Load query to builder
  const loadQueryToBuilder = (id: Id<"searchHistory">) => {
    const entry = getEntryById(id);
    if (!entry) {
      toast.error("History entry not found");
      return;
    }

    useQueryBuilderStore.setState({
      baseQuery: entry.query.baseQuery,
      activePresetIds: entry.query.activePresetIds,
      activeLocationIds: entry.query.activeLocationIds,
      country: entry.query.country,
      language: entry.query.language,
      maxResults: entry.query.maxResults,
    });

    toast.success("Query loaded", {
      description: "Click Search to re-run this query",
    });
  };

  /**
   * Helper function to extract and format entry data for store loading.
   *
   * Encapsulates the data extraction logic to reduce coupling between this hook
   * and the store implementations. Returns structured data that can be passed
   * to store actions.
   *
   * Note: This hook still uses direct store access via getState() and setState()
   * because it needs to:
   * 1. Load results imperatively without triggering component re-renders
   * 2. Restore full query builder state from historical data
   * 3. Coordinate state updates across multiple stores atomically
   *
   * This is an acceptable use of direct store access in a hook that acts as
   * a "controller" coordinating multiple stores for a specific feature (search history).
   *
   * @param entry - The search history entry from Convex
   * @returns Formatted data ready to be passed to store actions
   */
  const getHistoryEntryData = (entry: NonNullable<ReturnType<typeof getEntryById>>) => {
    // Convert stored results to expected format
    const metadata = {
      country: entry.metadata.country,
      language: entry.metadata.language,
      pages_fetched: entry.metadata.pages_fetched,
      time_taken_seconds: entry.metadata.time_taken_seconds,
    };

    // Extract query builder state
    const queryBuilderState = {
      baseQuery: entry.query.baseQuery,
      activePresetIds: entry.query.activePresetIds,
      activeLocationIds: entry.query.activeLocationIds,
      country: entry.query.country,
      language: entry.query.language,
      maxResults: entry.query.maxResults,
    };

    return {
      results: entry.results as UnifiedResult[],
      metadata,
      composedQuery: entry.query.composedQuery,
      timestamp: entry.timestamp,
      queryBuilderState,
    };
  };

  /**
   * Load cached results from history (without re-running the search).
   *
   * Directly accesses Zustand stores using getState() and setState() to imperatively
   * load historical search data. This approach is necessary because:
   * - We need to coordinate updates across ResultsStore and QueryBuilderStore atomically
   * - The operation is user-triggered (not reactive) and shouldn't cause unnecessary re-renders
   * - We're restoring a complete state snapshot from history, not reacting to state changes
   */
  const loadResultsFromHistory = (id: Id<"searchHistory">) => {
    const entry = getEntryById(id);
    if (!entry) {
      toast.error("History entry not found");
      return;
    }

    // Check if results are compressed
    if (entry.compressed || entry.results.length === 0) {
      toast.warning("Results were compressed", {
        description: "Re-run the search for full data",
      });
      // Still restore query so user can re-run
      loadQueryToBuilder(id);
      return;
    }

    // Extract formatted data using helper function
    const { results, metadata, composedQuery, timestamp, queryBuilderState } =
      getHistoryEntryData(entry);

    // Load into results store
    useResultsStore.getState().loadFromHistory(
      results,
      metadata,
      composedQuery,
      timestamp
    );

    // Restore query builder state
    useQueryBuilderStore.setState(queryBuilderState);

    toast.success("Loaded search from history", {
      description: formatDistanceToNow(new Date(timestamp), { addSuffix: true }),
    });
  };

  // Toggle star status
  const toggleStar = async (id: Id<"searchHistory">) => {
    try {
      const result = await toggleStarMutation({ id });
      toast.success(result.starred ? "Starred" : "Unstarred");
    } catch (error) {
      console.error("Failed to toggle star:", error);
      toast.error("Failed to update star status");
    }
  };

  // Get starred entries
  const getStarredEntries = () => {
    return starredEntries ?? [];
  };

  // Delete multiple entries
  const deleteMany = async (ids: Id<"searchHistory">[]) => {
    try {
      const result = await removeManyMutation({ ids });
      toast.success(`Deleted ${result.deleted} entries`);
      return result.deleted;
    } catch (error) {
      console.error("Failed to delete entries:", error);
      toast.error("Failed to delete entries");
      return 0;
    }
  };

  return {
    // State
    entries: entries ?? [],
    starredEntries: starredEntries ?? [],
    isLoading: entries === undefined,
    totalSizeBytes: storageStats?.used ?? 0,
    maxSizeBytes: storageStats?.max ?? 4 * 1024 * 1024,

    // Actions
    addEntry,
    deleteEntry,
    deleteMany,
    clearHistory,
    getEntryById,
    getRecentEntries,
    getStarredEntries,
    searchHistory,
    getStorageInfo,
    pruneOldEntries,
    exportToCSV,
    downloadCSV,
    loadQueryToBuilder,
    loadResultsFromHistory,
    toggleStar,
  };
}
