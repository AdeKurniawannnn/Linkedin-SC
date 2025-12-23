/**
 * Zustand Store for LinkedIn Query Builder
 *
 * State management untuk:
 * - Site filters (profile, posts, jobs, company)
 * - Search modifiers (exclude, exact match, date range)
 * - Additional filters (location, company, position)
 * - Query string generation
 */

import { create } from 'zustand';

// Site filter types
export type SiteFilterType = 'all' | 'profile' | 'posts' | 'jobs' | 'company';

// Search modifier state
interface SearchModifiers {
  mustHaveKeywords: string[];      // Keywords yang harus ada
  excludeKeywords: string[];        // Keywords yang di-exclude (-)
  exactMatchPhrases: string[];      // Exact match phrases ("...")
  dateRange: {
    from: string | null;            // Date from (YYYY-MM-DD)
    to: string | null;              // Date to (YYYY-MM-DD)
  };
  useOrOperator: boolean;           // Use OR between keywords
  useWildcard: boolean;             // Use wildcard (*)
}

// Additional filters state
interface AdditionalFilters {
  location: string;                 // e.g., "Jakarta", "Singapore"
  company: string;                  // e.g., "Google", "Microsoft"
  position: string;                 // e.g., "Software Engineer"
  experienceLevel: string;          // e.g., "Senior", "Junior"
  industry: string;                 // e.g., "Technology", "Finance"
}

// Saved query type
export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  queryString: string;
  siteFilter: SiteFilterType;
  modifiers: SearchModifiers;
  additionalFilters: AdditionalFilters;
  createdAt: string;
  tags?: string[];
}

// Main store interface
interface QueryBuilderStore {
  // State
  queryString: string;              // Raw query string from input
  siteFilter: SiteFilterType;       // Site filter selection
  modifiers: SearchModifiers;       // Google search modifiers
  additionalFilters: AdditionalFilters; // Additional filters
  savedQueries: SavedQuery[];       // List of saved queries

  // Actions - Query String
  setQueryString: (query: string) => void;
  buildQueryString: () => string;   // Generate query from all filters
  parseQueryString: (query: string) => void; // Parse query to update filters

  // Actions - Site Filter
  setSiteFilter: (filter: SiteFilterType) => void;

  // Actions - Search Modifiers
  addMustHaveKeyword: (keyword: string) => void;
  removeMustHaveKeyword: (keyword: string) => void;
  addExcludeKeyword: (keyword: string) => void;
  removeExcludeKeyword: (keyword: string) => void;
  addExactMatchPhrase: (phrase: string) => void;
  removeExactMatchPhrase: (phrase: string) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  toggleOrOperator: () => void;
  toggleWildcard: () => void;

  // Actions - Additional Filters
  setLocation: (location: string) => void;
  setCompany: (company: string) => void;
  setPosition: (position: string) => void;
  setExperienceLevel: (level: string) => void;
  setIndustry: (industry: string) => void;

  // Actions - Saved Queries
  saveQuery: (name: string, description?: string, tags?: string[]) => void;
  loadQuery: (id: string) => void;
  deleteQuery: (id: string) => void;

  // Actions - Reset
  resetFilters: () => void;
  resetAll: () => void;
}

// Initial state
const initialModifiers: SearchModifiers = {
  mustHaveKeywords: [],
  excludeKeywords: [],
  exactMatchPhrases: [],
  dateRange: { from: null, to: null },
  useOrOperator: false,
  useWildcard: false,
};

const initialAdditionalFilters: AdditionalFilters = {
  location: '',
  company: '',
  position: '',
  experienceLevel: '',
  industry: '',
};

// Create store
export const useQueryBuilderStore = create<QueryBuilderStore>((set, get) => ({
  // Initial state
  queryString: '',
  siteFilter: 'all',
  modifiers: initialModifiers,
  additionalFilters: initialAdditionalFilters,
  savedQueries: [],

  // Query String Actions
  setQueryString: (query) => set({ queryString: query }),

  buildQueryString: () => {
    const state = get();
    const parts: string[] = [];

    // 1. Add must-have keywords first
    if (state.modifiers.mustHaveKeywords.length > 0) {
      const keywords = state.modifiers.useOrOperator
        ? state.modifiers.mustHaveKeywords.join(' OR ')
        : state.modifiers.mustHaveKeywords.join(' ');
      parts.push(keywords);
    }

    // 2. Add site filter (LinkedIn URL pattern)
    if (state.siteFilter !== 'all') {
      // Map siteFilter value to correct LinkedIn URL path
      const siteFilterMap: Record<SiteFilterType, string> = {
        all: '',
        profile: 'in',
        posts: 'posts',
        jobs: 'jobs',
        company: 'company',
      };

      const urlPath = siteFilterMap[state.siteFilter];
      if (urlPath) {
        parts.push(`linkedin.com/${urlPath}/`);
      }
    }

    // 3. Add exclude keywords
    state.modifiers.excludeKeywords.forEach((keyword) => {
      parts.push(`-${keyword}`);
    });

    // 4. Add exact match phrases
    state.modifiers.exactMatchPhrases.forEach((phrase) => {
      parts.push(`"${phrase}"`);
    });

    // 5. Add location
    if (state.additionalFilters.location) {
      parts.push(state.additionalFilters.location);
    }

    // 6. Add company
    if (state.additionalFilters.company) {
      parts.push(state.additionalFilters.company);
    }

    // 7. Add position
    if (state.additionalFilters.position) {
      parts.push(state.additionalFilters.position);
    }

    return parts.join(' ').trim();
  },

  parseQueryString: (query) => {
    // TODO: Implement query parsing logic
    // This will parse query string and update filters accordingly
    set({ queryString: query });
  },

  // Site Filter Actions
  setSiteFilter: (filter) => set({ siteFilter: filter }),

  // Search Modifiers Actions
  addMustHaveKeyword: (keyword) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        mustHaveKeywords: [...state.modifiers.mustHaveKeywords, keyword],
      },
    })),

  removeMustHaveKeyword: (keyword) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        mustHaveKeywords: state.modifiers.mustHaveKeywords.filter((k) => k !== keyword),
      },
    })),

  addExcludeKeyword: (keyword) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        excludeKeywords: [...state.modifiers.excludeKeywords, keyword],
      },
    })),

  removeExcludeKeyword: (keyword) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        excludeKeywords: state.modifiers.excludeKeywords.filter((k) => k !== keyword),
      },
    })),

  addExactMatchPhrase: (phrase) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        exactMatchPhrases: [...state.modifiers.exactMatchPhrases, phrase],
      },
    })),

  removeExactMatchPhrase: (phrase) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        exactMatchPhrases: state.modifiers.exactMatchPhrases.filter((p) => p !== phrase),
      },
    })),

  setDateRange: (from, to) =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        dateRange: { from, to },
      },
    })),

  toggleOrOperator: () =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        useOrOperator: !state.modifiers.useOrOperator,
      },
    })),

  toggleWildcard: () =>
    set((state) => ({
      modifiers: {
        ...state.modifiers,
        useWildcard: !state.modifiers.useWildcard,
      },
    })),

  // Additional Filters Actions
  setLocation: (location) =>
    set((state) => ({
      additionalFilters: { ...state.additionalFilters, location },
    })),

  setCompany: (company) =>
    set((state) => ({
      additionalFilters: { ...state.additionalFilters, company },
    })),

  setPosition: (position) =>
    set((state) => ({
      additionalFilters: { ...state.additionalFilters, position },
    })),

  setExperienceLevel: (experienceLevel) =>
    set((state) => ({
      additionalFilters: { ...state.additionalFilters, experienceLevel },
    })),

  setIndustry: (industry) =>
    set((state) => ({
      additionalFilters: { ...state.additionalFilters, industry },
    })),

  // Saved Queries Actions
  saveQuery: (name, description, tags) => {
    const state = get();
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name,
      description,
      queryString: state.buildQueryString(),
      siteFilter: state.siteFilter,
      modifiers: { ...state.modifiers },
      additionalFilters: { ...state.additionalFilters },
      createdAt: new Date().toISOString(),
      tags,
    };

    set((state) => ({
      savedQueries: [...state.savedQueries, newQuery],
    }));

    // Save to localStorage
    localStorage.setItem(
      'linkedinQueryBuilder_savedQueries',
      JSON.stringify([...get().savedQueries])
    );
  },

  loadQuery: (id) => {
    const state = get();
    const query = state.savedQueries.find((q) => q.id === id);
    if (query) {
      set({
        queryString: query.queryString,
        siteFilter: query.siteFilter,
        modifiers: query.modifiers,
        additionalFilters: query.additionalFilters,
      });
    }
  },

  deleteQuery: (id) => {
    set((state) => ({
      savedQueries: state.savedQueries.filter((q) => q.id !== id),
    }));

    // Update localStorage
    localStorage.setItem(
      'linkedinQueryBuilder_savedQueries',
      JSON.stringify(get().savedQueries)
    );
  },

  // Reset Actions
  resetFilters: () =>
    set({
      modifiers: initialModifiers,
      additionalFilters: initialAdditionalFilters,
      siteFilter: 'all',
    }),

  resetAll: () =>
    set({
      queryString: '',
      siteFilter: 'all',
      modifiers: initialModifiers,
      additionalFilters: initialAdditionalFilters,
    }),
}));
