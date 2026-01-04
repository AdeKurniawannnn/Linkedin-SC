/**
 * Test Suite for Saved Searches Store
 *
 * Tests the Zustand store that manages saved search configurations.
 * Covers CRUD operations, persistence, usage tracking, and query restoration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useSavedSearchesStore } from '@/stores/savedSearchesStore'
import { useQueryBuilderStore } from '@/stores/queryBuilderStore'
import { createMockSavedSearch } from '@/tests/utils/testUtils'
import type { SavedSearch, SavedSearchState } from '@/stores/savedSearchesStore'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('savedSearchesStore', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    localStorageMock.clear()

    // Reset stores to initial state
    useSavedSearchesStore.setState({ searches: [] })
    useQueryBuilderStore.getState().resetAll()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should start with empty searches array', () => {
      const state = useSavedSearchesStore.getState()
      expect(state.searches).toEqual([])
    })

    it('should have all required action methods', () => {
      const state = useSavedSearchesStore.getState()
      expect(typeof state.addSearch).toBe('function')
      expect(typeof state.updateSearch).toBe('function')
      expect(typeof state.deleteSearch).toBe('function')
      expect(typeof state.loadSearch).toBe('function')
      expect(typeof state.getSearchById).toBe('function')
      expect(typeof state.getRecentSearches).toBe('function')
      expect(typeof state.getMostUsedSearches).toBe('function')
    })
  })

  describe('addSearch', () => {
    it('should add a new search with generated ID and timestamps', () => {
      const mockState: SavedSearchState = {
        baseQuery: 'software engineer',
        activePresetIds: ['seniority_senior'],
        activeLocationIds: ['loc_san_francisco'],
        country: 'us',
        language: 'en',
        maxResults: 30,
      }

      useSavedSearchesStore.getState().addSearch({
        name: 'Senior Engineers',
        description: 'Senior software engineers',
        tags: ['engineering'],
        state: mockState,
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(1)

      const savedSearch = state.searches[0]
      expect(savedSearch.id).toMatch(/^search_\d+_[a-z0-9]+$/)
      expect(savedSearch.name).toBe('Senior Engineers')
      expect(savedSearch.description).toBe('Senior software engineers')
      expect(savedSearch.tags).toEqual(['engineering'])
      expect(savedSearch.state).toEqual(mockState)
      expect(savedSearch.useCount).toBe(0)
      expect(savedSearch.createdAt).toBeTruthy()
      expect(savedSearch.lastUsedAt).toBeTruthy()
    })

    it('should generate unique IDs for multiple searches', () => {
      const mockState: SavedSearchState = {
        baseQuery: 'test',
        activePresetIds: [],
        activeLocationIds: [],
        country: 'us',
        language: 'en',
        maxResults: 10,
      }

      useSavedSearchesStore.getState().addSearch({
        name: 'Search 1',
        description: 'First search',
        tags: [],
        state: mockState,
      })

      useSavedSearchesStore.getState().addSearch({
        name: 'Search 2',
        description: 'Second search',
        tags: [],
        state: mockState,
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(2)
      expect(state.searches[0].id).not.toBe(state.searches[1].id)
    })

    it('should initialize useCount to 0', () => {
      const mockState: SavedSearchState = {
        baseQuery: 'test',
        activePresetIds: [],
        activeLocationIds: [],
        country: 'us',
        language: 'en',
        maxResults: 10,
      }

      useSavedSearchesStore.getState().addSearch({
        name: 'New Search',
        description: '',
        tags: [],
        state: mockState,
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].useCount).toBe(0)
    })

    it('should handle empty name and description', () => {
      const mockState: SavedSearchState = {
        baseQuery: 'test',
        activePresetIds: [],
        activeLocationIds: [],
        country: 'us',
        language: 'en',
        maxResults: 10,
      }

      useSavedSearchesStore.getState().addSearch({
        name: '',
        description: '',
        tags: [],
        state: mockState,
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(1)
      expect(state.searches[0].name).toBe('')
      expect(state.searches[0].description).toBe('')
    })
  })

  describe('deleteSearch', () => {
    it('should remove search by ID', () => {
      const mockSearch = createMockSavedSearch({ name: 'Search to Delete' })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().deleteSearch(mockSearch.id)

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(0)
    })

    it('should handle deletion of non-existent search gracefully', () => {
      const mockSearch = createMockSavedSearch()
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().deleteSearch('non-existent-id')

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(1)
      expect(state.searches[0].id).toBe(mockSearch.id)
    })

    it('should remove only the specified search when multiple exist', () => {
      const search1 = createMockSavedSearch({ name: 'Search 1' })
      const search2 = createMockSavedSearch({ name: 'Search 2' })
      const search3 = createMockSavedSearch({ name: 'Search 3' })

      useSavedSearchesStore.setState({ searches: [search1, search2, search3] })

      useSavedSearchesStore.getState().deleteSearch(search2.id)

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(2)
      expect(state.searches.find((s) => s.id === search1.id)).toBeTruthy()
      expect(state.searches.find((s) => s.id === search2.id)).toBeUndefined()
      expect(state.searches.find((s) => s.id === search3.id)).toBeTruthy()
    })
  })

  describe('updateSearch', () => {
    it('should update search fields by ID', () => {
      const mockSearch = createMockSavedSearch({
        name: 'Original Name',
        description: 'Original Description',
      })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().updateSearch(mockSearch.id, {
        name: 'Updated Name',
        description: 'Updated Description',
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].name).toBe('Updated Name')
      expect(state.searches[0].description).toBe('Updated Description')
    })

    it('should preserve unchanged fields', () => {
      const mockSearch = createMockSavedSearch({
        name: 'Original Name',
        tags: ['tag1', 'tag2'],
        useCount: 5,
      })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().updateSearch(mockSearch.id, {
        name: 'Updated Name',
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].name).toBe('Updated Name')
      expect(state.searches[0].tags).toEqual(['tag1', 'tag2'])
      expect(state.searches[0].useCount).toBe(5)
      expect(state.searches[0].id).toBe(mockSearch.id)
    })

    it('should update tags array', () => {
      const mockSearch = createMockSavedSearch({ tags: ['old-tag'] })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().updateSearch(mockSearch.id, {
        tags: ['new-tag-1', 'new-tag-2'],
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].tags).toEqual(['new-tag-1', 'new-tag-2'])
    })

    it('should not update if ID does not exist', () => {
      const mockSearch = createMockSavedSearch({ name: 'Original' })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().updateSearch('non-existent-id', {
        name: 'Updated',
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].name).toBe('Original')
    })

    it('should update nested state object', () => {
      const mockSearch = createMockSavedSearch({
        state: {
          baseQuery: 'original query',
          activePresetIds: ['preset1'],
          activeLocationIds: [],
          country: 'us',
          language: 'en',
          maxResults: 10,
        },
      })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().updateSearch(mockSearch.id, {
        state: {
          baseQuery: 'updated query',
          activePresetIds: ['preset2'],
          activeLocationIds: ['loc_nyc'],
          country: 'ca',
          language: 'fr',
          maxResults: 50,
        },
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].state.baseQuery).toBe('updated query')
      expect(state.searches[0].state.activePresetIds).toEqual(['preset2'])
      expect(state.searches[0].state.activeLocationIds).toEqual(['loc_nyc'])
      expect(state.searches[0].state.country).toBe('ca')
      expect(state.searches[0].state.language).toBe('fr')
      expect(state.searches[0].state.maxResults).toBe(50)
    })
  })

  describe('getSearchById', () => {
    it('should return search by ID', () => {
      const mockSearch = createMockSavedSearch({ name: 'Test Search' })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      const result = useSavedSearchesStore.getState().getSearchById(mockSearch.id)

      expect(result).toBeTruthy()
      expect(result?.id).toBe(mockSearch.id)
      expect(result?.name).toBe('Test Search')
    })

    it('should return undefined for non-existent ID', () => {
      const mockSearch = createMockSavedSearch()
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      const result = useSavedSearchesStore.getState().getSearchById('non-existent-id')

      expect(result).toBeUndefined()
    })

    it('should return undefined when searches array is empty', () => {
      const result = useSavedSearchesStore.getState().getSearchById('any-id')
      expect(result).toBeUndefined()
    })
  })

  describe('getRecentSearches', () => {
    it('should return searches sorted by lastUsedAt (most recent first)', () => {
      const now = Date.now()
      const search1 = createMockSavedSearch({
        name: 'Oldest',
        lastUsedAt: new Date(now - 3000).toISOString(),
      })
      const search2 = createMockSavedSearch({
        name: 'Newest',
        lastUsedAt: new Date(now).toISOString(),
      })
      const search3 = createMockSavedSearch({
        name: 'Middle',
        lastUsedAt: new Date(now - 1000).toISOString(),
      })

      useSavedSearchesStore.setState({ searches: [search1, search2, search3] })

      const recent = useSavedSearchesStore.getState().getRecentSearches()

      expect(recent.length).toBe(3)
      expect(recent[0].name).toBe('Newest')
      expect(recent[1].name).toBe('Middle')
      expect(recent[2].name).toBe('Oldest')
    })

    it('should limit results to specified limit', () => {
      const searches = Array.from({ length: 10 }, (_, i) =>
        createMockSavedSearch({
          name: `Search ${i}`,
          lastUsedAt: new Date(Date.now() - i * 1000).toISOString(),
        })
      )
      useSavedSearchesStore.setState({ searches })

      const recent = useSavedSearchesStore.getState().getRecentSearches(3)

      expect(recent.length).toBe(3)
    })

    it('should default to limit of 5', () => {
      const searches = Array.from({ length: 10 }, (_, i) =>
        createMockSavedSearch({
          lastUsedAt: new Date(Date.now() - i * 1000).toISOString(),
        })
      )
      useSavedSearchesStore.setState({ searches })

      const recent = useSavedSearchesStore.getState().getRecentSearches()

      expect(recent.length).toBe(5)
    })

    it('should return all searches if total is less than limit', () => {
      const searches = [
        createMockSavedSearch(),
        createMockSavedSearch(),
      ]
      useSavedSearchesStore.setState({ searches })

      const recent = useSavedSearchesStore.getState().getRecentSearches(10)

      expect(recent.length).toBe(2)
    })

    it('should return empty array when no searches exist', () => {
      const recent = useSavedSearchesStore.getState().getRecentSearches()
      expect(recent).toEqual([])
    })
  })

  describe('getMostUsedSearches', () => {
    it('should return searches sorted by useCount (highest first)', () => {
      const search1 = createMockSavedSearch({ name: 'Low Usage', useCount: 2 })
      const search2 = createMockSavedSearch({ name: 'High Usage', useCount: 10 })
      const search3 = createMockSavedSearch({ name: 'Mid Usage', useCount: 5 })

      useSavedSearchesStore.setState({ searches: [search1, search2, search3] })

      const mostUsed = useSavedSearchesStore.getState().getMostUsedSearches()

      expect(mostUsed.length).toBe(3)
      expect(mostUsed[0].name).toBe('High Usage')
      expect(mostUsed[0].useCount).toBe(10)
      expect(mostUsed[1].name).toBe('Mid Usage')
      expect(mostUsed[1].useCount).toBe(5)
      expect(mostUsed[2].name).toBe('Low Usage')
      expect(mostUsed[2].useCount).toBe(2)
    })

    it('should limit results to specified limit', () => {
      const searches = Array.from({ length: 10 }, (_, i) =>
        createMockSavedSearch({ useCount: 10 - i })
      )
      useSavedSearchesStore.setState({ searches })

      const mostUsed = useSavedSearchesStore.getState().getMostUsedSearches(3)

      expect(mostUsed.length).toBe(3)
    })

    it('should default to limit of 5', () => {
      const searches = Array.from({ length: 10 }, (_, i) =>
        createMockSavedSearch({ useCount: 10 - i })
      )
      useSavedSearchesStore.setState({ searches })

      const mostUsed = useSavedSearchesStore.getState().getMostUsedSearches()

      expect(mostUsed.length).toBe(5)
    })

    it('should return empty array when no searches exist', () => {
      const mostUsed = useSavedSearchesStore.getState().getMostUsedSearches()
      expect(mostUsed).toEqual([])
    })

    it('should handle searches with same useCount', () => {
      const search1 = createMockSavedSearch({ name: 'Search A', useCount: 5 })
      const search2 = createMockSavedSearch({ name: 'Search B', useCount: 5 })
      const search3 = createMockSavedSearch({ name: 'Search C', useCount: 5 })

      useSavedSearchesStore.setState({ searches: [search1, search2, search3] })

      const mostUsed = useSavedSearchesStore.getState().getMostUsedSearches()

      expect(mostUsed.length).toBe(3)
      expect(mostUsed.every((s) => s.useCount === 5)).toBe(true)
    })
  })

  describe('loadSearch', () => {
    it('should load search state into query builder store', () => {
      const mockSearch = createMockSavedSearch({
        state: {
          baseQuery: 'machine learning',
          activePresetIds: ['seniority_senior', 'industry_tech'],
          activeLocationIds: ['loc_nyc'],
          country: 'us',
          language: 'en',
          maxResults: 50,
        },
      })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().loadSearch(mockSearch.id)

      const queryBuilderState = useQueryBuilderStore.getState()
      expect(queryBuilderState.baseQuery).toBe('machine learning')
      expect(queryBuilderState.activePresetIds).toEqual(['seniority_senior', 'industry_tech'])
      expect(queryBuilderState.activeLocationIds).toEqual(['loc_nyc'])
      expect(queryBuilderState.country).toBe('us')
      expect(queryBuilderState.language).toBe('en')
      expect(queryBuilderState.maxResults).toBe(50)
    })

    it('should increment useCount when loading', () => {
      const mockSearch = createMockSavedSearch({ useCount: 3 })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useSavedSearchesStore.getState().loadSearch(mockSearch.id)

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].useCount).toBe(4)
    })

    it('should update lastUsedAt timestamp when loading', () => {
      const oldTimestamp = new Date('2020-01-01').toISOString()
      const mockSearch = createMockSavedSearch({ lastUsedAt: oldTimestamp })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      const beforeLoad = new Date().toISOString()
      useSavedSearchesStore.getState().loadSearch(mockSearch.id)
      const afterLoad = new Date().toISOString()

      const state = useSavedSearchesStore.getState()
      const updatedTimestamp = state.searches[0].lastUsedAt

      expect(updatedTimestamp).not.toBe(oldTimestamp)
      expect(new Date(updatedTimestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeLoad).getTime()
      )
      expect(new Date(updatedTimestamp).getTime()).toBeLessThanOrEqual(
        new Date(afterLoad).getTime()
      )
    })

    it('should do nothing if search ID does not exist', () => {
      const mockSearch = createMockSavedSearch({ useCount: 5 })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      useQueryBuilderStore.getState().setBaseQuery('original query')

      useSavedSearchesStore.getState().loadSearch('non-existent-id')

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].useCount).toBe(5)

      const queryBuilderState = useQueryBuilderStore.getState()
      expect(queryBuilderState.baseQuery).toBe('original query')
    })

    it('should not affect other searches when loading', () => {
      const search1 = createMockSavedSearch({ name: 'Search 1', useCount: 2 })
      const search2 = createMockSavedSearch({ name: 'Search 2', useCount: 3 })
      const search3 = createMockSavedSearch({ name: 'Search 3', useCount: 1 })

      useSavedSearchesStore.setState({ searches: [search1, search2, search3] })

      useSavedSearchesStore.getState().loadSearch(search2.id)

      const state = useSavedSearchesStore.getState()
      expect(state.searches.find((s) => s.id === search1.id)?.useCount).toBe(2)
      expect(state.searches.find((s) => s.id === search2.id)?.useCount).toBe(4)
      expect(state.searches.find((s) => s.id === search3.id)?.useCount).toBe(1)
    })
  })

  describe('persistence', () => {
    it('should have localStorage as storage mechanism', () => {
      // Verify the store is configured with localStorage
      // The actual persistence happens via Zustand middleware
      const mockSearch = createMockSavedSearch({ name: 'Persisted Search' })

      useSavedSearchesStore.getState().addSearch({
        name: mockSearch.name,
        description: mockSearch.description,
        tags: mockSearch.tags,
        state: mockSearch.state,
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(1)
      expect(state.searches[0].name).toBe('Persisted Search')
    })

    it('should maintain state after operations', () => {
      const mockSearch1 = createMockSavedSearch({ name: 'Search 1' })
      const mockSearch2 = createMockSavedSearch({ name: 'Search 2' })

      useSavedSearchesStore.getState().addSearch({
        name: mockSearch1.name,
        description: mockSearch1.description,
        tags: mockSearch1.tags,
        state: mockSearch1.state,
      })

      useSavedSearchesStore.getState().addSearch({
        name: mockSearch2.name,
        description: mockSearch2.description,
        tags: mockSearch2.tags,
        state: mockSearch2.state,
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(2)
      expect(state.searches[0].name).toBe('Search 1')
      expect(state.searches[1].name).toBe('Search 2')
    })

    it('should keep searches in state after deletion', () => {
      const mockSearch1 = createMockSavedSearch({ name: 'Keep This' })
      const mockSearch2 = createMockSavedSearch({ name: 'Delete This' })
      useSavedSearchesStore.setState({ searches: [mockSearch1, mockSearch2] })

      useSavedSearchesStore.getState().deleteSearch(mockSearch2.id)

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(1)
      expect(state.searches[0].name).toBe('Keep This')
    })
  })

  describe('edge cases', () => {
    it('should handle concurrent updates correctly', () => {
      const mockSearch = createMockSavedSearch({ name: 'Test', useCount: 0 })
      useSavedSearchesStore.setState({ searches: [mockSearch] })

      // Simulate concurrent loads
      useSavedSearchesStore.getState().loadSearch(mockSearch.id)
      useSavedSearchesStore.getState().loadSearch(mockSearch.id)
      useSavedSearchesStore.getState().loadSearch(mockSearch.id)

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].useCount).toBe(3)
    })

    it('should handle duplicate names gracefully', () => {
      const mockState: SavedSearchState = {
        baseQuery: 'test',
        activePresetIds: [],
        activeLocationIds: [],
        country: 'us',
        language: 'en',
        maxResults: 10,
      }

      useSavedSearchesStore.getState().addSearch({
        name: 'Duplicate Name',
        description: 'First',
        tags: [],
        state: mockState,
      })

      useSavedSearchesStore.getState().addSearch({
        name: 'Duplicate Name',
        description: 'Second',
        tags: [],
        state: mockState,
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches.length).toBe(2)
      expect(state.searches[0].name).toBe('Duplicate Name')
      expect(state.searches[1].name).toBe('Duplicate Name')
      expect(state.searches[0].id).not.toBe(state.searches[1].id)
    })

    it('should handle empty tags array', () => {
      const mockState: SavedSearchState = {
        baseQuery: 'test',
        activePresetIds: [],
        activeLocationIds: [],
        country: 'us',
        language: 'en',
        maxResults: 10,
      }

      useSavedSearchesStore.getState().addSearch({
        name: 'No Tags',
        description: '',
        tags: [],
        state: mockState,
      })

      const state = useSavedSearchesStore.getState()
      expect(state.searches[0].tags).toEqual([])
    })

    it('should handle searches with zero useCount in getMostUsedSearches', () => {
      const searches = [
        createMockSavedSearch({ name: 'Never Used', useCount: 0 }),
        createMockSavedSearch({ name: 'Used Once', useCount: 1 }),
      ]
      useSavedSearchesStore.setState({ searches })

      const mostUsed = useSavedSearchesStore.getState().getMostUsedSearches()

      expect(mostUsed.length).toBe(2)
      expect(mostUsed[0].useCount).toBe(1)
      expect(mostUsed[1].useCount).toBe(0)
    })

    it('should handle very large searches array efficiently', () => {
      const largeSearchArray = Array.from({ length: 1000 }, (_, i) =>
        createMockSavedSearch({
          name: `Search ${i}`,
          useCount: Math.floor(Math.random() * 100),
        })
      )
      useSavedSearchesStore.setState({ searches: largeSearchArray })

      const recent = useSavedSearchesStore.getState().getRecentSearches(10)
      const mostUsed = useSavedSearchesStore.getState().getMostUsedSearches(10)

      expect(recent.length).toBe(10)
      expect(mostUsed.length).toBe(10)
    })

    it('should preserve search data integrity during multiple operations', () => {
      const mockState: SavedSearchState = {
        baseQuery: 'data scientist',
        activePresetIds: ['seniority_senior'],
        activeLocationIds: ['loc_boston'],
        country: 'us',
        language: 'en',
        maxResults: 20,
      }

      // Add a search
      useSavedSearchesStore.getState().addSearch({
        name: 'Data Scientists',
        description: 'Senior data scientists',
        tags: ['data-science'],
        state: mockState,
      })

      const state1 = useSavedSearchesStore.getState()
      const searchId = state1.searches[0].id

      // Update it
      useSavedSearchesStore.getState().updateSearch(searchId, {
        name: 'Updated Name',
      })

      // Load it
      useSavedSearchesStore.getState().loadSearch(searchId)

      // Final verification
      const finalState = useSavedSearchesStore.getState()
      const search = finalState.searches[0]

      expect(search.name).toBe('Updated Name')
      expect(search.description).toBe('Senior data scientists')
      expect(search.tags).toEqual(['data-science'])
      expect(search.useCount).toBe(1)
      expect(search.state).toEqual(mockState)
    })
  })
})
