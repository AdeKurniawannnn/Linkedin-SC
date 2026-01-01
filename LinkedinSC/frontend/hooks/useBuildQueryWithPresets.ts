"use client";

import { useMemo } from "react";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { useConvexCustomPresets } from "./useConvexCustomPresets";

/**
 * Hook that builds the complete query including custom preset fragments from Convex.
 * 
 * The queryBuilderStore.buildQuery() handles built-in presets and locations.
 * This hook adds custom preset fragments from Convex.
 */
export function useBuildQueryWithPresets() {
  const baseQuery = useQueryBuilderStore((state) => state.buildQuery());
  const activePresetIds = useQueryBuilderStore((state) => state.activePresetIds);
  const { presets: customPresets } = useConvexCustomPresets();

  const fullQuery = useMemo(() => {
    // Get fragments from active custom presets
    const customFragments = activePresetIds
      .map((id) => customPresets.find((p) => p._id === id))
      .filter((preset) => preset !== undefined)
      .map((preset) => preset!.queryFragment);

    if (customFragments.length === 0) {
      return baseQuery;
    }

    // Combine base query with custom fragments
    const parts = [baseQuery, ...customFragments].filter((p) => p.trim());
    return parts.join(" ").trim();
  }, [baseQuery, activePresetIds, customPresets]);

  return fullQuery;
}
