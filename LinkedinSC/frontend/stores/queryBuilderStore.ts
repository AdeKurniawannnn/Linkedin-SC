/**
 * Zustand Store for LinkedIn Query Builder
 *
 * Simplified architecture with:
 * - Configurable presets loaded from config file
 * - Multi-select preset toggles (multiple can be active)
 * - buildQuery() function that composes the final query string
 */

import { create } from 'zustand';
import { QUERY_PRESETS, buildQueryFromPresets } from '@/config/queryPresets';

// Store state interface
interface QueryBuilderState {
  baseQuery: string;
  activePresetIds: string[];
  location: string;
  country: string;
  language: string;
  maxResults: number;
}

// Store actions interface
interface QueryBuilderActions {
  setBaseQuery: (query: string) => void;
  togglePreset: (id: string) => void;
  clearPresets: () => void;
  setLocation: (location: string) => void;
  setCountry: (country: string) => void;
  setLanguage: (language: string) => void;
  setMaxResults: (count: number) => void;
  buildQuery: () => string;
  resetAll: () => void;
}

// Combined store interface
type QueryBuilderStore = QueryBuilderState & QueryBuilderActions;

// Initial state values
const initialState: QueryBuilderState = {
  baseQuery: '',
  activePresetIds: [],
  location: '',
  country: '',
  language: 'en',
  maxResults: 10,
};

// Create the store
export const useQueryBuilderStore = create<QueryBuilderStore>((set, get) => ({
  // Initial state
  ...initialState,

  // Actions
  setBaseQuery: (query) => set({ baseQuery: query }),

  togglePreset: (id) =>
    set((state) => {
      const isActive = state.activePresetIds.includes(id);
      return {
        activePresetIds: isActive
          ? state.activePresetIds.filter((presetId) => presetId !== id)
          : [...state.activePresetIds, id],
      };
    }),

  clearPresets: () => set({ activePresetIds: [] }),

  setLocation: (location) => set({ location }),

  setCountry: (country) => set({ country }),

  setLanguage: (language) => set({ language }),

  setMaxResults: (count) => set({ maxResults: count }),

  buildQuery: () => {
    const state = get();
    const parts: string[] = [];

    // 1. Add base query
    if (state.baseQuery.trim()) {
      parts.push(state.baseQuery.trim());
    }

    // 2. Add active presets using the config helper
    const presetQuery = buildQueryFromPresets(state.activePresetIds);
    if (presetQuery) {
      parts.push(presetQuery);
    }

    // 3. Add location (if specified)
    if (state.location.trim()) {
      parts.push(state.location.trim());
    }

    // Compose final query
    return parts.join(' ').trim();
  },

  resetAll: () => set(initialState),
}));

// Export types for external use
export type { QueryBuilderState, QueryBuilderActions, QueryBuilderStore };

// Re-export preset helpers for convenience
export { QUERY_PRESETS, buildQueryFromPresets };
