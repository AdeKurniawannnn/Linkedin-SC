/**
 * Test Suite for resultsStore
 *
 * Tests the Zustand results store with sessionStorage persistence,
 * deduplication logic, metadata aggregation, and state management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useResultsStore } from '@/stores/resultsStore'
import {
  createMockUnifiedResult,
  createMockRawSearchResponse,
  createMockUnifiedResultBatch,
} from '@/tests/utils/testUtils'
import type { UnifiedResult, RawSearchResponse } from '@/lib/api'

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
})

describe('resultsStore', () => {
  beforeEach(() => {
    // Clear sessionStorage and reset store before each test
    mockSessionStorage.clear()
    useResultsStore.getState().clearResults()
  })

  // ============ Group 1: Initial State ============
  describe('initial state', () => {
    it('starts with empty/null results', () => {
      const state = useResultsStore.getState()
      expect(state.results).toBeNull()
    })

    it('starts with null aggregated metadata', () => {
      const state = useResultsStore.getState()
      expect(state.aggregatedMetadata).toBeNull()
    })

    it('starts with no error', () => {
      const state = useResultsStore.getState()
      expect(state.error).toBeNull()
    })

    it('starts in non-loading state', () => {
      const state = useResultsStore.getState()
      expect(state.isLoading).toBe(false)
    })

    it('starts with null historyTimestamp', () => {
      const state = useResultsStore.getState()
      expect(state.historyTimestamp).toBeNull()
    })
  })

  // ============ Group 2: setResults (legacy method) ============
  describe('setResults', () => {
    it('sets results correctly', () => {
      const results = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test query')

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(3)
      expect(state.results?.[0].url).toBe(results[0].url)
    })

    it('converts UnifiedResult to AggregatedResult with sourceQueries', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'software engineer')

      const state = useResultsStore.getState()
      expect(state.results?.[0]).toHaveProperty('sourceQueries')
      expect(state.results?.[0].sourceQueries).toEqual(['software engineer'])
    })

    it('adds firstSeenAt timestamp to each result', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata
      const beforeTimestamp = Date.now()

      useResultsStore.getState().setResults(results, metadata, 'test query')

      const state = useResultsStore.getState()
      expect(state.results?.[0]).toHaveProperty('firstSeenAt')
      expect(state.results?.[0].firstSeenAt).toBeGreaterThanOrEqual(beforeTimestamp)
    })

    it('creates metadata with single query', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'query 1')

      const state = useResultsStore.getState()
      expect(state.aggregatedMetadata?.queryCount).toBe(1)
      expect(state.aggregatedMetadata?.queries).toEqual(['query 1'])
    })

    it('replaces existing results instead of appending', () => {
      const results1 = createMockUnifiedResultBatch(2)
      const results2 = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results1, metadata, 'query 1')
      useResultsStore.getState().setResults(results2, metadata, 'query 2')

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(3) // Not 5 (replaced, not appended)
    })

    it('clears historyTimestamp when setting fresh results', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      // First load from history
      useResultsStore.getState().loadFromHistory(results, metadata, 'old query', 123456)
      expect(useResultsStore.getState().historyTimestamp).toBe(123456)

      // Then set fresh results
      useResultsStore.getState().setResults(results, metadata, 'new query')
      expect(useResultsStore.getState().historyTimestamp).toBeNull()
    })

    it('clears error state when setting results', () => {
      useResultsStore.getState().setError('Previous error')
      expect(useResultsStore.getState().error).toBe('Previous error')

      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata
      useResultsStore.getState().setResults(results, metadata, 'test query')

      expect(useResultsStore.getState().error).toBeNull()
    })

    it('sets isLoading to false after setting results', () => {
      useResultsStore.getState().setLoading(true)

      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata
      useResultsStore.getState().setResults(results, metadata, 'test query')

      expect(useResultsStore.getState().isLoading).toBe(false)
    })
  })

  // ============ Group 3: appendResults (primary method) ============
  describe('appendResults', () => {
    it('appends results to empty store', () => {
      const results = createMockUnifiedResultBatch(2)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results, metadata, 'query 1')

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(2)
    })

    it('appends new results to existing results', () => {
      const results1 = createMockUnifiedResultBatch(2)
      const results2 = [
        createMockUnifiedResult({ url: 'https://linkedin.com/in/new-user-1' }),
        createMockUnifiedResult({ url: 'https://linkedin.com/in/new-user-2' }),
      ]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'query 1')
      useResultsStore.getState().appendResults(results2, metadata, 'query 2')

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(4) // 2 + 2 = 4 (no duplicates)
    })

    it('deduplicates results by URL', () => {
      const duplicateUrl = 'https://linkedin.com/in/john-doe'
      const results1 = [createMockUnifiedResult({ url: duplicateUrl })]
      const results2 = [createMockUnifiedResult({ url: duplicateUrl })]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'query 1')
      useResultsStore.getState().appendResults(results2, metadata, 'query 2')

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(1) // Deduplicated
    })

    it('merges sourceQueries for duplicate URLs', () => {
      const duplicateUrl = 'https://linkedin.com/in/john-doe'
      const results1 = [createMockUnifiedResult({ url: duplicateUrl })]
      const results2 = [createMockUnifiedResult({ url: duplicateUrl })]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'query 1')
      useResultsStore.getState().appendResults(results2, metadata, 'query 2')

      const state = useResultsStore.getState()
      expect(state.results?.[0].sourceQueries).toEqual(['query 1', 'query 2'])
    })

    it('does not duplicate queries in sourceQueries', () => {
      const duplicateUrl = 'https://linkedin.com/in/john-doe'
      const results = [createMockUnifiedResult({ url: duplicateUrl })]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results, metadata, 'same query')
      useResultsStore.getState().appendResults(results, metadata, 'same query')

      const state = useResultsStore.getState()
      expect(state.results?.[0].sourceQueries).toEqual(['same query']) // Not ['same query', 'same query']
    })

    it('aggregates metadata across multiple queries', () => {
      const results1 = createMockUnifiedResultBatch(2)
      const results2 = createMockUnifiedResultBatch(2)
      const metadata1 = { country: 'us', language: 'en', pages_fetched: 2, time_taken_seconds: 1.5 }
      const metadata2 = { country: 'us', language: 'en', pages_fetched: 3, time_taken_seconds: 2.0 }

      useResultsStore.getState().appendResults(results1, metadata1, 'query 1')
      useResultsStore.getState().appendResults(results2, metadata2, 'query 2')

      const state = useResultsStore.getState()
      expect(state.aggregatedMetadata?.queryCount).toBe(2)
      expect(state.aggregatedMetadata?.totalPagesFetched).toBe(5) // 2 + 3
      expect(state.aggregatedMetadata?.totalTimeSeconds).toBe(3.5) // 1.5 + 2.0
      expect(state.aggregatedMetadata?.totalRawResults).toBe(4) // 2 + 2
    })

    it('updates totalUniqueResults correctly with deduplication', () => {
      const duplicateUrl = 'https://linkedin.com/in/john-doe'
      const results1 = [
        createMockUnifiedResult({ url: duplicateUrl }),
        createMockUnifiedResult({ url: 'https://linkedin.com/in/jane-doe' }),
      ]
      const results2 = [
        createMockUnifiedResult({ url: duplicateUrl }), // Duplicate
      ]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'query 1')
      useResultsStore.getState().appendResults(results2, metadata, 'query 2')

      const state = useResultsStore.getState()
      expect(state.aggregatedMetadata?.totalUniqueResults).toBe(2) // 2 unique, not 3
      expect(state.aggregatedMetadata?.totalRawResults).toBe(3) // 2 + 1 = 3 raw
    })

    it('clears historyTimestamp on fresh append', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      // Load from history first
      useResultsStore.getState().loadFromHistory(results, metadata, 'old', 123456)
      expect(useResultsStore.getState().historyTimestamp).toBe(123456)

      // Append new results (fresh search)
      useResultsStore.getState().appendResults(results, metadata, 'new')
      expect(useResultsStore.getState().historyTimestamp).toBeNull()
    })
  })

  // ============ Group 4: loadFromHistory ============
  describe('loadFromHistory', () => {
    it('loads results from history', () => {
      const results = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata
      const timestamp = Date.now() - 3600000 // 1 hour ago

      useResultsStore.getState().loadFromHistory(results, metadata, 'old query', timestamp)

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(3)
    })

    it('sets historyTimestamp when loading from history', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata
      const timestamp = 1234567890

      useResultsStore.getState().loadFromHistory(results, metadata, 'test', timestamp)

      expect(useResultsStore.getState().historyTimestamp).toBe(timestamp)
    })

    it('converts results to AggregatedResult with sourceQueries', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().loadFromHistory(results, metadata, 'historical query', 123)

      const state = useResultsStore.getState()
      expect(state.results?.[0]).toHaveProperty('sourceQueries')
      expect(state.results?.[0].sourceQueries).toEqual(['historical query'])
    })

    it('creates metadata for historical results', () => {
      const results = createMockUnifiedResultBatch(5)
      const metadata = { country: 'id', language: 'id', pages_fetched: 10, time_taken_seconds: 5.0 }

      useResultsStore.getState().loadFromHistory(results, metadata, 'historical', 123)

      const state = useResultsStore.getState()
      expect(state.aggregatedMetadata?.totalUniqueResults).toBe(5)
      expect(state.aggregatedMetadata?.totalRawResults).toBe(5)
      expect(state.aggregatedMetadata?.queryCount).toBe(1)
      expect(state.aggregatedMetadata?.totalPagesFetched).toBe(10)
      expect(state.aggregatedMetadata?.totalTimeSeconds).toBe(5.0)
    })

    it('replaces existing results when loading from history', () => {
      const results1 = createMockUnifiedResultBatch(2)
      const results2 = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results1, metadata, 'current')
      useResultsStore.getState().loadFromHistory(results2, metadata, 'historical', 123)

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(3) // Replaced
    })
  })

  // ============ Group 5: clearResults ============
  describe('clearResults', () => {
    it('clears all results', () => {
      const results = createMockUnifiedResultBatch(5)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')
      useResultsStore.getState().clearResults()

      expect(useResultsStore.getState().results).toBeNull()
    })

    it('clears aggregated metadata', () => {
      const results = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')
      useResultsStore.getState().clearResults()

      expect(useResultsStore.getState().aggregatedMetadata).toBeNull()
    })

    it('clears error state', () => {
      useResultsStore.getState().setError('Test error')
      useResultsStore.getState().clearResults()

      expect(useResultsStore.getState().error).toBeNull()
    })

    it('resets loading state', () => {
      useResultsStore.getState().setLoading(true)
      useResultsStore.getState().clearResults()

      expect(useResultsStore.getState().isLoading).toBe(false)
    })

    it('clears historyTimestamp', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().loadFromHistory(results, metadata, 'test', 123456)
      useResultsStore.getState().clearResults()

      expect(useResultsStore.getState().historyTimestamp).toBeNull()
    })

    it('resets to initial state values', () => {
      const results = createMockUnifiedResultBatch(2)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')
      useResultsStore.getState().clearResults()

      // Verify all state is cleared
      const state = useResultsStore.getState()
      expect(state.results).toBeNull()
      expect(state.aggregatedMetadata).toBeNull()
      expect(state.error).toBeNull()
      expect(state.isLoading).toBe(false)
      expect(state.historyTimestamp).toBeNull()
    })
  })

  // ============ Group 6: Error handling ============
  describe('setError', () => {
    it('sets error message', () => {
      useResultsStore.getState().setError('API request failed')

      expect(useResultsStore.getState().error).toBe('API request failed')
    })

    it('clears results when error occurs', () => {
      const results = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')
      useResultsStore.getState().setError('Something went wrong')

      expect(useResultsStore.getState().results).toBeNull()
    })

    it('clears metadata when error occurs', () => {
      const results = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')
      useResultsStore.getState().setError('Something went wrong')

      expect(useResultsStore.getState().aggregatedMetadata).toBeNull()
    })

    it('sets isLoading to false when error occurs', () => {
      useResultsStore.getState().setLoading(true)
      useResultsStore.getState().setError('Network error')

      expect(useResultsStore.getState().isLoading).toBe(false)
    })
  })

  // ============ Group 7: Loading state ============
  describe('setLoading', () => {
    it('sets loading to true', () => {
      useResultsStore.getState().setLoading(true)

      expect(useResultsStore.getState().isLoading).toBe(true)
    })

    it('sets loading to false', () => {
      useResultsStore.getState().setLoading(true)
      useResultsStore.getState().setLoading(false)

      expect(useResultsStore.getState().isLoading).toBe(false)
    })

    it('does not clear results when setting loading state', () => {
      const results = createMockUnifiedResultBatch(2)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')
      useResultsStore.getState().setLoading(true)

      expect(useResultsStore.getState().results).toHaveLength(2)
    })
  })

  // ============ Group 8: State persistence behavior ============
  describe('state persistence behavior', () => {
    it('maintains results in memory across actions', () => {
      const results = createMockUnifiedResultBatch(2)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test query')
      const state1 = useResultsStore.getState()

      useResultsStore.getState().setLoading(true)
      const state2 = useResultsStore.getState()

      // Results should be maintained
      expect(state2.results).toHaveLength(2)
      expect(state2.results?.[0].url).toBe(state1.results?.[0].url)
    })

    it('maintains aggregatedMetadata across actions', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')
      const meta1 = useResultsStore.getState().aggregatedMetadata

      useResultsStore.getState().setLoading(true)
      const meta2 = useResultsStore.getState().aggregatedMetadata

      expect(meta2).toEqual(meta1)
      expect(meta2?.queryCount).toBe(1)
    })

    it('maintains historyTimestamp across loading changes', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().loadFromHistory(results, metadata, 'test', 987654321)

      useResultsStore.getState().setLoading(true)
      useResultsStore.getState().setLoading(false)

      expect(useResultsStore.getState().historyTimestamp).toBe(987654321)
    })

    it('preserves result structure across operations', () => {
      const results = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      // Set results
      useResultsStore.getState().setResults(results, metadata, 'test')

      // Get current state
      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(3)

      // Verify structure is preserved
      const firstResult = state.results?.[0]
      expect(firstResult).toHaveProperty('url')
      expect(firstResult).toHaveProperty('sourceQueries')
      expect(firstResult).toHaveProperty('firstSeenAt')
    })

    it('handles state transitions correctly', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      // Initial: empty
      expect(useResultsStore.getState().results).toBeNull()

      // After setResults: populated
      useResultsStore.getState().setResults(results, metadata, 'test')
      expect(useResultsStore.getState().results).toHaveLength(1)

      // After clearResults: empty again
      useResultsStore.getState().clearResults()
      expect(useResultsStore.getState().results).toBeNull()
    })
  })

  // ============ Group 9: Metadata aggregation details ============
  describe('metadata aggregation', () => {
    it('sums totalRawResults across queries', () => {
      const results1 = createMockUnifiedResultBatch(5)
      const results2 = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'query 1')
      useResultsStore.getState().appendResults(results2, metadata, 'query 2')

      expect(useResultsStore.getState().aggregatedMetadata?.totalRawResults).toBe(8)
    })

    it('counts unique queries correctly', () => {
      const results = [createMockUnifiedResult({ url: 'https://linkedin.com/in/test' })]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results, metadata, 'query 1')
      useResultsStore.getState().appendResults(results, metadata, 'query 2')
      useResultsStore.getState().appendResults(results, metadata, 'query 1') // Duplicate

      const state = useResultsStore.getState()
      expect(state.aggregatedMetadata?.queryCount).toBe(2) // Not 3
      expect(state.aggregatedMetadata?.queries).toEqual(['query 1', 'query 2'])
    })

    it('sums time_taken_seconds across queries', () => {
      const results = [createMockUnifiedResult()]
      const metadata1 = { country: 'us', language: 'en', pages_fetched: 1, time_taken_seconds: 1.2 }
      const metadata2 = { country: 'us', language: 'en', pages_fetched: 1, time_taken_seconds: 2.3 }
      const metadata3 = { country: 'us', language: 'en', pages_fetched: 1, time_taken_seconds: 0.5 }

      useResultsStore.getState().appendResults(results, metadata1, 'q1')
      useResultsStore.getState().appendResults(results, metadata2, 'q2')
      useResultsStore.getState().appendResults(results, metadata3, 'q3')

      expect(useResultsStore.getState().aggregatedMetadata?.totalTimeSeconds).toBeCloseTo(4.0)
    })

    it('sums pages_fetched across queries', () => {
      const results = [createMockUnifiedResult()]
      const metadata1 = { country: 'us', language: 'en', pages_fetched: 5, time_taken_seconds: 1.0 }
      const metadata2 = { country: 'us', language: 'en', pages_fetched: 8, time_taken_seconds: 1.0 }

      useResultsStore.getState().appendResults(results, metadata1, 'q1')
      useResultsStore.getState().appendResults(results, metadata2, 'q2')

      expect(useResultsStore.getState().aggregatedMetadata?.totalPagesFetched).toBe(13)
    })

    it('maintains correct totalUniqueResults with deduplication', () => {
      const url1 = 'https://linkedin.com/in/user-1'
      const url2 = 'https://linkedin.com/in/user-2'

      const results1 = [
        createMockUnifiedResult({ url: url1 }),
        createMockUnifiedResult({ url: url2 }),
      ]
      const results2 = [
        createMockUnifiedResult({ url: url1 }), // Duplicate
        createMockUnifiedResult({ url: 'https://linkedin.com/in/user-3' }), // New
      ]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'query 1')
      useResultsStore.getState().appendResults(results2, metadata, 'query 2')

      expect(useResultsStore.getState().aggregatedMetadata?.totalUniqueResults).toBe(3)
      expect(useResultsStore.getState().aggregatedMetadata?.totalRawResults).toBe(4)
    })
  })

  // ============ Group 10: Edge cases ============
  describe('edge cases', () => {
    it('handles empty results array', () => {
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults([], metadata, 'empty query')

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(0)
      expect(state.aggregatedMetadata?.totalUniqueResults).toBe(0)
    })

    it('handles append with empty results', () => {
      const results1 = createMockUnifiedResultBatch(3)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'query 1')
      useResultsStore.getState().appendResults([], metadata, 'query 2')

      const state = useResultsStore.getState()
      expect(state.results).toHaveLength(3) // Unchanged
      expect(state.aggregatedMetadata?.queryCount).toBe(2) // But metadata updated
    })

    it('preserves existing result data when merging duplicates', () => {
      const url = 'https://linkedin.com/in/john-doe'
      const result1 = createMockUnifiedResult({
        url,
        title: 'Original Title',
        followers: 1000,
      })
      const result2 = createMockUnifiedResult({
        url,
        title: 'Different Title',
        followers: 2000,
      })
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults([result1], metadata, 'query 1')
      useResultsStore.getState().appendResults([result2], metadata, 'query 2')

      const state = useResultsStore.getState()
      // Should keep the first result's data, only add to sourceQueries
      expect(state.results?.[0].title).toBe('Original Title')
      expect(state.results?.[0].followers).toBe(1000)
      expect(state.results?.[0].sourceQueries).toEqual(['query 1', 'query 2'])
    })

    it('handles multiple appends of the same query', () => {
      const results1 = createMockUnifiedResultBatch(2)
      const results2 = createMockUnifiedResultBatch(2)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'same query')
      useResultsStore.getState().appendResults(results2, metadata, 'same query')

      const state = useResultsStore.getState()
      expect(state.aggregatedMetadata?.queryCount).toBe(1) // Not 2
      expect(state.aggregatedMetadata?.queries).toEqual(['same query'])
    })

    it('handles very large result sets', () => {
      const largeResultSet = createMockUnifiedResultBatch(1000)
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(largeResultSet, metadata, 'large query')

      expect(useResultsStore.getState().results).toHaveLength(1000)
      expect(useResultsStore.getState().aggregatedMetadata?.totalUniqueResults).toBe(1000)
    })

    it('handles special characters in query strings', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata
      const specialQuery = 'software "engineer" (senior OR lead) -recruiter'

      useResultsStore.getState().setResults(results, metadata, specialQuery)

      expect(useResultsStore.getState().aggregatedMetadata?.queries).toContain(specialQuery)
    })

    it('handles deduplication with case-sensitive URLs', () => {
      // URLs should be case-sensitive (linkedin.com/in/JohnDoe !== linkedin.com/in/johndoe)
      const url1 = 'https://linkedin.com/in/JohnDoe'
      const url2 = 'https://linkedin.com/in/johndoe'

      const results1 = [createMockUnifiedResult({ url: url1 })]
      const results2 = [createMockUnifiedResult({ url: url2 })]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'query 1')
      useResultsStore.getState().appendResults(results2, metadata, 'query 2')

      expect(useResultsStore.getState().results).toHaveLength(2) // Not deduplicated
    })
  })

  // ============ Group 11: Complex workflows ============
  describe('complex workflows', () => {
    it('handles multi-query workflow with mixed deduplication', () => {
      const sharedUrl = 'https://linkedin.com/in/shared-profile'

      const results1 = [
        createMockUnifiedResult({ url: sharedUrl, title: 'Shared Profile' }),
        createMockUnifiedResult({ url: 'https://linkedin.com/in/profile-1' }),
      ]

      const results2 = [
        createMockUnifiedResult({ url: sharedUrl, title: 'Shared Profile Again' }),
        createMockUnifiedResult({ url: 'https://linkedin.com/in/profile-2' }),
      ]

      const results3 = [
        createMockUnifiedResult({ url: 'https://linkedin.com/in/profile-3' }),
      ]

      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().appendResults(results1, metadata, 'engineers')
      useResultsStore.getState().appendResults(results2, metadata, 'developers')
      useResultsStore.getState().appendResults(results3, metadata, 'programmers')

      const state = useResultsStore.getState()

      // Verify results
      expect(state.results).toHaveLength(4) // 5 total - 1 duplicate = 4 unique

      // Verify shared profile has both queries
      const sharedProfile = state.results?.find(r => r.url === sharedUrl)
      expect(sharedProfile?.sourceQueries).toEqual(['engineers', 'developers'])

      // Verify metadata
      expect(state.aggregatedMetadata?.totalUniqueResults).toBe(4)
      expect(state.aggregatedMetadata?.totalRawResults).toBe(5)
      expect(state.aggregatedMetadata?.queryCount).toBe(3)
    })

    it('handles workflow: setResults → appendResults → clearResults', () => {
      const metadata = createMockRawSearchResponse().metadata

      // Initial set
      const initial = createMockUnifiedResultBatch(2)
      useResultsStore.getState().setResults(initial, metadata, 'initial')
      expect(useResultsStore.getState().results).toHaveLength(2)

      // Append more with unique URLs
      const additional = [
        createMockUnifiedResult({ url: 'https://linkedin.com/in/new-user-1' }),
        createMockUnifiedResult({ url: 'https://linkedin.com/in/new-user-2' }),
        createMockUnifiedResult({ url: 'https://linkedin.com/in/new-user-3' }),
      ]
      useResultsStore.getState().appendResults(additional, metadata, 'additional')
      expect(useResultsStore.getState().results).toHaveLength(5)

      // Clear all
      useResultsStore.getState().clearResults()
      expect(useResultsStore.getState().results).toBeNull()
    })

    it('handles workflow: loadFromHistory → appendResults (new search)', () => {
      const metadata = createMockRawSearchResponse().metadata

      // Load historical results
      const historical = createMockUnifiedResultBatch(3)
      useResultsStore.getState().loadFromHistory(historical, metadata, 'old query', 123456789)
      expect(useResultsStore.getState().historyTimestamp).toBe(123456789)
      expect(useResultsStore.getState().results).toHaveLength(3)

      // Append new search results with unique URLs (should clear historyTimestamp)
      const newResults = [
        createMockUnifiedResult({ url: 'https://linkedin.com/in/fresh-user-1' }),
        createMockUnifiedResult({ url: 'https://linkedin.com/in/fresh-user-2' }),
      ]
      useResultsStore.getState().appendResults(newResults, metadata, 'new query')
      expect(useResultsStore.getState().historyTimestamp).toBeNull()
      expect(useResultsStore.getState().results).toHaveLength(5)
    })

    it('handles error during multi-query workflow', () => {
      const metadata = createMockRawSearchResponse().metadata

      // First query succeeds
      useResultsStore.getState().appendResults(
        createMockUnifiedResultBatch(3),
        metadata,
        'query 1'
      )
      expect(useResultsStore.getState().results).toHaveLength(3)

      // Second query fails
      useResultsStore.getState().setError('API rate limit exceeded')
      expect(useResultsStore.getState().results).toBeNull()
      expect(useResultsStore.getState().error).toBe('API rate limit exceeded')

      // Recovery: new successful query
      useResultsStore.getState().appendResults(
        createMockUnifiedResultBatch(2),
        metadata,
        'query 3'
      )
      expect(useResultsStore.getState().results).toHaveLength(2)
      expect(useResultsStore.getState().error).toBeNull()
    })
  })

  // ============ Group 12: Type safety ============
  describe('type safety', () => {
    it('results have correct AggregatedResult type', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')

      const state = useResultsStore.getState()
      const firstResult = state.results?.[0]

      // AggregatedResult extends UnifiedResult with additional fields
      expect(firstResult).toHaveProperty('url')
      expect(firstResult).toHaveProperty('title')
      expect(firstResult).toHaveProperty('sourceQueries')
      expect(firstResult).toHaveProperty('firstSeenAt')
    })

    it('aggregatedMetadata has correct AggregatedMetadata type', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test')

      const state = useResultsStore.getState()
      const meta = state.aggregatedMetadata

      expect(meta).toHaveProperty('totalUniqueResults')
      expect(meta).toHaveProperty('totalRawResults')
      expect(meta).toHaveProperty('queryCount')
      expect(meta).toHaveProperty('queries')
      expect(meta).toHaveProperty('totalTimeSeconds')
      expect(meta).toHaveProperty('totalPagesFetched')
    })

    it('metadata queries array contains strings', () => {
      const results = [createMockUnifiedResult()]
      const metadata = createMockRawSearchResponse().metadata

      useResultsStore.getState().setResults(results, metadata, 'test query')

      const state = useResultsStore.getState()
      const queries = state.aggregatedMetadata?.queries

      expect(Array.isArray(queries)).toBe(true)
      expect(typeof queries?.[0]).toBe('string')
    })
  })
})
