/**
 * Tests for test utilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createMockSearchHistoryEntry,
  createMockSavedSearch,
  createMockCustomPreset,
  createMockUnifiedResult,
  createMockAggregatedResult,
  createMockRawSearchResponse,
  createMockSearchHistoryBatch,
  createMockUnifiedResultBatch,
} from './testUtils'

describe('Test Utilities - Mock Factories', () => {
  describe('createMockSearchHistoryEntry', () => {
    it('creates a valid search history entry with defaults', () => {
      const entry = createMockSearchHistoryEntry()

      expect(entry).toMatchObject({
        id: expect.stringContaining('history_'),
        timestamp: expect.any(String),
        query: {
          baseQuery: 'software engineer',
          activePresetIds: expect.any(Array),
          activeLocationIds: expect.any(Array),
          country: 'us',
          language: 'en',
          maxResults: 30,
          composedQuery: expect.any(String),
        },
        results: expect.any(Array),
        metadata: {
          country: 'us',
          language: 'en',
          pages_fetched: expect.any(Number),
          time_taken_seconds: expect.any(Number),
        },
        totalResults: expect.any(Number),
        sizeBytes: expect.any(Number),
        compressed: false,
      })
    })

    it('applies overrides correctly', () => {
      const entry = createMockSearchHistoryEntry({
        compressed: true,
        query: { baseQuery: 'custom query' } as any,
      })

      expect(entry.compressed).toBe(true)
      expect(entry.query.baseQuery).toBe('custom query')
    })
  })

  describe('createMockSavedSearch', () => {
    it('creates a valid saved search with defaults', () => {
      const search = createMockSavedSearch()

      expect(search).toMatchObject({
        id: expect.stringContaining('search_'),
        name: expect.any(String),
        description: expect.any(String),
        tags: expect.any(Array),
        createdAt: expect.any(String),
        lastUsedAt: expect.any(String),
        useCount: expect.any(Number),
        state: {
          baseQuery: expect.any(String),
          activePresetIds: expect.any(Array),
          activeLocationIds: expect.any(Array),
          country: expect.any(String),
          language: expect.any(String),
          maxResults: expect.any(Number),
        },
      })
    })

    it('applies overrides correctly', () => {
      const search = createMockSavedSearch({
        name: 'Custom Search',
        useCount: 42,
      })

      expect(search.name).toBe('Custom Search')
      expect(search.useCount).toBe(42)
    })
  })

  describe('createMockCustomPreset', () => {
    it('creates a valid custom preset with defaults', () => {
      const preset = createMockCustomPreset()

      expect(preset).toMatchObject({
        id: expect.stringContaining('custom_'),
        category: 'custom',
        label: expect.any(String),
        description: expect.any(String),
        queryFragment: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })
    })

    it('applies overrides correctly', () => {
      const preset = createMockCustomPreset({
        label: 'AI Specialist',
        queryFragment: 'artificial intelligence',
      })

      expect(preset.label).toBe('AI Specialist')
      expect(preset.queryFragment).toBe('artificial intelligence')
    })
  })

  describe('createMockUnifiedResult', () => {
    it('creates a valid unified result with defaults', () => {
      const result = createMockUnifiedResult()

      expect(result).toMatchObject({
        url: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        type: 'profile',
        rank: expect.any(Number),
        author_name: expect.any(String),
        company_name: expect.any(String),
        followers: expect.any(Number),
        location: expect.any(String),
      })
    })

    it('applies overrides correctly', () => {
      const result = createMockUnifiedResult({
        type: 'company',
        rank: 5,
      })

      expect(result.type).toBe('company')
      expect(result.rank).toBe(5)
    })
  })

  describe('createMockAggregatedResult', () => {
    it('creates an aggregated result with source queries', () => {
      const result = createMockAggregatedResult()

      expect(result).toMatchObject({
        sourceQueries: expect.any(Array),
        firstSeenAt: expect.any(Number),
        url: expect.any(String),
        title: expect.any(String),
      })
      expect(result.sourceQueries.length).toBeGreaterThan(0)
    })
  })

  describe('createMockRawSearchResponse', () => {
    it('creates a valid raw search response', () => {
      const response = createMockRawSearchResponse()

      expect(response).toMatchObject({
        success: true,
        query: expect.any(String),
        total_results: expect.any(Number),
        results: expect.any(Array),
        metadata: {
          country: expect.any(String),
          language: expect.any(String),
          pages_fetched: expect.any(Number),
          time_taken_seconds: expect.any(Number),
        },
      })
    })

    it('applies overrides correctly', () => {
      const response = createMockRawSearchResponse({
        success: false,
        total_results: 0,
      })

      expect(response.success).toBe(false)
      expect(response.total_results).toBe(0)
    })
  })

  describe('Batch Creators', () => {
    it('creates a batch of search history entries', () => {
      const batch = createMockSearchHistoryBatch(5)

      expect(batch).toHaveLength(5)
      expect(batch[0].id).not.toBe(batch[1].id)
      batch.forEach((entry, i) => {
        expect(entry.query.baseQuery).toBe(`test query ${i}`)
      })
    })

    it('creates a batch of unified results', () => {
      const batch = createMockUnifiedResultBatch(3)

      expect(batch).toHaveLength(3)
      batch.forEach((result, i) => {
        expect(result.rank).toBe(i + 1)
        expect(result.title).toBe(`Result ${i + 1}`)
      })
    })
  })
})
