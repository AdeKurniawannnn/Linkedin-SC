import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBuildQueryWithPresets } from '@/hooks/useBuildQueryWithPresets'
import { useQueryBuilderStore } from '@/stores/queryBuilderStore'
import { useConvexCustomPresets } from '@/hooks/useConvexCustomPresets'
import type { Id } from '@/convex/_generated/dataModel'

// Mock the dependencies
vi.mock('@/stores/queryBuilderStore')
vi.mock('@/hooks/useConvexCustomPresets')

describe('useBuildQueryWithPresets', () => {
  // Mock preset IDs
  const mockPresetId1 = 'preset-1' as Id<'customPresets'>
  const mockPresetId2 = 'preset-2' as Id<'customPresets'>
  const mockPresetId3 = 'preset-3' as Id<'customPresets'>

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
      const mockState = {
        buildQuery: () => 'site:linkedin.com/in/',
        activePresetIds: [],
      }
      return selector(mockState)
    })

    vi.mocked(useConvexCustomPresets).mockReturnValue({
      presets: [],
      isLoading: false,
      addPreset: vi.fn(),
      updatePreset: vi.fn(),
      deletePreset: vi.fn(),
      getPresetsByCategory: vi.fn(),
      getPresetById: vi.fn(),
    })
  })

  describe('basic query building', () => {
    it('combines base query with custom preset fragments', () => {
      // Mock base query
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/ CTO',
          activePresetIds: [mockPresetId1, mockPresetId2],
        }
        return selector(mockState)
      })

      // Mock custom presets
      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'industry',
            label: 'Fintech',
            description: 'Financial technology',
            queryFragment: 'fintech OR "financial services"',
            _creationTime: Date.now(),
          },
          {
            _id: mockPresetId2,
            category: 'seniority',
            label: 'Executive',
            description: 'Executive level',
            queryFragment: 'CEO OR CFO',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      expect(result.current).toBe(
        'site:linkedin.com/in/ CTO fintech OR "financial services" CEO OR CFO'
      )
    })
  })

  describe('empty presets', () => {
    it('returns base query unchanged when no active presets', () => {
      // Mock base query with no active presets
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/ software engineer',
          activePresetIds: [],
        }
        return selector(mockState)
      })

      // Mock empty custom presets
      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      expect(result.current).toBe('site:linkedin.com/in/ software engineer')
    })
  })

  describe('single preset', () => {
    it('appends single preset fragment to base query', () => {
      // Mock base query with one active preset
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/',
          activePresetIds: [mockPresetId1],
        }
        return selector(mockState)
      })

      // Mock custom presets
      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'industry',
            label: 'Healthcare',
            description: 'Healthcare industry',
            queryFragment: 'healthcare OR medical',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      expect(result.current).toBe('site:linkedin.com/in/ healthcare OR medical')
    })
  })

  describe('multiple presets', () => {
    it('combines multiple preset fragments in order', () => {
      // Mock base query with three active presets
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/',
          activePresetIds: [mockPresetId1, mockPresetId2, mockPresetId3],
        }
        return selector(mockState)
      })

      // Mock custom presets
      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'seniority',
            label: 'VP',
            description: 'Vice President',
            queryFragment: 'VP OR "Vice President"',
            _creationTime: Date.now(),
          },
          {
            _id: mockPresetId2,
            category: 'industry',
            label: 'SaaS',
            description: 'Software as a Service',
            queryFragment: 'SaaS OR "Software as a Service"',
            _creationTime: Date.now(),
          },
          {
            _id: mockPresetId3,
            category: 'location',
            label: 'Bay Area',
            description: 'San Francisco Bay Area',
            queryFragment: '"San Francisco" OR "Bay Area"',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      expect(result.current).toBe(
        'site:linkedin.com/in/ VP OR "Vice President" SaaS OR "Software as a Service" "San Francisco" OR "Bay Area"'
      )
    })
  })

  describe('memoization', () => {
    it('returns same result for same inputs (referential equality)', () => {
      // Mock stable inputs
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/',
          activePresetIds: [mockPresetId1],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'industry',
            label: 'Tech',
            description: 'Technology industry',
            queryFragment: 'technology OR tech',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result, rerender } = renderHook(() => useBuildQueryWithPresets())

      const firstResult = result.current
      rerender()
      const secondResult = result.current

      // Should return the exact same reference
      expect(firstResult).toBe(secondResult)
    })

    it('returns new result when base query changes', () => {
      // Initial state
      let currentBaseQuery = 'site:linkedin.com/in/ engineer'

      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => currentBaseQuery,
          activePresetIds: [mockPresetId1],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'industry',
            label: 'AI',
            description: 'Artificial Intelligence',
            queryFragment: 'AI OR "machine learning"',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result, rerender } = renderHook(() => useBuildQueryWithPresets())

      const firstResult = result.current
      expect(firstResult).toBe('site:linkedin.com/in/ engineer AI OR "machine learning"')

      // Change base query
      currentBaseQuery = 'site:linkedin.com/in/ director'
      rerender()

      const secondResult = result.current
      expect(secondResult).toBe('site:linkedin.com/in/ director AI OR "machine learning"')
      expect(firstResult).not.toBe(secondResult)
    })
  })

  describe('preset ordering', () => {
    it('respects the order of activePresetIds', () => {
      // Mock with specific order
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'base',
          activePresetIds: [mockPresetId2, mockPresetId1], // Note the order
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'custom',
            label: 'First',
            description: 'First preset',
            queryFragment: 'FIRST',
            _creationTime: Date.now(),
          },
          {
            _id: mockPresetId2,
            category: 'custom',
            label: 'Second',
            description: 'Second preset',
            queryFragment: 'SECOND',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      // Should be in order of activePresetIds (SECOND, then FIRST)
      expect(result.current).toBe('base SECOND FIRST')
    })
  })

  describe('special characters', () => {
    it('handles quotes in query fragments correctly', () => {
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/',
          activePresetIds: [mockPresetId1],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'custom',
            label: 'Quoted',
            description: 'Contains quotes',
            queryFragment: '"Chief Technology Officer" OR "Head of Engineering"',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      expect(result.current).toBe(
        'site:linkedin.com/in/ "Chief Technology Officer" OR "Head of Engineering"'
      )
    })

    it('handles parentheses in query fragments', () => {
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/',
          activePresetIds: [mockPresetId1],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'custom',
            label: 'Grouped',
            description: 'Contains parentheses',
            queryFragment: '(CTO OR CEO) AND (tech OR technology)',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      expect(result.current).toBe(
        'site:linkedin.com/in/ (CTO OR CEO) AND (tech OR technology)'
      )
    })
  })

  describe('empty base query', () => {
    it('works with only presets when base query is empty', () => {
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => '',
          activePresetIds: [mockPresetId1, mockPresetId2],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'industry',
            label: 'Startup',
            description: 'Startup companies',
            queryFragment: 'startup',
            _creationTime: Date.now(),
          },
          {
            _id: mockPresetId2,
            category: 'seniority',
            label: 'Founder',
            description: 'Company founders',
            queryFragment: 'founder',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      expect(result.current).toBe('startup founder')
    })
  })

  describe('whitespace handling', () => {
    it('trims leading and trailing whitespace in final query', () => {
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => '  site:linkedin.com/in/  ',
          activePresetIds: [mockPresetId1],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'custom',
            label: 'Spaced',
            description: 'Contains extra spaces',
            queryFragment: '  engineer  ',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      // Should trim leading/trailing whitespace (but preserve internal spaces)
      expect(result.current.trim()).toBe(result.current)
      expect(result.current).toContain('site:linkedin.com/in/')
      expect(result.current).toContain('engineer')
    })

    it('filters out empty strings from fragments', () => {
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/',
          activePresetIds: [mockPresetId1, mockPresetId2],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'custom',
            label: 'Valid',
            description: 'Valid preset',
            queryFragment: 'valid',
            _creationTime: Date.now(),
          },
          {
            _id: mockPresetId2,
            category: 'custom',
            label: 'Empty',
            description: 'Empty fragment',
            queryFragment: '   ', // Only whitespace
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      // Empty fragment should be filtered out
      expect(result.current).toBe('site:linkedin.com/in/ valid')
    })
  })

  describe('large queries', () => {
    it('handles many presets efficiently', () => {
      // Create 10 preset IDs
      const manyPresetIds = Array.from(
        { length: 10 },
        (_, i) => `preset-${i}` as Id<'customPresets'>
      )

      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/',
          activePresetIds: manyPresetIds,
        }
        return selector(mockState)
      })

      // Create 10 presets
      const manyPresets = Array.from({ length: 10 }, (_, i) => ({
        _id: `preset-${i}` as Id<'customPresets'>,
        category: 'custom' as const,
        label: `Preset ${i}`,
        description: `Description ${i}`,
        queryFragment: `fragment${i}`,
        _creationTime: Date.now(),
      }))

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: manyPresets,
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      // Should combine all fragments
      expect(result.current).toBe(
        'site:linkedin.com/in/ fragment0 fragment1 fragment2 fragment3 fragment4 fragment5 fragment6 fragment7 fragment8 fragment9'
      )
    })
  })

  describe('edge cases', () => {
    it('handles preset ID that does not exist in presets array', () => {
      const nonExistentId = 'non-existent' as Id<'customPresets'>

      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => 'site:linkedin.com/in/',
          activePresetIds: [mockPresetId1, nonExistentId],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'custom',
            label: 'Exists',
            description: 'This exists',
            queryFragment: 'exists',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      // Should only include the existing preset
      expect(result.current).toBe('site:linkedin.com/in/ exists')
    })

    it('handles all empty strings (base query and all fragments)', () => {
      vi.mocked(useQueryBuilderStore).mockImplementation((selector: any) => {
        const mockState = {
          buildQuery: () => '',
          activePresetIds: [mockPresetId1],
        }
        return selector(mockState)
      })

      vi.mocked(useConvexCustomPresets).mockReturnValue({
        presets: [
          {
            _id: mockPresetId1,
            category: 'custom',
            label: 'Empty',
            description: 'Empty fragment',
            queryFragment: '',
            _creationTime: Date.now(),
          },
        ],
        isLoading: false,
        addPreset: vi.fn(),
        updatePreset: vi.fn(),
        deletePreset: vi.fn(),
        getPresetsByCategory: vi.fn(),
        getPresetById: vi.fn(),
      })

      const { result } = renderHook(() => useBuildQueryWithPresets())

      // Should return empty string when everything is empty
      expect(result.current).toBe('')
    })
  })
})
