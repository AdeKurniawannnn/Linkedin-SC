"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { toast } from "sonner";

export interface SavedSearchState {
  baseQuery: string;
  activePresetIds: string[];
  activeLocationIds: string[];
  country: string;
  language: string;
  maxResults: number;
}

export interface SavedSearchInput {
  name: string;
  description: string;
  tags: string[];
  state: SavedSearchState;
}

/**
 * Hook for Convex-backed saved searches
 * Provides real-time sync and persistent storage
 */
export function useConvexSavedSearches() {
  // Queries
  const searches = useQuery(api.savedSearches.list);
  const recentSearches = useQuery(api.savedSearches.getRecent, { limit: 5 });
  const mostUsedSearches = useQuery(api.savedSearches.getMostUsed, { limit: 5 });

  // Mutations
  const addMutation = useMutation(api.savedSearches.add);
  const updateMutation = useMutation(api.savedSearches.update);
  const removeMutation = useMutation(api.savedSearches.remove);
  const recordUsageMutation = useMutation(api.savedSearches.recordUsage);

  // Add search
  const addSearch = async (search: SavedSearchInput) => {
    try {
      const id = await addMutation(search);
      toast.success("Search saved", { description: search.name });
      return id;
    } catch (error) {
      console.error("Failed to save search:", error);
      toast.error("Failed to save search");
      return null;
    }
  };

  // Update search
  const updateSearch = async (
    id: Id<"savedSearches">,
    updates: Partial<Omit<SavedSearchInput, "state"> & { state?: SavedSearchState }>
  ) => {
    try {
      await updateMutation({ id, ...updates });
      toast.success("Search updated");
    } catch (error) {
      console.error("Failed to update search:", error);
      toast.error("Failed to update search");
    }
  };

  // Delete search
  const deleteSearch = async (id: Id<"savedSearches">) => {
    try {
      await removeMutation({ id });
      toast.success("Search deleted");
    } catch (error) {
      console.error("Failed to delete search:", error);
      toast.error("Failed to delete search");
    }
  };

  // Load search into query builder
  const loadSearch = async (id: Id<"savedSearches">) => {
    const search = searches?.find((s) => s._id === id);
    if (!search) {
      toast.error("Search not found");
      return;
    }

    // Load state into query builder store
    useQueryBuilderStore.setState({
      baseQuery: search.state.baseQuery,
      activePresetIds: search.state.activePresetIds,
      activeLocationIds: search.state.activeLocationIds,
      country: search.state.country,
      language: search.state.language,
      maxResults: search.state.maxResults,
    });

    // Record usage
    try {
      await recordUsageMutation({ id });
    } catch (error) {
      console.error("Failed to record usage:", error);
    }

    toast.success("Search loaded", {
      description: search.name,
    });
  };

  // Get search by ID
  const getSearchById = (id: Id<"savedSearches">) => {
    return searches?.find((search) => search._id === id);
  };

  // Get recent searches
  const getRecentSearches = (limit = 5) => {
    return recentSearches?.slice(0, limit) ?? [];
  };

  // Get most used searches
  const getMostUsedSearches = (limit = 5) => {
    return mostUsedSearches?.slice(0, limit) ?? [];
  };

  return {
    // State
    searches: searches ?? [],
    isLoading: searches === undefined,

    // Actions
    addSearch,
    updateSearch,
    deleteSearch,
    loadSearch,
    getSearchById,
    getRecentSearches,
    getMostUsedSearches,
  };
}
