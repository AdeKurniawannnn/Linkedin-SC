/**
 * Zustand Store for LinkedIn Query Builder
 *
 * Simplified architecture with:
 * - Configurable presets loaded from config file
 * - Multi-select preset toggles (multiple can be active)
 * - Single-select for content_type category (site: operator limitation)
 * - buildQuery() function that composes the final query string
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { QUERY_PRESETS, PRESET_CATEGORIES, buildQueryFromPresets, getPresetById } from '@/config/queryPresets';
import { buildLocationQuery } from '@/config/locationPresets';

// Store state interface
interface QueryBuilderState {
  baseQuery: string;
  activePresetIds: string[];
  activeLocationIds: string[];
  location: string; // @deprecated - use activeLocationIds instead
  country: string;
  language: string;
  maxResults: number;
}

// Store actions interface
interface QueryBuilderActions {
  setBaseQuery: (query: string) => void;
  togglePreset: (id: string) => void;
  clearPresets: () => void;
  toggleLocation: (id: string) => void;
  clearLocations: () => void;
  setLocation: (location: string) => void; // @deprecated - use toggleLocation instead
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
  activeLocationIds: [],
  location: '',
  country: '',
  language: 'en',
  maxResults: 10,
};

// Create the store with sessionStorage persistence
export const useQueryBuilderStore = create<QueryBuilderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      setBaseQuery: (query) => set({ baseQuery: query }),

      togglePreset: (id) =>
        set((state) => {
          const preset = getPresetById(id);
          const isActive = state.activePresetIds.includes(id);

          // If preset not found in built-in presets, it's a custom preset - use multi-select
          if (!preset) {
            return {
              activePresetIds: isActive
                ? state.activePresetIds.filter((presetId) => presetId !== id)
                : [...state.activePresetIds, id],
            };
          }

          const category = preset.category;
          const categoryConfig = PRESET_CATEGORIES[category];

          // Handle single-select categories
          if (categoryConfig.selectionType === 'single') {
            if (isActive) {
              // Deselect the current preset
              return {
                activePresetIds: state.activePresetIds.filter((presetId) => presetId !== id),
              };
            } else {
              // Deselect any other preset in the same category, then select this one
              const otherPresetsInCategory = QUERY_PRESETS
                .filter((p) => p.category === category && p.id !== id)
                .map((p) => p.id);

              const filteredPresets = state.activePresetIds.filter(
                (presetId) => !otherPresetsInCategory.includes(presetId)
              );

              return {
                activePresetIds: [...filteredPresets, id],
              };
            }
          }

          // Handle multi-select categories (default behavior)
          return {
            activePresetIds: isActive
              ? state.activePresetIds.filter((presetId) => presetId !== id)
              : [...state.activePresetIds, id],
          };
        }),

      clearPresets: () => set({ activePresetIds: [] }),

      toggleLocation: (id) =>
        set((state) => ({
          activeLocationIds: state.activeLocationIds.includes(id)
            ? state.activeLocationIds.filter((locId) => locId !== id)
            : [...state.activeLocationIds, id],
        })),

      clearLocations: () => set({ activeLocationIds: [] }),

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

        // 2. Add active built-in presets using the config helper
        const presetQuery = buildQueryFromPresets(state.activePresetIds);
        if (presetQuery) {
          parts.push(presetQuery);
        }

        // 3. Custom presets are now stored in Convex
        // Their fragments are added by the component using useConvexCustomPresets hook
        // The activePresetIds may contain Convex IDs for custom presets

        // 4. Add location presets (new hierarchical system)
        const locationQuery = buildLocationQuery(state.activeLocationIds);
        if (locationQuery) {
          parts.push(locationQuery);
        }

        // 5. Add legacy location string (deprecated, for backward compatibility)
        if (state.location.trim()) {
          parts.push(state.location.trim());
        }

        // Compose final query
        return parts.join(' ').trim();
      },

      resetAll: () => set(initialState),
    }),
    {
      name: 'query-builder-session',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist state fields, not actions
      partialize: (state) => ({
        baseQuery: state.baseQuery,
        activePresetIds: state.activePresetIds,
        activeLocationIds: state.activeLocationIds,
        location: state.location,
        country: state.country,
        language: state.language,
        maxResults: state.maxResults,
      }),
    }
  )
);

// Export types for external use
export type { QueryBuilderState, QueryBuilderActions, QueryBuilderStore };

// Re-export preset helpers for convenience
export { QUERY_PRESETS, buildQueryFromPresets };
