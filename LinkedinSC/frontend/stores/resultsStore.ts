/**
 * Zustand Store for Search Results
 *
 * Manages search results state with sessionStorage persistence.
 * Supports multi-query aggregation with URL-based deduplication.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UnifiedResult, RawSearchResponse, AggregatedResult, AggregatedMetadata } from '@/lib/api';

// Store state interface
interface ResultsState {
  results: AggregatedResult[] | null;
  aggregatedMetadata: AggregatedMetadata | null;
  error: string | null;
  isLoading: boolean;
  /** Timestamp of the original search when loaded from history (null for fresh searches) */
  historyTimestamp: number | null;
}

// Store actions interface
interface ResultsActions {
  /** Append results with deduplication (primary method for searches) */
  appendResults: (results: UnifiedResult[], metadata: RawSearchResponse['metadata'], query: string) => void;
  /** Legacy: Replace all results (for backward compatibility) */
  setResults: (results: UnifiedResult[], metadata: RawSearchResponse['metadata'], query: string) => void;
  /** Load results from history (sets historyTimestamp) */
  loadFromHistory: (results: UnifiedResult[], metadata: RawSearchResponse['metadata'], query: string, timestamp: number) => void;
  setError: (error: string) => void;
  setLoading: (isLoading: boolean) => void;
  clearResults: () => void;
}

// Combined store interface
type ResultsStore = ResultsState & ResultsActions;

// Initial state values
const initialState: ResultsState = {
  results: null,
  aggregatedMetadata: null,
  error: null,
  isLoading: false,
  historyTimestamp: null,
};

/**
 * Deduplicate results by URL, merging source queries for duplicates
 */
function deduplicateResults(
  existing: AggregatedResult[],
  incoming: UnifiedResult[],
  query: string
): AggregatedResult[] {
  const resultMap = new Map<string, AggregatedResult>();

  // Add existing results to map
  existing.forEach((result) => {
    resultMap.set(result.url, { ...result });
  });

  // Process incoming results
  incoming.forEach((result) => {
    const existingResult = resultMap.get(result.url);

    if (existingResult) {
      // Merge: add query to sourceQueries if not already present
      if (!existingResult.sourceQueries.includes(query)) {
        existingResult.sourceQueries = [...existingResult.sourceQueries, query];
      }
    } else {
      // New result: create aggregated version
      resultMap.set(result.url, {
        ...result,
        sourceQueries: [query],
        firstSeenAt: Date.now(),
      });
    }
  });

  return Array.from(resultMap.values());
}

/**
 * Aggregate metadata across multiple queries
 */
function aggregateMetadata(
  existing: AggregatedMetadata | null,
  newMeta: RawSearchResponse['metadata'],
  query: string,
  rawResultCount: number,
  uniqueResultCount: number
): AggregatedMetadata {
  if (!existing) {
    return {
      totalUniqueResults: uniqueResultCount,
      totalRawResults: rawResultCount,
      queryCount: 1,
      queries: [query],
      totalTimeSeconds: newMeta.time_taken_seconds,
      totalPagesFetched: newMeta.pages_fetched,
    };
  }

  return {
    totalUniqueResults: uniqueResultCount,
    totalRawResults: existing.totalRawResults + rawResultCount,
    queryCount: existing.queries.includes(query) ? existing.queryCount : existing.queryCount + 1,
    queries: existing.queries.includes(query) ? existing.queries : [...existing.queries, query],
    totalTimeSeconds: existing.totalTimeSeconds + newMeta.time_taken_seconds,
    totalPagesFetched: existing.totalPagesFetched + newMeta.pages_fetched,
  };
}

/**
 * Convert UnifiedResult[] to AggregatedResult[] for initial results
 */
function toAggregatedResults(results: UnifiedResult[], query: string): AggregatedResult[] {
  return results.map((r) => ({
    ...r,
    sourceQueries: [query],
    firstSeenAt: Date.now(),
  }));
}

// Create the store with sessionStorage persistence
export const useResultsStore = create<ResultsStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Append results with deduplication (clears historyTimestamp for fresh searches)
      appendResults: (results, metadata, query) => {
        const state = get();
        const existingResults = state.results || [];

        const deduplicated = deduplicateResults(existingResults, results, query);
        const newMetadata = aggregateMetadata(
          state.aggregatedMetadata,
          metadata,
          query,
          results.length,
          deduplicated.length
        );

        set({
          results: deduplicated,
          aggregatedMetadata: newMetadata,
          error: null,
          isLoading: false,
          historyTimestamp: null, // Fresh search clears history indicator
        });
      },

      // Replace all results (legacy behavior, still uses aggregated types)
      setResults: (results, metadata, query) => {
        const aggregated = toAggregatedResults(results, query);

        set({
          results: aggregated,
          aggregatedMetadata: {
            totalUniqueResults: aggregated.length,
            totalRawResults: results.length,
            queryCount: 1,
            queries: [query],
            totalTimeSeconds: metadata.time_taken_seconds,
            totalPagesFetched: metadata.pages_fetched,
          },
          error: null,
          isLoading: false,
          historyTimestamp: null,
        });
      },

      // Load results from history (sets historyTimestamp for "Results from X ago" indicator)
      loadFromHistory: (results, metadata, query, timestamp) => {
        const aggregated = toAggregatedResults(results, query);

        set({
          results: aggregated,
          aggregatedMetadata: {
            totalUniqueResults: aggregated.length,
            totalRawResults: results.length,
            queryCount: 1,
            queries: [query],
            totalTimeSeconds: metadata.time_taken_seconds,
            totalPagesFetched: metadata.pages_fetched,
          },
          error: null,
          isLoading: false,
          historyTimestamp: timestamp,
        });
      },

      setError: (error) =>
        set({
          error,
          results: null,
          aggregatedMetadata: null,
          isLoading: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      clearResults: () => set(initialState),
    }),
    {
      name: 'search-results-session',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist these fields (not isLoading)
      partialize: (state) => ({
        results: state.results,
        aggregatedMetadata: state.aggregatedMetadata,
        error: state.error,
        historyTimestamp: state.historyTimestamp,
      }),
    }
  )
);

// Export types for external use
export type { ResultsState, ResultsActions, ResultsStore };
