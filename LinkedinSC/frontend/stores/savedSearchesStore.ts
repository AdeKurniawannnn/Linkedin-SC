/**
 * Saved Searches Store
 *
 * Allows users to save entire query configurations for quick recall.
 * Persisted to localStorage for cross-session availability.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useQueryBuilderStore } from './queryBuilderStore';

export interface SavedSearchState {
  baseQuery: string;
  activePresetIds: string[];
  activeLocationIds: string[];
  country: string;
  language: string;
  maxResults: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  lastUsedAt: string;
  useCount: number;
  state: SavedSearchState;
}

interface SavedSearchesState {
  searches: SavedSearch[];
}

interface SavedSearchesActions {
  addSearch: (search: Omit<SavedSearch, 'id' | 'createdAt' | 'lastUsedAt' | 'useCount'>) => void;
  updateSearch: (id: string, updates: Partial<Omit<SavedSearch, 'id' | 'createdAt'>>) => void;
  deleteSearch: (id: string) => void;
  loadSearch: (id: string) => void;
  getSearchById: (id: string) => SavedSearch | undefined;
  getRecentSearches: (limit?: number) => SavedSearch[];
  getMostUsedSearches: (limit?: number) => SavedSearch[];
}

type SavedSearchesStore = SavedSearchesState & SavedSearchesActions;

// Generate unique ID
function generateId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useSavedSearchesStore = create<SavedSearchesStore>()(
  persist(
    (set, get) => ({
      searches: [],

      addSearch: (search) => {
        const newSearch: SavedSearch = {
          ...search,
          id: generateId(),
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          useCount: 0,
        };
        set((state) => ({
          searches: [...state.searches, newSearch],
        }));
      },

      updateSearch: (id, updates) => {
        set((state) => ({
          searches: state.searches.map((search) =>
            search.id === id
              ? {
                  ...search,
                  ...updates,
                }
              : search
          ),
        }));
      },

      deleteSearch: (id) => {
        set((state) => ({
          searches: state.searches.filter((search) => search.id !== id),
        }));
      },

      loadSearch: (id) => {
        const search = get().searches.find((s) => s.id === id);
        if (!search) return;

        // Load state into query builder store
        const queryBuilderStore = useQueryBuilderStore.getState();

        // Update query builder state
        useQueryBuilderStore.setState({
          baseQuery: search.state.baseQuery,
          activePresetIds: search.state.activePresetIds,
          activeLocationIds: search.state.activeLocationIds,
          country: search.state.country,
          language: search.state.language,
          maxResults: search.state.maxResults,
        });

        // Update usage stats
        set((state) => ({
          searches: state.searches.map((s) =>
            s.id === id
              ? {
                  ...s,
                  lastUsedAt: new Date().toISOString(),
                  useCount: s.useCount + 1,
                }
              : s
          ),
        }));
      },

      getSearchById: (id) => {
        return get().searches.find((search) => search.id === id);
      },

      getRecentSearches: (limit = 5) => {
        return [...get().searches]
          .sort(
            (a, b) =>
              new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
          )
          .slice(0, limit);
      },

      getMostUsedSearches: (limit = 5) => {
        return [...get().searches]
          .sort((a, b) => b.useCount - a.useCount)
          .slice(0, limit);
      },
    }),
    {
      name: 'linkedin-query-saved-searches',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searches: state.searches,
      }),
    }
  )
);

// Export types
export type { SavedSearchesState, SavedSearchesActions, SavedSearchesStore };
