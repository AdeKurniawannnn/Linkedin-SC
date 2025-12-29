/**
 * Zustand Store for Search Results
 *
 * Manages search results state with sessionStorage persistence.
 * Data survives page refresh but clears when the browser tab is closed.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UnifiedResult, RawSearchResponse } from '@/lib/api';

// Store state interface
interface ResultsState {
  results: UnifiedResult[] | null;
  metadata: RawSearchResponse['metadata'] | null;
  error: string | null;
  isLoading: boolean;
}

// Store actions interface
interface ResultsActions {
  setResults: (results: UnifiedResult[], metadata: RawSearchResponse['metadata']) => void;
  setError: (error: string) => void;
  setLoading: (isLoading: boolean) => void;
  clearResults: () => void;
}

// Combined store interface
type ResultsStore = ResultsState & ResultsActions;

// Initial state values
const initialState: ResultsState = {
  results: null,
  metadata: null,
  error: null,
  isLoading: false,
};

// Create the store with sessionStorage persistence
export const useResultsStore = create<ResultsStore>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,

      // Actions
      setResults: (results, metadata) =>
        set({
          results,
          metadata,
          error: null,
          isLoading: false,
        }),

      setError: (error) =>
        set({
          error,
          results: null,
          metadata: null,
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
        metadata: state.metadata,
        error: state.error,
      }),
    }
  )
);

// Export types for external use
export type { ResultsState, ResultsActions, ResultsStore };
