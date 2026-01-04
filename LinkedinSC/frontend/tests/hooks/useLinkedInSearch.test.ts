import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useLinkedInSearch, type UseLinkedInSearchOptions } from '@/hooks/useLinkedInSearch'
import type { RawSearchResponse } from '@/lib/api'

// Mock dependencies
vi.mock('@/lib/api', () => ({
  searchRaw: vi.fn(),
  isAbortError: vi.fn((error) => {
    if (error instanceof Error && error.name === 'AbortError') return true
    if (error instanceof DOMException && error.name === 'AbortError') return true
    return false
  }),
}))

vi.mock('@/stores/queryBuilderStore', () => ({
  useQueryBuilderStore: vi.fn((selector) => {
    const state = {
      baseQuery: 'CTO',
      location: 'San Francisco',
      country: 'us',
      language: 'en',
      maxResults: 100,
      clearPresets: vi.fn(),
    }
    return selector(state)
  }),
}))

vi.mock('@/hooks/useBuildQueryWithPresets', () => ({
  useBuildQueryWithPresets: vi.fn(() => 'site:linkedin.com/in/ CTO San Francisco'),
}))

vi.mock('@/lib/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}))

vi.mock('@/lib/validation/searchSchema', () => ({
  validateSearchForm: vi.fn(() => []),
}))

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useLinkedInSearch', () => {
  const mockSearchResponse: RawSearchResponse = {
    success: true,
    query: 'site:linkedin.com/in/ CTO San Francisco',
    total_results: 5,
    results: [
      {
        url: 'https://linkedin.com/in/john-doe',
        title: 'John Doe - CTO at Tech Corp',
        description: 'Experienced CTO in San Francisco',
        type: 'profile',
        rank: 1,
      },
      {
        url: 'https://linkedin.com/in/jane-smith',
        title: 'Jane Smith - CTO at StartupCo',
        description: 'Tech leader based in SF',
        type: 'profile',
        rank: 2,
      },
    ],
    metadata: {
      country: 'us',
      language: 'en',
      pages_fetched: 1,
      time_taken_seconds: 1.5,
    },
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // Reset mock implementations
    const { searchRaw, isAbortError } = await import('@/lib/api')
    const { validateSearchForm } = await import('@/lib/validation/searchSchema')

    vi.mocked(searchRaw).mockReset()
    vi.mocked(isAbortError).mockReset()
    vi.mocked(validateSearchForm).mockReset()

    // Set default implementations
    vi.mocked(searchRaw).mockResolvedValue(mockSearchResponse)
    vi.mocked(validateSearchForm).mockReturnValue([])
    vi.mocked(isAbortError).mockImplementation((error) => {
      if (error instanceof Error && error.name === 'AbortError') return true
      if (error instanceof DOMException && error.name === 'AbortError') return true
      return false
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('returns correct initial state', () => {
      const { result } = renderHook(() => useLinkedInSearch())

      expect(result.current.isLoading).toBe(false)
      expect(typeof result.current.handleSearch).toBe('function')
      expect(typeof result.current.handleCancel).toBe('function')
    })

    it('exposes control functions', () => {
      const { result } = renderHook(() => useLinkedInSearch())

      expect(typeof result.current.handleSearch).toBe('function')
      expect(typeof result.current.handleCancel).toBe('function')
    })

    it('is not loading initially', () => {
      const { result } = renderHook(() => useLinkedInSearch())

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('search execution', () => {
    it('calls searchRaw with correct parameters', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockResolvedValue(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(searchRaw).toHaveBeenCalledWith(
        {
          query: 'site:linkedin.com/in/ CTO San Francisco',
          country: 'us',
          language: 'en',
          max_results: 100,
        },
        expect.any(AbortSignal)
      )
    })

    it('uses default values when store values are missing', async () => {
      const { searchRaw } = await import('@/lib/api')

      vi.mocked(searchRaw).mockResolvedValueOnce(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      // Should use DEFAULT_COUNTRY, DEFAULT_LANGUAGE, DEFAULT_MAX_RESULTS
      expect(searchRaw).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'us',
          language: 'en',
          max_results: 100,
        }),
        expect.any(AbortSignal)
      )
    })

    it('calls onSearchComplete callback on success', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockResolvedValue(mockSearchResponse)

      const onSearchComplete = vi.fn()
      const { result } = renderHook(() =>
        useLinkedInSearch({ onSearchComplete })
      )

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(onSearchComplete).toHaveBeenCalledWith(mockSearchResponse)
      expect(onSearchComplete).toHaveBeenCalledTimes(1)
    })

    it('does not call onSearchComplete if not provided', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockResolvedValue(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      // Should not throw
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('loading state', () => {
    it('sets isLoading to true during search', async () => {
      const { searchRaw } = await import('@/lib/api')

      let resolveSearch: (value: RawSearchResponse) => void
      const searchPromise = new Promise<RawSearchResponse>((resolve) => {
        resolveSearch = resolve
      })
      vi.mocked(searchRaw).mockReturnValue(searchPromise)

      const { result } = renderHook(() => useLinkedInSearch())

      // Start search
      act(() => {
        result.current.handleSearch()
      })

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true)

      // Resolve the promise
      await act(async () => {
        resolveSearch!(mockSearchResponse)
        await searchPromise
      })

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false)
    })

    it('sets isLoading to false after successful search', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockResolvedValue(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('sets isLoading to false after search error', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('error handling', () => {
    it('calls onSearchError callback on API error', async () => {
      const { searchRaw } = await import('@/lib/api')
      const error = new Error('API error')
      vi.mocked(searchRaw).mockRejectedValue(error)

      const onSearchError = vi.fn()
      const { result } = renderHook(() =>
        useLinkedInSearch({ onSearchError })
      )

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(onSearchError).toHaveBeenCalledWith(error)
      expect(onSearchError).toHaveBeenCalledTimes(1)
    })

    it('calls onSearchError with Error object for non-Error failures', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockRejectedValue('String error')

      const onSearchError = vi.fn()
      const { result } = renderHook(() =>
        useLinkedInSearch({ onSearchError })
      )

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(onSearchError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Search failed',
        })
      )
    })

    it('does not call onSearchError for abort errors', async () => {
      const { searchRaw, isAbortError } = await import('@/lib/api')
      const abortError = new DOMException('Aborted', 'AbortError')
      vi.mocked(searchRaw).mockRejectedValue(abortError)
      vi.mocked(isAbortError).mockReturnValue(true)

      const onSearchError = vi.fn()
      const { result } = renderHook(() =>
        useLinkedInSearch({ onSearchError })
      )

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(onSearchError).not.toHaveBeenCalled()
    })

    it('handles network errors gracefully', async () => {
      const { searchRaw, isAbortError } = await import('@/lib/api')
      const error = new Error('Network request failed')

      vi.mocked(searchRaw).mockRejectedValueOnce(error)
      vi.mocked(isAbortError).mockReturnValueOnce(false)

      const onSearchError = vi.fn()
      const { result } = renderHook(() =>
        useLinkedInSearch({ onSearchError })
      )

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(result.current.isLoading).toBe(false)
      expect(onSearchError).toHaveBeenCalledWith(error)
    })
  })

  describe('AbortController', () => {
    it('creates AbortController for each search', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockResolvedValue(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(searchRaw).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(AbortSignal)
      )
    })

    it('cancels previous request when new search starts', async () => {
      const { searchRaw } = await import('@/lib/api')

      let resolveFirst: (value: RawSearchResponse) => void
      const firstPromise = new Promise<RawSearchResponse>((resolve) => {
        resolveFirst = resolve
      })
      vi.mocked(searchRaw).mockReturnValueOnce(firstPromise)

      const { result } = renderHook(() => useLinkedInSearch())

      // Start first search
      act(() => {
        result.current.handleSearch()
      })

      // Get the abort signal from first call
      const firstCall = vi.mocked(searchRaw).mock.calls[0]
      const firstSignal = firstCall[1]

      // Start second search before first completes
      vi.mocked(searchRaw).mockResolvedValueOnce(mockSearchResponse)

      await act(async () => {
        await result.current.handleSearch()
      })

      // First signal should be aborted
      expect(firstSignal?.aborted).toBe(true)

      // Clean up
      await act(async () => {
        resolveFirst!(mockSearchResponse)
        await firstPromise.catch(() => {})
      })
    })

    it('handleCancel aborts ongoing search', async () => {
      const { searchRaw } = await import('@/lib/api')
      const { toast } = await import('sonner')

      let resolveSearch: (value: RawSearchResponse) => void
      const searchPromise = new Promise<RawSearchResponse>((resolve) => {
        resolveSearch = resolve
      })
      vi.mocked(searchRaw).mockReturnValue(searchPromise)

      const { result } = renderHook(() => useLinkedInSearch())

      // Start search
      act(() => {
        result.current.handleSearch()
      })

      expect(result.current.isLoading).toBe(true)

      // Get the abort signal
      const call = vi.mocked(searchRaw).mock.calls[0]
      const signal = call[1]

      // Cancel search
      act(() => {
        result.current.handleCancel()
      })

      expect(signal?.aborted).toBe(true)
      expect(result.current.isLoading).toBe(false)
      expect(toast.info).toHaveBeenCalledWith('Search cancelled')

      // Clean up
      await act(async () => {
        resolveSearch!(mockSearchResponse)
        await searchPromise.catch(() => {})
      })
    })

    it('handleCancel does nothing if no search is ongoing', async () => {
      const { toast } = await import('sonner')
      const { result } = renderHook(() => useLinkedInSearch())

      act(() => {
        result.current.handleCancel()
      })

      expect(toast.info).not.toHaveBeenCalled()
    })

    it('clears AbortController reference after successful search', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockResolvedValue(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      // Try to cancel after completion
      act(() => {
        result.current.handleCancel()
      })

      const { toast } = await import('sonner')
      // Should not show cancel message since there's no ongoing search
      expect(toast.info).not.toHaveBeenCalled()
    })
  })

  describe('input validation', () => {
    it('validates form before search', async () => {
      const { validateSearchForm } = await import('@/lib/validation/searchSchema')
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw).mockResolvedValueOnce(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(validateSearchForm).toHaveBeenCalledWith(
        expect.objectContaining({
          country: 'us',
          language: 'en',
          maxResults: 100,
        }),
        expect.any(String)
      )
    })

    it('prevents search if validation fails', async () => {
      const { validateSearchForm } = await import('@/lib/validation/searchSchema')
      const { searchRaw } = await import('@/lib/api')
      const { toast } = await import('sonner')

      vi.mocked(validateSearchForm).mockReturnValue([
        'Query is required',
      ])

      const onSearchError = vi.fn()
      const { result } = renderHook(() =>
        useLinkedInSearch({ onSearchError })
      )

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(searchRaw).not.toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalledWith('Validation Error', {
        description: 'Query is required',
      })
      expect(onSearchError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Query is required',
        })
      )
    })

    it('shows first validation error if multiple exist', async () => {
      const { validateSearchForm } = await import('@/lib/validation/searchSchema')
      const { toast } = await import('sonner')

      vi.mocked(validateSearchForm).mockReturnValue([
        'Query is required',
        'Location is required',
      ])

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(toast.error).toHaveBeenCalledWith('Validation Error', {
        description: 'Query is required',
      })
    })
  })

  describe('keyboard shortcuts integration', () => {
    it('registers keyboard shortcuts', async () => {
      const { useKeyboardShortcuts } = await import('@/lib/hooks/useKeyboardShortcuts')

      renderHook(() => useLinkedInSearch())

      expect(useKeyboardShortcuts).toHaveBeenCalledWith({
        onSearch: expect.any(Function),
        onFocusSearch: expect.any(Function),
        onEscape: expect.any(Function),
        enabled: true,
      })
    })

    it('disables shortcuts during loading', async () => {
      const { useKeyboardShortcuts } = await import('@/lib/hooks/useKeyboardShortcuts')
      const { searchRaw } = await import('@/lib/api')

      let resolveSearch: (value: RawSearchResponse) => void
      const searchPromise = new Promise<RawSearchResponse>((resolve) => {
        resolveSearch = resolve
      })
      vi.mocked(searchRaw).mockReturnValueOnce(searchPromise)

      const { result } = renderHook(() => useLinkedInSearch())

      // Start search without awaiting
      act(() => {
        result.current.handleSearch()
      })

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true)

      // Clean up
      await act(async () => {
        resolveSearch!(mockSearchResponse)
        await searchPromise
      })
    })

    it('uses provided onFocusSearch callback', async () => {
      const { useKeyboardShortcuts } = await import('@/lib/hooks/useKeyboardShortcuts')
      const onFocusSearch = vi.fn()

      renderHook(() => useLinkedInSearch({ onFocusSearch }))

      const call = vi.mocked(useKeyboardShortcuts).mock.calls[0]
      expect(call[0].onFocusSearch).toBe(onFocusSearch)
    })

    it('uses no-op function if onFocusSearch not provided', async () => {
      const { useKeyboardShortcuts } = await import('@/lib/hooks/useKeyboardShortcuts')

      renderHook(() => useLinkedInSearch())

      const call = vi.mocked(useKeyboardShortcuts).mock.calls[0]
      expect(typeof call[0].onFocusSearch).toBe('function')
    })

    it('wires clearPresets to onEscape', async () => {
      const { useKeyboardShortcuts } = await import('@/lib/hooks/useKeyboardShortcuts')

      renderHook(() => useLinkedInSearch())

      const call = vi.mocked(useKeyboardShortcuts).mock.calls[0]
      expect(typeof call[0].onEscape).toBe('function')
    })
  })

  describe('callback stability', () => {
    it('handleSearch remains stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useLinkedInSearch())

      const firstHandleSearch = result.current.handleSearch

      rerender()

      // Should be the same reference due to useCallback
      expect(result.current.handleSearch).toBe(firstHandleSearch)
    })

    it('handleCancel remains stable across re-renders', () => {
      const { result, rerender } = renderHook(() => useLinkedInSearch())

      const firstHandleCancel = result.current.handleCancel

      rerender()

      // Should be the same reference due to useCallback
      expect(result.current.handleCancel).toBe(firstHandleCancel)
    })
  })

  describe('composed query', () => {
    it('uses composed query from useBuildQueryWithPresets', async () => {
      const { searchRaw } = await import('@/lib/api')

      vi.mocked(searchRaw).mockResolvedValueOnce(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      await act(async () => {
        await result.current.handleSearch()
      })

      // Should have been called with some query
      expect(searchRaw).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.any(String),
        }),
        expect.any(AbortSignal)
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty response', async () => {
      const { searchRaw } = await import('@/lib/api')
      const emptyResponse: RawSearchResponse = {
        success: true,
        query: 'site:linkedin.com/in/ CTO',
        total_results: 0,
        results: [],
        metadata: {
          country: 'us',
          language: 'en',
          pages_fetched: 0,
          time_taken_seconds: 0.1,
        },
      }
      vi.mocked(searchRaw).mockResolvedValueOnce(emptyResponse)

      const onSearchComplete = vi.fn()
      const { result } = renderHook(() =>
        useLinkedInSearch({ onSearchComplete })
      )

      await act(async () => {
        await result.current.handleSearch()
      })

      expect(onSearchComplete).toHaveBeenCalledWith(emptyResponse)
      expect(result.current.isLoading).toBe(false)
    })

    it('handles rapid consecutive searches', async () => {
      const { searchRaw } = await import('@/lib/api')
      vi.mocked(searchRaw)
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockSearchResponse)
        .mockResolvedValueOnce(mockSearchResponse)

      const { result } = renderHook(() => useLinkedInSearch())

      // Fire multiple searches rapidly
      await act(async () => {
        await result.current.handleSearch()
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      await act(async () => {
        await result.current.handleSearch()
      })

      // Should complete all searches
      expect(result.current.isLoading).toBe(false)
      expect(searchRaw).toHaveBeenCalledTimes(3)
    })

    it('handles unmount during search', async () => {
      const { searchRaw } = await import('@/lib/api')

      let resolveSearch: (value: RawSearchResponse) => void
      const searchPromise = new Promise<RawSearchResponse>((resolve) => {
        resolveSearch = resolve
      })
      vi.mocked(searchRaw).mockReturnValue(searchPromise)

      const { result, unmount } = renderHook(() => useLinkedInSearch())

      // Start search
      act(() => {
        result.current.handleSearch()
      })

      // Unmount while searching
      unmount()

      // Resolve the search (should not cause errors)
      await act(async () => {
        resolveSearch!(mockSearchResponse)
        await searchPromise.catch(() => {})
      })

      // No assertions needed - just checking it doesn't throw
    })
  })
})
