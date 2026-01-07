/**
 * Test Utilities for LinkedinSC Frontend
 *
 * Mock factories and helpers for creating test data
 */

import { vi } from 'vitest'
import React from 'react'
import type { SearchHistoryEntry, SearchHistoryQuery } from '@/stores/searchHistoryStore'
import type { SavedSearch, SavedSearchState } from '@/stores/savedSearchesStore'
import type { CustomPreset } from '@/stores/customPresetsStore'
import type { UnifiedResult, RawSearchResponse, AggregatedResult } from '@/lib/api'
import type { PresetCategory } from '@/config/queryPresets'
import type { PipelineStats } from '@/lib/agent/types'

// ============ Mock Factory Types ============

export interface MockSearchHistoryEntry {
  id: string
  timestamp: string
  query: {
    baseQuery: string
    activePresetIds: string[]
    activeLocationIds: string[]
    country: string
    language: string
    maxResults: number
    composedQuery: string
  }
  results: UnifiedResult[]
  metadata: {
    country: string
    language: string
    pages_fetched: number
    time_taken_seconds: number
  }
  totalResults: number
  sizeBytes: number
  compressed?: boolean
}

// ============ Mock Factories ============

/**
 * Create a mock search history entry
 */
export function createMockSearchHistoryEntry(
  overrides?: Partial<SearchHistoryEntry>
): SearchHistoryEntry {
  const defaultEntry: SearchHistoryEntry = {
    id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    query: {
      baseQuery: 'software engineer',
      activePresetIds: ['seniority_senior'],
      activeLocationIds: ['loc_san_francisco'],
      country: 'us',
      language: 'en',
      maxResults: 30,
      composedQuery: 'software engineer senior San Francisco',
    },
    results: [
      createMockUnifiedResult({ rank: 1 }),
      createMockUnifiedResult({ rank: 2 }),
    ],
    metadata: {
      country: 'us',
      language: 'en',
      pages_fetched: 3,
      time_taken_seconds: 2.5,
    },
    totalResults: 2,
    sizeBytes: 4096,
    compressed: false,
  }

  return {
    ...defaultEntry,
    ...overrides,
    query: {
      ...defaultEntry.query,
      ...(overrides?.query || {}),
    },
    metadata: {
      ...defaultEntry.metadata,
      ...(overrides?.metadata || {}),
    },
  }
}

/**
 * Create a mock saved search
 */
export function createMockSavedSearch(overrides?: Partial<SavedSearch>): SavedSearch {
  const defaultSearch: SavedSearch = {
    id: `search_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Senior Engineers in SF',
    description: 'Senior software engineers in San Francisco area',
    tags: ['engineering', 'senior', 'san-francisco'],
    createdAt: new Date().toISOString(),
    lastUsedAt: new Date().toISOString(),
    useCount: 5,
    state: {
      baseQuery: 'software engineer',
      activePresetIds: ['seniority_senior'],
      activeLocationIds: ['loc_san_francisco'],
      country: 'us',
      language: 'en',
      maxResults: 30,
    },
  }

  return {
    ...defaultSearch,
    ...overrides,
    state: {
      ...defaultSearch.state,
      ...(overrides?.state || {}),
    },
  }
}

/**
 * Create a mock custom preset
 */
export function createMockCustomPreset(overrides?: Partial<CustomPreset>): CustomPreset {
  const defaultPreset: CustomPreset = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    category: 'custom' as PresetCategory | 'custom',
    label: 'My Custom Preset',
    description: 'A custom query preset for testing',
    queryFragment: 'machine learning AND AI',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return {
    ...defaultPreset,
    ...overrides,
  }
}

/**
 * Create a mock unified result
 */
export function createMockUnifiedResult(overrides?: Partial<UnifiedResult>): UnifiedResult {
  const defaultResult: UnifiedResult = {
    url: 'https://www.linkedin.com/in/john-doe',
    title: 'John Doe - Software Engineer at Tech Corp',
    description: 'Experienced software engineer with 10+ years in backend development',
    type: 'profile',
    rank: 1,
    author_name: 'John Doe',
    company_name: 'Tech Corp',
    followers: 5000,
    location: 'San Francisco, CA',
  }

  return {
    ...defaultResult,
    ...overrides,
  }
}

/**
 * Create a mock aggregated result (with source queries)
 */
export function createMockAggregatedResult(
  overrides?: Partial<AggregatedResult>
): AggregatedResult {
  const baseResult = createMockUnifiedResult(overrides)

  return {
    ...baseResult,
    sourceQueries: ['query 1', 'query 2'],
    firstSeenAt: Date.now(),
    ...overrides,
  }
}

/**
 * Create a mock raw search response
 */
export function createMockRawSearchResponse(
  overrides?: Partial<RawSearchResponse>
): RawSearchResponse {
  const defaultResponse: RawSearchResponse = {
    success: true,
    query: 'software engineer senior',
    total_results: 2,
    results: [
      createMockUnifiedResult({ rank: 1 }),
      createMockUnifiedResult({ rank: 2 }),
    ],
    metadata: {
      country: 'us',
      language: 'en',
      pages_fetched: 3,
      time_taken_seconds: 2.5,
    },
  }

  return {
    ...defaultResponse,
    ...overrides,
    metadata: {
      ...defaultResponse.metadata,
      ...(overrides?.metadata || {}),
    },
  }
}

/**
 * Create mock pipeline stats
 */
export function createMockPipelineStats(overrides?: Partial<PipelineStats>): PipelineStats {
  const defaultStats: PipelineStats = {
    generated: 10,
    pass1Pending: 2,
    pass1Passed: 6,
    pass1Rejected: 2,
    pass2Pending: 3,
    pass2Passed: 3,
    pass2Rejected: 0,
    executing: 1,
    completed: 2,
  }

  return {
    ...defaultStats,
    ...overrides,
  }
}

// ============ Store Reset Utilities ============

/**
 * Reset all Zustand stores to initial state
 */
export function resetAllStores(): void {
  // Import stores dynamically to avoid circular dependencies
  const stores = [
    require('@/stores/searchHistoryStore').useSearchHistoryStore,
    require('@/stores/savedSearchesStore').useSavedSearchesStore,
    require('@/stores/customPresetsStore').useCustomPresetsStore,
    require('@/stores/resultsStore').useResultsStore,
    require('@/stores/queryBuilderStore').useQueryBuilderStore,
    require('@/stores/agentSessionStore').useAgentSessionStore,
  ]

  stores.forEach((store) => {
    if (store?.persist?.clearStorage) {
      store.persist.clearStorage()
    }
  })
}

// ============ Convex Test Wrapper ============

/**
 * Wrapper component for testing components that use Convex
 * Provides mocked ConvexReactClient context
 */
export function ConvexTestWrapper({ children }: { children: React.ReactNode }): JSX.Element {
  // Mock ConvexProvider if needed
  // For now, just return children as-is since tests should mock useQuery/useMutation
  return <>{children}</>
}

// ============ Helper Utilities ============

/**
 * Wait for async state updates to complete
 */
export function waitForStoreUpdate(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Create a batch of mock search history entries
 */
export function createMockSearchHistoryBatch(count: number): SearchHistoryEntry[] {
  return Array.from({ length: count }, (_, i) =>
    createMockSearchHistoryEntry({
      id: `history_${i}`,
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      query: {
        baseQuery: `test query ${i}`,
        activePresetIds: [],
        activeLocationIds: [],
        country: 'us',
        language: 'en',
        maxResults: 30,
        composedQuery: `test query ${i}`,
      },
    })
  )
}

/**
 * Create a batch of mock unified results
 */
export function createMockUnifiedResultBatch(count: number): UnifiedResult[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUnifiedResult({
      rank: i + 1,
      title: `Result ${i + 1}`,
      url: `https://www.linkedin.com/in/user-${i}`,
    })
  )
}

// ============ Type Exports ============

export type {
  SearchHistoryEntry,
  SearchHistoryQuery,
  SavedSearch,
  SavedSearchState,
  CustomPreset,
  UnifiedResult,
  RawSearchResponse,
  AggregatedResult,
  PipelineStats,
}
