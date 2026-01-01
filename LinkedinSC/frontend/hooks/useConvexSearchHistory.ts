"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { toast } from "sonner";
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
  const storageStats = useQuery(api.searchHistory.getStorageStats);

  // Mutations
  const addMutation = useMutation(api.searchHistory.add);
  const removeMutation = useMutation(api.searchHistory.remove);
  const clearAllMutation = useMutation(api.searchHistory.clearAll);
  const compressMutation = useMutation(api.searchHistory.compressOldEntries);
  const pruneMutation = useMutation(api.searchHistory.pruneOldest);

  // Add entry
  const addEntry = async (query: SearchHistoryQuery, response: RawSearchResponse) => {
    const entry = {
      query,
      results: response.results,
      metadata: response.metadata,
      totalResults: response.total_results,
      sizeBytes: calculateEntrySize({
        query,
        results: response.results,
        metadata: response.metadata,
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

  return {
    // State
    entries: entries ?? [],
    isLoading: entries === undefined,
    totalSizeBytes: storageStats?.used ?? 0,
    maxSizeBytes: storageStats?.max ?? 4 * 1024 * 1024,

    // Actions
    addEntry,
    deleteEntry,
    clearHistory,
    getEntryById,
    getRecentEntries,
    searchHistory,
    getStorageInfo,
    pruneOldEntries,
    exportToCSV,
    downloadCSV,
    loadQueryToBuilder,
  };
}
