import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { SearchHistoryQuery } from '@/hooks/useConvexSearchHistory'
import type { RawSearchResponse } from '@/lib/api'

// Setup Convex mocks BEFORE importing the hook
import {
  setupConvexMocks,
  resetConvexMocks,
  mockUseQuery,
  mockUseMutation,
  mockApi,
  setMockQueryReturn,
  setMockQueryLoading,
  setMockMutationSuccess,
  setMockMutationError,
  setMockQuerySequence,
  setMockQueryByName,
} from '@/tests/utils/convexMocks'

setupConvexMocks()

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Mock stores
vi.mock('@/stores/queryBuilderStore', () => ({
  useQueryBuilderStore: {
    setState: vi.fn(),
    getState: vi.fn(() => ({
      baseQuery: '',
      activePresetIds: [],
      activeLocationIds: [],
      country: 'us',
      language: 'en',
      maxResults: 100,
    })),
  },
}))

vi.mock('@/stores/resultsStore', () => ({
  useResultsStore: {
    getState: vi.fn(() => ({
      loadFromHistory: vi.fn(),
    })),
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}))

// Mock storageUtils
vi.mock('@/lib/utils/storageUtils', () => ({
  calculateEntrySize: vi.fn(() => 1024),
  formatBytes: vi.fn((bytes: number) => `${bytes} B`),
  getStorageUsagePercentage: vi.fn((used: number, max: number) => Math.round((used / max) * 100)),
  getStorageStatusColor: vi.fn(() => 'green'),
}))

// Now import the hook and mocked modules after mocks are set up
import { useConvexSearchHistory } from '@/hooks/useConvexSearchHistory'
import { toast } from 'sonner'
import { useQueryBuilderStore } from '@/stores/queryBuilderStore'
import { useResultsStore } from '@/stores/resultsStore'

// Mock URL and Blob for CSV download tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Get references to mocked modules using vi.mocked
const getToastMock = () => vi.mocked(toast)
const getQueryBuilderSetState = () => vi.mocked(useQueryBuilderStore.setState)
const getResultsStoreGetState = () => vi.mocked(useResultsStore.getState)

describe('useConvexSearchHistory', () => {
  const mockEntry = {
    _id: 'entry-1' as any,
    _creationTime: Date.now(),
    timestamp: Date.now(),
    query: {
      baseQuery: 'software engineer',
      activePresetIds: ['preset-1'],
      activeLocationIds: ['loc-1'],
      country: 'us',
      language: 'en',
      maxResults: 100,
      composedQuery: 'software engineer AND fintech',
    },
    results: [
      {
        url: 'https://linkedin.com/in/test',
        title: 'Test Profile',
        description: 'Test description',
        type: 'linkedin_profile' as const,
      },
    ],
    metadata: {
      country: 'us',
      language: 'en',
      pages_fetched: 1,
      time_taken_seconds: 1.5,
      max_results: 100,
    },
    totalResults: 1,
    sizeBytes: 1024,
    compressed: false,
    starred: false,
  }

  const mockSearchResponse: RawSearchResponse = {
    results: [
      {
        url: 'https://linkedin.com/in/new',
        title: 'New Profile',
        description: 'New description',
        type: 'linkedin_profile' as const,
      },
    ],
    total_results: 1,
    metadata: {
      country: 'us',
      language: 'en',
      pages_fetched: 1,
      time_taken_seconds: 2.0,
    },
  }

  const mockQuery: SearchHistoryQuery = {
    baseQuery: 'data scientist',
    activePresetIds: [],
    activeLocationIds: [],
    country: 'us',
    language: 'en',
    maxResults: 50,
    composedQuery: 'data scientist',
  }

  beforeEach(() => {
    resetConvexMocks()
    vi.clearAllMocks()

    // Reset store mocks
    getQueryBuilderSetState().mockClear()
    getResultsStoreGetState().mockReturnValue({
      loadFromHistory: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('returns empty entries when loading', () => {
      setMockQueryLoading()

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.entries).toEqual([])
      expect(result.current.isLoading).toBe(true)
    })

    it('returns entries from Convex query', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.entries).toHaveLength(1)
      expect(result.current.entries[0]).toEqual(mockEntry)
      expect(result.current.isLoading).toBe(false)
    })

    it('returns storage stats from Convex query', () => {
      const mockStats = { used: 2048, max: 4194304, percentage: 0, count: 5 }
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: mockStats,
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.totalSizeBytes).toBe(2048)
      expect(result.current.maxSizeBytes).toBe(4194304)
    })

    it('returns default storage stats when undefined', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: undefined,
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.totalSizeBytes).toBe(0)
      expect(result.current.maxSizeBytes).toBe(4 * 1024 * 1024)
    })

    it('exposes all expected methods', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 0, max: 4194304, percentage: 0, count: 0 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(typeof result.current.addEntry).toBe('function')
      expect(typeof result.current.deleteEntry).toBe('function')
      expect(typeof result.current.deleteMany).toBe('function')
      expect(typeof result.current.clearHistory).toBe('function')
      expect(typeof result.current.getEntryById).toBe('function')
      expect(typeof result.current.getRecentEntries).toBe('function')
      expect(typeof result.current.getStarredEntries).toBe('function')
      expect(typeof result.current.searchHistory).toBe('function')
      expect(typeof result.current.getStorageInfo).toBe('function')
      expect(typeof result.current.pruneOldEntries).toBe('function')
      expect(typeof result.current.exportToCSV).toBe('function')
      expect(typeof result.current.downloadCSV).toBe('function')
      expect(typeof result.current.loadQueryToBuilder).toBe('function')
      expect(typeof result.current.loadResultsFromHistory).toBe('function')
      expect(typeof result.current.toggleStar).toBe('function')
    })
  })

  describe('loading states', () => {
    it('shows loading when entries are undefined', () => {
      setMockQueryLoading()

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.entries).toEqual([])
    })

    it('shows loaded when entries are returned', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.entries).toHaveLength(1)
    })

    it('transitions from loading to loaded', () => {
      setMockQuerySequence([undefined, [mockEntry]])

      const { result, rerender } = renderHook(() => useConvexSearchHistory())

      expect(result.current.isLoading).toBe(true)

      rerender()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.entries).toHaveLength(1)
    })
  })

  describe('addEntry mutation', () => {
    it('calls Convex mutation with correct data', async () => {
      const mockAddMutation = setMockMutationSuccess()
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 0, max: 4194304, percentage: 0, count: 0 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.addEntry(mockQuery, mockSearchResponse)
      })

      expect(mockAddMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          query: mockQuery,
          results: mockSearchResponse.results,
          totalResults: mockSearchResponse.total_results,
          metadata: expect.objectContaining({
            max_results: mockQuery.maxResults,
          }),
        })
      )
    })

    it('includes max_results in metadata', async () => {
      const mockAddMutation = setMockMutationSuccess()
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 0, max: 4194304, percentage: 0, count: 0 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.addEntry(mockQuery, mockSearchResponse)
      })

      const callArgs = mockAddMutation.mock.calls[0][0]
      expect(callArgs.metadata.max_results).toBe(mockQuery.maxResults)
    })

    it('handles add entry error', async () => {
      const mockError = new Error('Failed to add entry')
      setMockMutationError(mockError)
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 0, max: 4194304, percentage: 0, count: 0 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.addEntry(mockQuery, mockSearchResponse)
      })

      expect(getToastMock().error).toHaveBeenCalledWith('Failed to save search to history')
    })
  })

  describe('deleteEntry mutation', () => {
    it('calls remove mutation with correct ID', async () => {
      const mockRemoveMutation = setMockMutationSuccess()
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.deleteEntry(mockEntry._id)
      })

      expect(mockRemoveMutation).toHaveBeenCalledWith({ id: mockEntry._id })
    })

    it('handles delete entry error', async () => {
      const mockError = new Error('Failed to delete')
      setMockMutationError(mockError)
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.deleteEntry(mockEntry._id)
      })

      expect(getToastMock().error).toHaveBeenCalledWith('Failed to delete history entry')
    })
  })

  describe('deleteMany mutation', () => {
    it('calls removeMany mutation with correct IDs', async () => {
      const mockRemoveManyMutation = setMockMutationSuccess({ deleted: 2 })
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        const deleted = await result.current.deleteMany([mockEntry._id, 'entry-2' as any])
        expect(deleted).toBe(2)
      })

      expect(mockRemoveManyMutation).toHaveBeenCalledWith({ ids: [mockEntry._id, 'entry-2'] })
      expect(getToastMock().success).toHaveBeenCalledWith('Deleted 2 entries')
    })

    it('handles deleteMany error', async () => {
      const mockError = new Error('Failed to delete many')
      setMockMutationError(mockError)
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        const deleted = await result.current.deleteMany([mockEntry._id])
        expect(deleted).toBe(0)
      })

      expect(getToastMock().error).toHaveBeenCalledWith('Failed to delete entries')
    })
  })

  describe('clearHistory mutation', () => {
    it('calls clearAll mutation', async () => {
      const mockClearMutation = setMockMutationSuccess()
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.clearHistory()
      })

      expect(mockClearMutation).toHaveBeenCalled()
      expect(getToastMock().success).toHaveBeenCalledWith('Search history cleared')
    })

    it('handles clear history error', async () => {
      const mockError = new Error('Failed to clear')
      setMockMutationError(mockError)
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.clearHistory()
      })

      expect(getToastMock().error).toHaveBeenCalledWith('Failed to clear history')
    })
  })

  describe('toggleStar mutation', () => {
    it('calls toggleStar mutation and shows success toast', async () => {
      const mockToggleStarMutation = setMockMutationSuccess({ starred: true })
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.toggleStar(mockEntry._id)
      })

      expect(mockToggleStarMutation).toHaveBeenCalledWith({ id: mockEntry._id })
      expect(getToastMock().success).toHaveBeenCalledWith('Starred')
    })

    it('shows unstarred toast when starred is false', async () => {
      const mockToggleStarMutation = setMockMutationSuccess({ starred: false })
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.toggleStar(mockEntry._id)
      })

      expect(getToastMock().success).toHaveBeenCalledWith('Unstarred')
    })

    it('handles toggleStar error', async () => {
      const mockError = new Error('Failed to toggle star')
      setMockMutationError(mockError)
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        await result.current.toggleStar(mockEntry._id)
      })

      expect(getToastMock().error).toHaveBeenCalledWith('Failed to update star status')
    })
  })

  describe('pruneOldEntries mutation', () => {
    it('calls prune mutation and shows info toast', async () => {
      const mockPruneMutation = setMockMutationSuccess({ removed: 5 })
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        const removed = await result.current.pruneOldEntries()
        expect(removed).toBe(5)
      })

      expect(mockPruneMutation).toHaveBeenCalledWith({ targetPercentage: 70 })
      expect(getToastMock().info).toHaveBeenCalledWith('Removed 5 old history entries')
    })

    it('does not show toast when no entries removed', async () => {
      const mockPruneMutation = setMockMutationSuccess({ removed: 0 })
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        const removed = await result.current.pruneOldEntries()
        expect(removed).toBe(0)
      })

      expect(getToastMock().info).not.toHaveBeenCalled()
    })

    it('handles prune error silently', async () => {
      const mockError = new Error('Failed to prune')
      setMockMutationError(mockError)
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      await act(async () => {
        const removed = await result.current.pruneOldEntries()
        expect(removed).toBe(0)
      })

      expect(getToastMock().error).not.toHaveBeenCalled()
    })
  })

  describe('getEntryById', () => {
    it('returns entry by ID', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const entry = result.current.getEntryById(mockEntry._id)

      expect(entry).toEqual(mockEntry)
    })

    it('returns undefined for non-existent ID', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const entry = result.current.getEntryById('non-existent' as any)

      expect(entry).toBeUndefined()
    })
  })

  describe('getRecentEntries', () => {
    it('returns limited number of entries', () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        ...mockEntry,
        _id: `entry-${i}` as any,
      }))

      setMockQueryByName({
        [mockApi.searchHistory.list]: entries,
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 100 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const recent = result.current.getRecentEntries(10)

      expect(recent).toHaveLength(10)
    })

    it('uses default limit of 50', () => {
      const entries = Array.from({ length: 100 }, (_, i) => ({
        ...mockEntry,
        _id: `entry-${i}` as any,
      }))

      setMockQueryByName({
        [mockApi.searchHistory.list]: entries,
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 100 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const recent = result.current.getRecentEntries()

      expect(recent).toHaveLength(50)
    })

    it('returns empty array when entries is undefined', () => {
      setMockQueryLoading()

      const { result } = renderHook(() => useConvexSearchHistory())

      const recent = result.current.getRecentEntries()

      expect(recent).toEqual([])
    })
  })

  describe('getStarredEntries', () => {
    it('returns starred entries from query', () => {
      const starredEntry = { ...mockEntry, starred: true }
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [starredEntry],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const starred = result.current.getStarredEntries()

      expect(starred).toHaveLength(1)
      expect(starred[0].starred).toBe(true)
    })

    it('returns empty array when starredEntries is undefined', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: undefined,
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const starred = result.current.getStarredEntries()

      expect(starred).toEqual([])
    })
  })

  describe('searchHistory', () => {
    it('filters entries by composed query', () => {
      const entries = [
        { ...mockEntry, _id: 'entry-1' as any, query: { ...mockEntry.query, baseQuery: 'software', composedQuery: 'software engineer' } },
        { ...mockEntry, _id: 'entry-2' as any, query: { ...mockEntry.query, baseQuery: 'data', composedQuery: 'data scientist' } },
        { ...mockEntry, _id: 'entry-3' as any, query: { ...mockEntry.query, baseQuery: 'product', composedQuery: 'product manager' } },
      ]

      setMockQueryByName({
        [mockApi.searchHistory.list]: entries,
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 3 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const filtered = result.current.searchHistory('engineer')

      expect(filtered).toHaveLength(1)
      expect(filtered[0].query.composedQuery).toBe('software engineer')
    })

    it('filters entries by base query', () => {
      const entries = [
        { ...mockEntry, _id: 'entry-1' as any, query: { ...mockEntry.query, baseQuery: 'software', composedQuery: 'software' } },
        { ...mockEntry, _id: 'entry-2' as any, query: { ...mockEntry.query, baseQuery: 'data', composedQuery: 'data' } },
      ]

      setMockQueryByName({
        [mockApi.searchHistory.list]: entries,
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 2 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const filtered = result.current.searchHistory('software')

      expect(filtered).toHaveLength(1)
      expect(filtered[0].query.baseQuery).toBe('software')
    })

    it('is case-insensitive', () => {
      const entries = [{ ...mockEntry, query: { ...mockEntry.query, composedQuery: 'Software Engineer' } }]

      setMockQueryByName({
        [mockApi.searchHistory.list]: entries,
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const filtered = result.current.searchHistory('software')

      expect(filtered).toHaveLength(1)
    })

    it('returns empty array when entries is undefined', () => {
      setMockQueryLoading()

      const { result } = renderHook(() => useConvexSearchHistory())

      const filtered = result.current.searchHistory('test')

      expect(filtered).toEqual([])
    })
  })

  describe('getStorageInfo', () => {
    it('returns storage stats from query', () => {
      const mockStats = { used: 2048, max: 4194304, percentage: 0, count: 5 }
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: mockStats,
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const info = result.current.getStorageInfo()

      expect(info).toEqual(mockStats)
    })

    it('returns default values when stats is undefined', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: undefined,
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const info = result.current.getStorageInfo()

      expect(info).toEqual({
        used: 0,
        max: 4 * 1024 * 1024,
        percentage: 0,
        count: 0,
      })
    })
  })

  describe('exportToCSV', () => {
    it('exports all entries to CSV format', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const csv = result.current.exportToCSV()

      expect(csv).toContain('Search Date')
      expect(csv).toContain('Query')
      expect(csv).toContain('Country')
      expect(csv).toContain('software engineer AND fintech')
      expect(csv).toContain('Test Profile')
    })

    it('exports selected entries only', () => {
      const entries = [
        { ...mockEntry, _id: 'entry-1' as any },
        { ...mockEntry, _id: 'entry-2' as any, query: { ...mockEntry.query, composedQuery: 'different query' } },
      ]

      setMockQueryByName({
        [mockApi.searchHistory.list]: entries,
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 2 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const csv = result.current.exportToCSV(['entry-1' as any])

      expect(csv).toContain('software engineer AND fintech')
      expect(csv).not.toContain('different query')
    })

    it('handles compressed entries', () => {
      const compressedEntry = { ...mockEntry, compressed: true, results: [] }

      setMockQueryByName({
        [mockApi.searchHistory.list]: [compressedEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const csv = result.current.exportToCSV()

      expect(csv).toContain('[Results compressed]')
    })

    it('escapes CSV special characters', () => {
      const entryWithComma = {
        ...mockEntry,
        results: [
          {
            ...mockEntry.results[0],
            title: 'Title, with comma',
            description: 'Description "with quotes"',
          },
        ],
      }

      setMockQueryByName({
        [mockApi.searchHistory.list]: [entryWithComma],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const csv = result.current.exportToCSV()

      expect(csv).toContain('"Title, with comma"')
      expect(csv).toContain('"Description ""with quotes"""')
    })

    it('returns empty string when entries is undefined', () => {
      setMockQueryLoading()

      const { result } = renderHook(() => useConvexSearchHistory())

      const csv = result.current.exportToCSV()

      expect(csv).toBe('')
    })
  })

  describe('downloadCSV', () => {
    it('creates blob and triggers download', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const mockClick = vi.fn()
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)

      act(() => {
        result.current.downloadCSV()
      })

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
      expect(mockAnchor.download).toContain('linkedin-search-history')
      expect(mockClick).toHaveBeenCalled()
      expect(global.URL.revokeObjectURL).toHaveBeenCalled()
      expect(getToastMock().success).toHaveBeenCalledWith('History exported to CSV')
    })

    it('downloads selected entries only', () => {
      const entries = [
        { ...mockEntry, _id: 'entry-1' as any },
        { ...mockEntry, _id: 'entry-2' as any },
      ]

      setMockQueryByName({
        [mockApi.searchHistory.list]: entries,
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 2 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      const mockClick = vi.fn()
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)

      act(() => {
        result.current.downloadCSV(['entry-1' as any])
      })

      expect(mockClick).toHaveBeenCalled()
    })
  })

  describe('loadQueryToBuilder', () => {
    it('loads query to query builder store', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      act(() => {
        result.current.loadQueryToBuilder(mockEntry._id)
      })

      expect(getQueryBuilderSetState()).toHaveBeenCalledWith({
        baseQuery: mockEntry.query.baseQuery,
        activePresetIds: mockEntry.query.activePresetIds,
        activeLocationIds: mockEntry.query.activeLocationIds,
        country: mockEntry.query.country,
        language: mockEntry.query.language,
        maxResults: mockEntry.query.maxResults,
      })
      expect(getToastMock().success).toHaveBeenCalledWith('Query loaded', {
        description: 'Click Search to re-run this query',
      })
    })

    it('shows error toast for non-existent entry', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 0, max: 4194304, percentage: 0, count: 0 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      act(() => {
        result.current.loadQueryToBuilder('non-existent' as any)
      })

      expect(getToastMock().error).toHaveBeenCalledWith('History entry not found')
      expect(getQueryBuilderSetState()).not.toHaveBeenCalled()
    })
  })

  describe('loadResultsFromHistory', () => {
    it('loads results to results store', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [mockEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      act(() => {
        result.current.loadResultsFromHistory(mockEntry._id)
      })

      expect(getResultsStoreGetState()().loadFromHistory).toHaveBeenCalledWith(
        mockEntry.results,
        expect.objectContaining({
          country: mockEntry.metadata.country,
          language: mockEntry.metadata.language,
        }),
        mockEntry.query.composedQuery,
        mockEntry.timestamp
      )
      expect(getQueryBuilderSetState()).toHaveBeenCalled()
      expect(getToastMock().success).toHaveBeenCalledWith('Loaded search from history', {
        description: '2 hours ago',
      })
    })

    it('shows warning for compressed entries', () => {
      const compressedEntry = { ...mockEntry, compressed: true }

      setMockQueryByName({
        [mockApi.searchHistory.list]: [compressedEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      act(() => {
        result.current.loadResultsFromHistory(compressedEntry._id)
      })

      expect(getToastMock().warning).toHaveBeenCalledWith('Results were compressed', {
        description: 'Re-run the search for full data',
      })
      expect(getResultsStoreGetState()().loadFromHistory).not.toHaveBeenCalled()
    })

    it('shows warning for empty results', () => {
      const emptyEntry = { ...mockEntry, results: [] }

      setMockQueryByName({
        [mockApi.searchHistory.list]: [emptyEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      act(() => {
        result.current.loadResultsFromHistory(emptyEntry._id)
      })

      expect(getToastMock().warning).toHaveBeenCalledWith('Results were compressed', {
        description: 'Re-run the search for full data',
      })
    })

    it('shows error toast for non-existent entry', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 0, max: 4194304, percentage: 0, count: 0 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      act(() => {
        result.current.loadResultsFromHistory('non-existent' as any)
      })

      expect(getToastMock().error).toHaveBeenCalledWith('History entry not found')
      expect(getResultsStoreGetState()().loadFromHistory).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('handles entries with special characters in query', () => {
      const specialEntry = {
        ...mockEntry,
        query: {
          ...mockEntry.query,
          composedQuery: 'query with "quotes" and, commas',
        },
      }

      setMockQueryByName({
        [mockApi.searchHistory.list]: [specialEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.entries[0].query.composedQuery).toBe('query with "quotes" and, commas')
    })

    it('handles entries with no results', () => {
      const emptyEntry = { ...mockEntry, results: [], totalResults: 0 }

      setMockQueryByName({
        [mockApi.searchHistory.list]: [emptyEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.entries[0].results).toEqual([])
      expect(result.current.entries[0].totalResults).toBe(0)
    })

    it('handles large number of entries', () => {
      const entries = Array.from({ length: 1000 }, (_, i) => ({
        ...mockEntry,
        _id: `entry-${i}` as any,
      }))

      setMockQueryByName({
        [mockApi.searchHistory.list]: entries,
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024000, max: 4194304, percentage: 24, count: 1000 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.entries).toHaveLength(1000)
    })

    it('handles entries with missing metadata fields', () => {
      const partialEntry = {
        ...mockEntry,
        metadata: {
          country: 'us',
          language: 'en',
          pages_fetched: 1,
          time_taken_seconds: 1.5,
          max_results: 100,
        } as any,
      }

      setMockQueryByName({
        [mockApi.searchHistory.list]: [partialEntry],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 1024, max: 4194304, percentage: 0, count: 1 },
      })

      const { result } = renderHook(() => useConvexSearchHistory())

      expect(result.current.entries[0]).toBeDefined()
    })
  })

  describe('query parameters', () => {
    it('queries with correct limit parameter', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 0, max: 4194304, percentage: 0, count: 0 },
      })

      renderHook(() => useConvexSearchHistory())

      expect(mockUseQuery).toHaveBeenCalledWith(mockApi.searchHistory.list, { limit: 50 })
      expect(mockUseQuery).toHaveBeenCalledWith(mockApi.searchHistory.listStarred, { limit: 50 })
    })

    it('queries storage stats without parameters', () => {
      setMockQueryByName({
        [mockApi.searchHistory.list]: [],
        [mockApi.searchHistory.listStarred]: [],
        [mockApi.searchHistory.getStorageStats]: { used: 0, max: 4194304, percentage: 0, count: 0 },
      })

      renderHook(() => useConvexSearchHistory())

      // Check that storage stats query was called (it's the third useQuery call)
      expect(mockUseQuery).toHaveBeenCalledTimes(3)
      const storageStatsCall = mockUseQuery.mock.calls.find(
        call => call[0] === mockApi.searchHistory.getStorageStats
      )
      expect(storageStatsCall).toBeDefined()
      expect(storageStatsCall![1]).toBeUndefined()
    })
  })
})
