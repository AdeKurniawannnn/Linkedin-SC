import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { Id } from '@/convex/_generated/dataModel'
import {
  mockApi,
  mockUseQuery,
  mockUseMutation,
} from '../utils/convexMocks'

// Mock Convex hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

// Mock Convex API
vi.mock('@/convex/_generated/api', () => ({
  api: mockApi,
}))

// Mock sonner toast
const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}))

// Now import the hook after mocks are set up
const { useConvexSavedSearches } = await import('@/hooks/useConvexSavedSearches')
const { useQueryBuilderStore } = await import('@/stores/queryBuilderStore')

// Re-export types
type SavedSearchInput = {
  name: string
  description: string
  tags: string[]
  state: {
    baseQuery: string
    activePresetIds: string[]
    activeLocationIds: string[]
    country: string
    language: string
    maxResults: number
  }
}

// Helper functions to control mocks
function setMockQueryReturn<T>(value: T) {
  mockUseQuery.mockReturnValue(value)
}

function setMockQueryLoading() {
  mockUseQuery.mockReturnValue(undefined)
}

function setMockMutationSuccess<T>(value?: T) {
  const mockFn = vi.fn().mockResolvedValue(value)
  mockUseMutation.mockReturnValue(mockFn)
  return mockFn
}

function setMockMutationError(error: Error) {
  const mockFn = vi.fn().mockRejectedValue(error)
  mockUseMutation.mockReturnValue(mockFn)
  return mockFn
}

function setMockQueryByName(queryMap: Record<string, any>) {
  mockUseQuery.mockImplementation((queryName) => {
    return queryMap[queryName]
  })
}

// Sample saved search data
const createMockSavedSearch = (overrides = {}) => ({
  _id: 'search-1' as Id<'savedSearches'>,
  _creationTime: 1234567890,
  name: 'Test Search',
  description: 'Test description',
  tags: ['tag1', 'tag2'],
  state: {
    baseQuery: 'test query',
    activePresetIds: ['preset1', 'preset2'],
    activeLocationIds: ['loc1'],
    country: 'US',
    language: 'en',
    maxResults: 10,
  },
  useCount: 5,
  lastUsed: 1234567890,
  ...overrides,
})

describe('useConvexSavedSearches', () => {
  beforeEach(() => {
    mockUseQuery.mockClear()
    mockUseMutation.mockClear()
    mockToastSuccess.mockClear()
    mockToastError.mockClear()

    // Reset query builder store
    useQueryBuilderStore.setState({
      baseQuery: '',
      activePresetIds: [],
      activeLocationIds: [],
      location: '',
      country: '',
      language: 'en',
      maxResults: 10,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('query hook - returns saved searches from Convex', () => {
    it('returns empty array when no searches exist', () => {
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      expect(result.current.searches).toEqual([])
      expect(result.current.isLoading).toBe(false)
    })

    it('returns saved searches from Convex', () => {
      const mockSearches = [
        createMockSavedSearch({ _id: 'search-1' as Id<'savedSearches'>, name: 'Search 1' }),
        createMockSavedSearch({ _id: 'search-2' as Id<'savedSearches'>, name: 'Search 2' }),
      ]
      setMockQueryReturn(mockSearches)

      const { result } = renderHook(() => useConvexSavedSearches())

      expect(result.current.searches).toHaveLength(2)
      expect(result.current.searches[0].name).toBe('Search 1')
      expect(result.current.searches[1].name).toBe('Search 2')
    })

    it('calls useQuery with correct API endpoint', () => {
      setMockQueryReturn([])
      renderHook(() => useConvexSavedSearches())

      expect(mockUseQuery).toHaveBeenCalledWith(mockApi.savedSearches.list)
    })

    it('calls getRecent and getMostUsed queries', () => {
      setMockQueryReturn([])
      renderHook(() => useConvexSavedSearches())

      expect(mockUseQuery).toHaveBeenCalledWith(mockApi.savedSearches.getRecent, { limit: 5 })
      expect(mockUseQuery).toHaveBeenCalledWith(mockApi.savedSearches.getMostUsed, { limit: 5 })
    })
  })

  describe('loading/error states', () => {
    it('returns isLoading true when searches undefined', () => {
      setMockQueryLoading()

      const { result } = renderHook(() => useConvexSavedSearches())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.searches).toEqual([])
    })

    it('returns isLoading false when searches loaded', () => {
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      expect(result.current.isLoading).toBe(false)
    })

    it('handles query transition from loading to loaded', () => {
      // Start with undefined (loading)
      mockUseQuery.mockReturnValueOnce(undefined)
      const { result, rerender } = renderHook(() => useConvexSavedSearches())

      expect(result.current.isLoading).toBe(true)

      // Change to loaded
      setMockQueryReturn([createMockSavedSearch()])
      rerender()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.searches).toHaveLength(1)
    })
  })

  describe('save search mutation', () => {
    it('saves search with correct data', async () => {
      const mockMutationFn = setMockMutationSuccess('new-search-id' as Id<'savedSearches'>)
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const searchInput: SavedSearchInput = {
        name: 'New Search',
        description: 'Test desc',
        tags: ['tag1'],
        state: {
          baseQuery: 'test',
          activePresetIds: [],
          activeLocationIds: [],
          country: 'US',
          language: 'en',
          maxResults: 10,
        },
      }

      await act(async () => {
        await result.current.addSearch(searchInput)
      })

      expect(mockMutationFn).toHaveBeenCalledWith(searchInput)
    })

    it('returns ID on successful save', async () => {
      const expectedId = 'new-search-id' as Id<'savedSearches'>
      setMockMutationSuccess(expectedId)
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const searchInput: SavedSearchInput = {
        name: 'New Search',
        description: 'Test',
        tags: [],
        state: {
          baseQuery: 'test',
          activePresetIds: [],
          activeLocationIds: [],
          country: '',
          language: 'en',
          maxResults: 10,
        },
      }

      let returnedId: Id<'savedSearches'> | null = null
      await act(async () => {
        returnedId = await result.current.addSearch(searchInput)
      })

      expect(returnedId).toBe(expectedId)
    })

    it('shows success toast with search name', async () => {
      setMockMutationSuccess('new-search-id' as Id<'savedSearches'>)
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const searchInput: SavedSearchInput = {
        name: 'My New Search',
        description: 'Test',
        tags: [],
        state: {
          baseQuery: '',
          activePresetIds: [],
          activeLocationIds: [],
          country: '',
          language: 'en',
          maxResults: 10,
        },
      }

      await act(async () => {
        await result.current.addSearch(searchInput)
      })

      expect(mockToastSuccess).toHaveBeenCalledWith('Search saved', { description: 'My New Search' })
    })

    it('shows error toast and returns null on failure', async () => {
      setMockMutationError(new Error('Save failed'))
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const searchInput: SavedSearchInput = {
        name: 'Failed Search',
        description: 'Test',
        tags: [],
        state: {
          baseQuery: '',
          activePresetIds: [],
          activeLocationIds: [],
          country: '',
          language: 'en',
          maxResults: 10,
        },
      }

      let returnedId: Id<'savedSearches'> | null = null
      await act(async () => {
        returnedId = await result.current.addSearch(searchInput)
      })

      expect(returnedId).toBeNull()
      expect(mockToastError).toHaveBeenCalledWith('Failed to save search')
    })

    it('logs error to console on failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Save failed')
      setMockMutationError(error)
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const searchInput: SavedSearchInput = {
        name: 'Test',
        description: '',
        tags: [],
        state: {
          baseQuery: '',
          activePresetIds: [],
          activeLocationIds: [],
          country: '',
          language: 'en',
          maxResults: 10,
        },
      }

      await act(async () => {
        await result.current.addSearch(searchInput)
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save search:', error)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('delete search mutation', () => {
    it('deletes search by ID', async () => {
      const mockMutationFn = setMockMutationSuccess()
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const searchId = 'search-1' as Id<'savedSearches'>

      await act(async () => {
        await result.current.deleteSearch(searchId)
      })

      expect(mockMutationFn).toHaveBeenCalledWith({ id: searchId })
    })

    it('shows success toast on delete', async () => {
      setMockMutationSuccess()
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.deleteSearch('search-1' as Id<'savedSearches'>)
      })

      expect(mockToastSuccess).toHaveBeenCalledWith('Search deleted')
    })

    it('shows error toast on delete failure', async () => {
      setMockMutationError(new Error('Delete failed'))
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.deleteSearch('search-1' as Id<'savedSearches'>)
      })

      expect(mockToastError).toHaveBeenCalledWith('Failed to delete search')
    })

    it('logs error to console on delete failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Delete failed')
      setMockMutationError(error)
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.deleteSearch('search-1' as Id<'savedSearches'>)
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to delete search:', error)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('update search mutation', () => {
    it('updates search with partial data', async () => {
      const mockMutationFn = setMockMutationSuccess()
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const searchId = 'search-1' as Id<'savedSearches'>
      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
      }

      await act(async () => {
        await result.current.updateSearch(searchId, updates)
      })

      expect(mockMutationFn).toHaveBeenCalledWith({ id: searchId, ...updates })
    })

    it('can update search state', async () => {
      const mockMutationFn = setMockMutationSuccess()
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const searchId = 'search-1' as Id<'savedSearches'>
      const updates = {
        state: {
          baseQuery: 'updated query',
          activePresetIds: ['new-preset'],
          activeLocationIds: [],
          country: 'UK',
          language: 'en',
          maxResults: 20,
        },
      }

      await act(async () => {
        await result.current.updateSearch(searchId, updates)
      })

      expect(mockMutationFn).toHaveBeenCalledWith({ id: searchId, ...updates })
    })

    it('shows success toast on update', async () => {
      setMockMutationSuccess()
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.updateSearch('search-1' as Id<'savedSearches'>, { name: 'New Name' })
      })

      expect(mockToastSuccess).toHaveBeenCalledWith('Search updated')
    })

    it('shows error toast on update failure', async () => {
      setMockMutationError(new Error('Update failed'))
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.updateSearch('search-1' as Id<'savedSearches'>, { name: 'New Name' })
      })

      expect(mockToastError).toHaveBeenCalledWith('Failed to update search')
    })

    it('logs error to console on update failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Update failed')
      setMockMutationError(error)
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.updateSearch('search-1' as Id<'savedSearches'>, { name: 'New Name' })
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to update search:', error)
      consoleErrorSpy.mockRestore()
    })
  })

  describe('load search - restores query to builder store', () => {
    it('loads search state into query builder store', async () => {
      const mockSearch = createMockSavedSearch({
        _id: 'search-1' as Id<'savedSearches'>,
        state: {
          baseQuery: 'loaded query',
          activePresetIds: ['preset-a', 'preset-b'],
          activeLocationIds: ['loc-1', 'loc-2'],
          country: 'CA',
          language: 'fr',
          maxResults: 25,
        },
      })

      setMockQueryReturn([mockSearch])
      setMockMutationSuccess()

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.loadSearch('search-1' as Id<'savedSearches'>)
      })

      const storeState = useQueryBuilderStore.getState()
      expect(storeState.baseQuery).toBe('loaded query')
      expect(storeState.activePresetIds).toEqual(['preset-a', 'preset-b'])
      expect(storeState.activeLocationIds).toEqual(['loc-1', 'loc-2'])
      expect(storeState.country).toBe('CA')
      expect(storeState.language).toBe('fr')
      expect(storeState.maxResults).toBe(25)
    })

    it('shows success toast with search name when loaded', async () => {
      const mockSearch = createMockSavedSearch({
        _id: 'search-1' as Id<'savedSearches'>,
        name: 'My Saved Search',
      })

      setMockQueryReturn([mockSearch])
      setMockMutationSuccess()

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.loadSearch('search-1' as Id<'savedSearches'>)
      })

      expect(mockToastSuccess).toHaveBeenCalledWith('Search loaded', {
        description: 'My Saved Search',
      })
    })

    it('shows error toast when search not found', async () => {
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.loadSearch('nonexistent' as Id<'savedSearches'>)
      })

      expect(mockToastError).toHaveBeenCalledWith('Search not found')
    })

    it('does not update store when search not found', async () => {
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const initialState = useQueryBuilderStore.getState()

      await act(async () => {
        await result.current.loadSearch('nonexistent' as Id<'savedSearches'>)
      })

      const finalState = useQueryBuilderStore.getState()
      expect(finalState).toEqual(initialState)
    })
  })

  describe('usage tracking - increments useCount on load', () => {
    it('records usage when search is loaded', async () => {
      const mockSearch = createMockSavedSearch({
        _id: 'search-1' as Id<'savedSearches'>,
      })

      setMockQueryReturn([mockSearch])
      const mockRecordUsageFn = setMockMutationSuccess()

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.loadSearch('search-1' as Id<'savedSearches'>)
      })

      expect(mockRecordUsageFn).toHaveBeenCalledWith({ id: 'search-1' as Id<'savedSearches'> })
    })

    it('logs error if usage tracking fails but still loads search', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const mockSearch = createMockSavedSearch({
        _id: 'search-1' as Id<'savedSearches'>,
      })

      setMockQueryReturn([mockSearch])

      // Mock mutations to fail recordUsage but succeed for other mutations
      const mockRecordUsageFn = vi.fn().mockRejectedValue(new Error('Usage tracking failed'))
      mockUseMutation.mockReturnValue(mockRecordUsageFn)

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.loadSearch('search-1' as Id<'savedSearches'>)
      })

      // Search should still be loaded
      const storeState = useQueryBuilderStore.getState()
      expect(storeState.baseQuery).toBe(mockSearch.state.baseQuery)

      // Error should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to record usage:', expect.any(Error))

      // Success toast should still show
      expect(mockToastSuccess).toHaveBeenCalledWith('Search loaded', {
        description: mockSearch.name,
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('toast notifications', () => {
    it('shows appropriate toasts for all operations', async () => {
      setMockMutationSuccess('new-id' as Id<'savedSearches'>)
      setMockQueryReturn([createMockSavedSearch()])

      const { result } = renderHook(() => useConvexSavedSearches())

      // Add
      await act(async () => {
        await result.current.addSearch({
          name: 'Test',
          description: '',
          tags: [],
          state: {
            baseQuery: '',
            activePresetIds: [],
            activeLocationIds: [],
            country: '',
            language: 'en',
            maxResults: 10,
          },
        })
      })
      expect(mockToastSuccess).toHaveBeenCalledWith('Search saved', { description: 'Test' })

      // Update
      await act(async () => {
        await result.current.updateSearch('search-1' as Id<'savedSearches'>, { name: 'Updated' })
      })
      expect(mockToastSuccess).toHaveBeenCalledWith('Search updated')

      // Delete
      await act(async () => {
        await result.current.deleteSearch('search-1' as Id<'savedSearches'>)
      })
      expect(mockToastSuccess).toHaveBeenCalledWith('Search deleted')

      // Load
      await act(async () => {
        await result.current.loadSearch('search-1' as Id<'savedSearches'>)
      })
      expect(mockToastSuccess).toHaveBeenCalledWith('Search loaded', expect.any(Object))
    })

    it('clears previous toasts between operations', async () => {
      setMockMutationSuccess()
      setMockQueryReturn([createMockSavedSearch()])

      const { result } = renderHook(() => useConvexSavedSearches())

      vi.clearAllMocks()

      await act(async () => {
        await result.current.deleteSearch('search-1' as Id<'savedSearches'>)
      })

      expect(mockToastSuccess).toHaveBeenCalledTimes(1)
      expect(mockToastSuccess).toHaveBeenCalledWith('Search deleted')
    })
  })

  describe('sorting and filtering', () => {
    it('getRecentSearches returns limited recent searches', () => {
      const recentSearches = [
        createMockSavedSearch({ _id: 'recent-1' as Id<'savedSearches'>, lastUsed: 1000 }),
        createMockSavedSearch({ _id: 'recent-2' as Id<'savedSearches'>, lastUsed: 2000 }),
        createMockSavedSearch({ _id: 'recent-3' as Id<'savedSearches'>, lastUsed: 3000 }),
      ]

      setMockQueryByName({
        [mockApi.savedSearches.list]: [],
        [mockApi.savedSearches.getRecent]: recentSearches,
        [mockApi.savedSearches.getMostUsed]: [],
      })

      const { result } = renderHook(() => useConvexSavedSearches())

      const recent = result.current.getRecentSearches()
      expect(recent).toHaveLength(3)
      expect(recent).toEqual(recentSearches)
    })

    it('getRecentSearches respects custom limit', () => {
      const recentSearches = [
        createMockSavedSearch({ _id: 'recent-1' as Id<'savedSearches'> }),
        createMockSavedSearch({ _id: 'recent-2' as Id<'savedSearches'> }),
        createMockSavedSearch({ _id: 'recent-3' as Id<'savedSearches'> }),
      ]

      setMockQueryByName({
        [mockApi.savedSearches.list]: [],
        [mockApi.savedSearches.getRecent]: recentSearches,
        [mockApi.savedSearches.getMostUsed]: [],
      })

      const { result } = renderHook(() => useConvexSavedSearches())

      const recent = result.current.getRecentSearches(2)
      expect(recent).toHaveLength(2)
    })

    it('getRecentSearches returns empty array when undefined', () => {
      setMockQueryByName({
        [mockApi.savedSearches.list]: [],
        [mockApi.savedSearches.getRecent]: undefined,
        [mockApi.savedSearches.getMostUsed]: [],
      })

      const { result } = renderHook(() => useConvexSavedSearches())

      const recent = result.current.getRecentSearches()
      expect(recent).toEqual([])
    })

    it('getMostUsedSearches returns limited most used searches', () => {
      const mostUsed = [
        createMockSavedSearch({ _id: 'used-1' as Id<'savedSearches'>, useCount: 10 }),
        createMockSavedSearch({ _id: 'used-2' as Id<'savedSearches'>, useCount: 20 }),
      ]

      setMockQueryByName({
        [mockApi.savedSearches.list]: [],
        [mockApi.savedSearches.getRecent]: [],
        [mockApi.savedSearches.getMostUsed]: mostUsed,
      })

      const { result } = renderHook(() => useConvexSavedSearches())

      const used = result.current.getMostUsedSearches()
      expect(used).toHaveLength(2)
      expect(used).toEqual(mostUsed)
    })

    it('getMostUsedSearches respects custom limit', () => {
      const mostUsed = [
        createMockSavedSearch({ _id: 'used-1' as Id<'savedSearches'> }),
        createMockSavedSearch({ _id: 'used-2' as Id<'savedSearches'> }),
        createMockSavedSearch({ _id: 'used-3' as Id<'savedSearches'> }),
      ]

      setMockQueryByName({
        [mockApi.savedSearches.list]: [],
        [mockApi.savedSearches.getRecent]: [],
        [mockApi.savedSearches.getMostUsed]: mostUsed,
      })

      const { result } = renderHook(() => useConvexSavedSearches())

      const used = result.current.getMostUsedSearches(1)
      expect(used).toHaveLength(1)
    })

    it('getMostUsedSearches returns empty array when undefined', () => {
      setMockQueryByName({
        [mockApi.savedSearches.list]: [],
        [mockApi.savedSearches.getRecent]: [],
        [mockApi.savedSearches.getMostUsed]: undefined,
      })

      const { result } = renderHook(() => useConvexSavedSearches())

      const used = result.current.getMostUsedSearches()
      expect(used).toEqual([])
    })
  })

  describe('integration - with queryBuilderStore', () => {
    it('loads all query builder fields correctly', async () => {
      const mockSearch = createMockSavedSearch({
        state: {
          baseQuery: 'software engineer',
          activePresetIds: ['preset1', 'preset2', 'preset3'],
          activeLocationIds: ['us', 'ca', 'uk'],
          country: 'US',
          language: 'en',
          maxResults: 50,
        },
      })

      setMockQueryReturn([mockSearch])
      setMockMutationSuccess()

      const { result } = renderHook(() => useConvexSavedSearches())

      await act(async () => {
        await result.current.loadSearch('search-1' as Id<'savedSearches'>)
      })

      const state = useQueryBuilderStore.getState()
      expect(state.baseQuery).toBe('software engineer')
      expect(state.activePresetIds).toEqual(['preset1', 'preset2', 'preset3'])
      expect(state.activeLocationIds).toEqual(['us', 'ca', 'uk'])
      expect(state.country).toBe('US')
      expect(state.language).toBe('en')
      expect(state.maxResults).toBe(50)
    })

    it('creates saved search from current query builder state', async () => {
      const mockMutationFn = setMockMutationSuccess('new-id' as Id<'savedSearches'>)
      setMockQueryReturn([])

      // Set query builder state
      act(() => {
        useQueryBuilderStore.setState({
          baseQuery: 'CTO fintech',
          activePresetIds: ['hiring', 'english'],
          activeLocationIds: ['ny', 'sf'],
          country: 'US',
          language: 'en',
          maxResults: 100,
        })
      })

      const { result } = renderHook(() => useConvexSavedSearches())

      const storeState = useQueryBuilderStore.getState()
      const searchInput: SavedSearchInput = {
        name: 'FinTech CTOs',
        description: 'Search for fintech CTOs',
        tags: ['cto', 'fintech'],
        state: {
          baseQuery: storeState.baseQuery,
          activePresetIds: storeState.activePresetIds,
          activeLocationIds: storeState.activeLocationIds,
          country: storeState.country,
          language: storeState.language,
          maxResults: storeState.maxResults,
        },
      }

      await act(async () => {
        await result.current.addSearch(searchInput)
      })

      expect(mockMutationFn).toHaveBeenCalledWith(searchInput)
    })

    it('getSearchById finds search in list', () => {
      const mockSearches = [
        createMockSavedSearch({ _id: 'search-1' as Id<'savedSearches'>, name: 'First' }),
        createMockSavedSearch({ _id: 'search-2' as Id<'savedSearches'>, name: 'Second' }),
        createMockSavedSearch({ _id: 'search-3' as Id<'savedSearches'>, name: 'Third' }),
      ]

      setMockQueryReturn(mockSearches)

      const { result } = renderHook(() => useConvexSavedSearches())

      const found = result.current.getSearchById('search-2' as Id<'savedSearches'>)
      expect(found).toBeDefined()
      expect(found?.name).toBe('Second')
    })

    it('getSearchById returns undefined when not found', () => {
      setMockQueryReturn([])

      const { result } = renderHook(() => useConvexSavedSearches())

      const found = result.current.getSearchById('nonexistent' as Id<'savedSearches'>)
      expect(found).toBeUndefined()
    })

    it('getSearchById returns undefined when searches still loading', () => {
      setMockQueryLoading()

      const { result } = renderHook(() => useConvexSavedSearches())

      const found = result.current.getSearchById('search-1' as Id<'savedSearches'>)
      expect(found).toBeUndefined()
    })
  })
})
