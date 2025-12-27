import { describe, it, expect, beforeEach } from 'vitest'
import { useQueryBuilderStore } from '@/stores/queryBuilderStore'

describe('queryBuilderStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useQueryBuilderStore.getState().resetAll()
  })

  describe('siteFilter', () => {
    it('has default value of "all"', () => {
      expect(useQueryBuilderStore.getState().siteFilter).toBe('all')
    })

    it('updates siteFilter correctly', () => {
      useQueryBuilderStore.getState().setSiteFilter('profile')
      expect(useQueryBuilderStore.getState().siteFilter).toBe('profile')

      useQueryBuilderStore.getState().setSiteFilter('jobs')
      expect(useQueryBuilderStore.getState().siteFilter).toBe('jobs')
    })
  })

  describe('mustHaveKeywords', () => {
    it('starts with empty array', () => {
      expect(useQueryBuilderStore.getState().modifiers.mustHaveKeywords).toEqual([])
    })

    it('adds keywords correctly', () => {
      useQueryBuilderStore.getState().addMustHaveKeyword('software')
      useQueryBuilderStore.getState().addMustHaveKeyword('engineer')

      expect(useQueryBuilderStore.getState().modifiers.mustHaveKeywords).toEqual([
        'software',
        'engineer',
      ])
    })

    it('removes keywords correctly', () => {
      useQueryBuilderStore.getState().addMustHaveKeyword('software')
      useQueryBuilderStore.getState().addMustHaveKeyword('engineer')
      useQueryBuilderStore.getState().removeMustHaveKeyword('software')

      expect(useQueryBuilderStore.getState().modifiers.mustHaveKeywords).toEqual(['engineer'])
    })
  })

  describe('excludeKeywords', () => {
    it('starts with empty array', () => {
      expect(useQueryBuilderStore.getState().modifiers.excludeKeywords).toEqual([])
    })

    it('adds exclude keywords correctly', () => {
      useQueryBuilderStore.getState().addExcludeKeyword('intern')
      useQueryBuilderStore.getState().addExcludeKeyword('junior')

      expect(useQueryBuilderStore.getState().modifiers.excludeKeywords).toEqual([
        'intern',
        'junior',
      ])
    })

    it('removes exclude keywords correctly', () => {
      useQueryBuilderStore.getState().addExcludeKeyword('intern')
      useQueryBuilderStore.getState().addExcludeKeyword('junior')
      useQueryBuilderStore.getState().removeExcludeKeyword('intern')

      expect(useQueryBuilderStore.getState().modifiers.excludeKeywords).toEqual(['junior'])
    })
  })

  describe('exactMatchPhrases', () => {
    it('starts with empty array', () => {
      expect(useQueryBuilderStore.getState().modifiers.exactMatchPhrases).toEqual([])
    })

    it('adds exact match phrases correctly', () => {
      useQueryBuilderStore.getState().addExactMatchPhrase('software engineer')
      useQueryBuilderStore.getState().addExactMatchPhrase('data scientist')

      expect(useQueryBuilderStore.getState().modifiers.exactMatchPhrases).toEqual([
        'software engineer',
        'data scientist',
      ])
    })

    it('removes exact match phrases correctly', () => {
      useQueryBuilderStore.getState().addExactMatchPhrase('software engineer')
      useQueryBuilderStore.getState().addExactMatchPhrase('data scientist')
      useQueryBuilderStore.getState().removeExactMatchPhrase('software engineer')

      expect(useQueryBuilderStore.getState().modifiers.exactMatchPhrases).toEqual([
        'data scientist',
      ])
    })
  })

  describe('additionalFilters', () => {
    it('sets location correctly', () => {
      useQueryBuilderStore.getState().setLocation('Jakarta')
      expect(useQueryBuilderStore.getState().additionalFilters.location).toBe('Jakarta')
    })

    it('sets company correctly', () => {
      useQueryBuilderStore.getState().setCompany('Google')
      expect(useQueryBuilderStore.getState().additionalFilters.company).toBe('Google')
    })

    it('sets position correctly', () => {
      useQueryBuilderStore.getState().setPosition('Senior Engineer')
      expect(useQueryBuilderStore.getState().additionalFilters.position).toBe('Senior Engineer')
    })
  })

  describe('buildQueryString', () => {
    it('builds empty query when no filters set', () => {
      expect(useQueryBuilderStore.getState().buildQueryString()).toBe('')
    })

    it('builds query with must-have keywords', () => {
      useQueryBuilderStore.getState().addMustHaveKeyword('software')
      useQueryBuilderStore.getState().addMustHaveKeyword('engineer')

      expect(useQueryBuilderStore.getState().buildQueryString()).toBe('software engineer')
    })

    it('builds query with OR operator', () => {
      useQueryBuilderStore.getState().addMustHaveKeyword('software')
      useQueryBuilderStore.getState().addMustHaveKeyword('developer')
      useQueryBuilderStore.getState().toggleOrOperator()

      expect(useQueryBuilderStore.getState().buildQueryString()).toBe('software OR developer')
    })

    it('builds query with site filter', () => {
      useQueryBuilderStore.getState().addMustHaveKeyword('engineer')
      useQueryBuilderStore.getState().setSiteFilter('profile')

      expect(useQueryBuilderStore.getState().buildQueryString()).toBe(
        'engineer linkedin.com/in/'
      )
    })

    it('builds query with exclude keywords', () => {
      useQueryBuilderStore.getState().addMustHaveKeyword('engineer')
      useQueryBuilderStore.getState().addExcludeKeyword('intern')

      expect(useQueryBuilderStore.getState().buildQueryString()).toBe('engineer -intern')
    })

    it('builds query with exact match phrases', () => {
      useQueryBuilderStore.getState().addExactMatchPhrase('software engineer')

      expect(useQueryBuilderStore.getState().buildQueryString()).toBe('"software engineer"')
    })

    it('builds complex query with all filters', () => {
      useQueryBuilderStore.getState().addMustHaveKeyword('developer')
      useQueryBuilderStore.getState().setSiteFilter('profile')
      useQueryBuilderStore.getState().addExcludeKeyword('intern')
      useQueryBuilderStore.getState().addExactMatchPhrase('senior')
      useQueryBuilderStore.getState().setLocation('Jakarta')

      const query = useQueryBuilderStore.getState().buildQueryString()

      expect(query).toContain('developer')
      expect(query).toContain('linkedin.com/in/')
      expect(query).toContain('-intern')
      expect(query).toContain('"senior"')
      expect(query).toContain('Jakarta')
    })
  })

  describe('resetFilters', () => {
    it('resets modifiers and filters but keeps saved queries', () => {
      // Set some values
      useQueryBuilderStore.getState().addMustHaveKeyword('test')
      useQueryBuilderStore.getState().setSiteFilter('jobs')
      useQueryBuilderStore.getState().setLocation('Jakarta')

      // Reset
      useQueryBuilderStore.getState().resetFilters()

      // Verify reset
      expect(useQueryBuilderStore.getState().modifiers.mustHaveKeywords).toEqual([])
      expect(useQueryBuilderStore.getState().siteFilter).toBe('all')
      expect(useQueryBuilderStore.getState().additionalFilters.location).toBe('')
    })
  })

  describe('resetAll', () => {
    it('resets everything including query string', () => {
      // Set some values
      useQueryBuilderStore.getState().setQueryString('test query')
      useQueryBuilderStore.getState().addMustHaveKeyword('test')
      useQueryBuilderStore.getState().setSiteFilter('jobs')

      // Reset all
      useQueryBuilderStore.getState().resetAll()

      // Verify complete reset
      expect(useQueryBuilderStore.getState().queryString).toBe('')
      expect(useQueryBuilderStore.getState().modifiers.mustHaveKeywords).toEqual([])
      expect(useQueryBuilderStore.getState().siteFilter).toBe('all')
    })
  })

  describe('toggleOrOperator', () => {
    it('toggles OR operator', () => {
      expect(useQueryBuilderStore.getState().modifiers.useOrOperator).toBe(false)

      useQueryBuilderStore.getState().toggleOrOperator()
      expect(useQueryBuilderStore.getState().modifiers.useOrOperator).toBe(true)

      useQueryBuilderStore.getState().toggleOrOperator()
      expect(useQueryBuilderStore.getState().modifiers.useOrOperator).toBe(false)
    })
  })

  describe('dateRange', () => {
    it('sets date range correctly', () => {
      useQueryBuilderStore.getState().setDateRange('2024-01-01', '2024-12-31')

      expect(useQueryBuilderStore.getState().modifiers.dateRange).toEqual({
        from: '2024-01-01',
        to: '2024-12-31',
      })
    })

    it('handles null dates', () => {
      useQueryBuilderStore.getState().setDateRange(null, null)

      expect(useQueryBuilderStore.getState().modifiers.dateRange).toEqual({
        from: null,
        to: null,
      })
    })
  })
})
