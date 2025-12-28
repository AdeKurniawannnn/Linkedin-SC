import { describe, it, expect, beforeEach } from 'vitest'
import { useQueryBuilderStore } from '@/stores/queryBuilderStore'
import { QUERY_PRESETS, buildQueryFromPresets, getPresetsByCategory } from '@/config/queryPresets'

describe('queryBuilderStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useQueryBuilderStore.getState().resetAll()
  })

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useQueryBuilderStore.getState()
      expect(state.baseQuery).toBe('')
      expect(state.siteFilter).toBe('all')
      expect(state.activePresetIds).toEqual([])
      expect(state.location).toBe('')
      expect(state.country).toBe('')
      expect(state.language).toBe('en')
      expect(state.maxResults).toBe(10)
    })
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

  describe('baseQuery', () => {
    it('sets base query correctly', () => {
      useQueryBuilderStore.getState().setBaseQuery('software engineer')
      expect(useQueryBuilderStore.getState().baseQuery).toBe('software engineer')
    })
  })

  describe('preset toggling', () => {
    it('toggles preset on when not active', () => {
      useQueryBuilderStore.getState().togglePreset('seniority_senior')
      expect(useQueryBuilderStore.getState().activePresetIds).toContain('seniority_senior')
    })

    it('toggles preset off when active', () => {
      useQueryBuilderStore.getState().togglePreset('seniority_senior')
      useQueryBuilderStore.getState().togglePreset('seniority_senior')
      expect(useQueryBuilderStore.getState().activePresetIds).not.toContain('seniority_senior')
    })

    it('allows multiple presets to be active', () => {
      useQueryBuilderStore.getState().togglePreset('seniority_senior')
      useQueryBuilderStore.getState().togglePreset('industry_tech')
      useQueryBuilderStore.getState().togglePreset('loc_indonesia')

      const activeIds = useQueryBuilderStore.getState().activePresetIds
      expect(activeIds).toContain('seniority_senior')
      expect(activeIds).toContain('industry_tech')
      expect(activeIds).toContain('loc_indonesia')
      expect(activeIds.length).toBe(3)
    })

    it('clears all presets', () => {
      useQueryBuilderStore.getState().togglePreset('seniority_senior')
      useQueryBuilderStore.getState().togglePreset('industry_tech')
      useQueryBuilderStore.getState().clearPresets()

      expect(useQueryBuilderStore.getState().activePresetIds).toEqual([])
    })
  })

  describe('location and settings', () => {
    it('sets location correctly', () => {
      useQueryBuilderStore.getState().setLocation('Jakarta')
      expect(useQueryBuilderStore.getState().location).toBe('Jakarta')
    })

    it('sets country correctly', () => {
      useQueryBuilderStore.getState().setCountry('ID')
      expect(useQueryBuilderStore.getState().country).toBe('ID')
    })

    it('sets language correctly', () => {
      useQueryBuilderStore.getState().setLanguage('id')
      expect(useQueryBuilderStore.getState().language).toBe('id')
    })

    it('sets maxResults correctly', () => {
      useQueryBuilderStore.getState().setMaxResults(50)
      expect(useQueryBuilderStore.getState().maxResults).toBe(50)
    })
  })

  describe('buildQuery', () => {
    it('builds empty query when no filters set', () => {
      expect(useQueryBuilderStore.getState().buildQuery()).toBe('')
    })

    it('builds query with base query only', () => {
      useQueryBuilderStore.getState().setBaseQuery('software engineer')
      expect(useQueryBuilderStore.getState().buildQuery()).toBe('software engineer')
    })

    it('builds query with site filter', () => {
      useQueryBuilderStore.getState().setSiteFilter('profile')
      useQueryBuilderStore.getState().setBaseQuery('developer')

      const query = useQueryBuilderStore.getState().buildQuery()
      expect(query).toBe('site:linkedin.com/in/ developer')
    })

    it('builds query with profile site filter', () => {
      useQueryBuilderStore.getState().setSiteFilter('profile')

      const query = useQueryBuilderStore.getState().buildQuery()
      expect(query).toBe('site:linkedin.com/in/')
    })

    it('builds query with posts site filter', () => {
      useQueryBuilderStore.getState().setSiteFilter('posts')

      const query = useQueryBuilderStore.getState().buildQuery()
      expect(query).toBe('site:linkedin.com/posts/')
    })

    it('builds query with jobs site filter', () => {
      useQueryBuilderStore.getState().setSiteFilter('jobs')

      const query = useQueryBuilderStore.getState().buildQuery()
      expect(query).toBe('site:linkedin.com/jobs/')
    })

    it('builds query with company site filter', () => {
      useQueryBuilderStore.getState().setSiteFilter('company')

      const query = useQueryBuilderStore.getState().buildQuery()
      expect(query).toBe('site:linkedin.com/company/')
    })

    it('builds query with active presets', () => {
      useQueryBuilderStore.getState().togglePreset('seniority_senior')

      const query = useQueryBuilderStore.getState().buildQuery()
      expect(query).toBe('("Senior" OR "Sr." OR "Lead")')
    })

    it('builds query with multiple presets', () => {
      useQueryBuilderStore.getState().togglePreset('seniority_senior')
      useQueryBuilderStore.getState().togglePreset('exclude_recruiter')

      const query = useQueryBuilderStore.getState().buildQuery()
      expect(query).toContain('("Senior" OR "Sr." OR "Lead")')
      expect(query).toContain('-recruiter -recruiting -headhunter')
    })

    it('builds query with location', () => {
      useQueryBuilderStore.getState().setLocation('Jakarta')

      const query = useQueryBuilderStore.getState().buildQuery()
      expect(query).toBe('Jakarta')
    })

    it('builds complex query with all components', () => {
      useQueryBuilderStore.getState().setSiteFilter('profile')
      useQueryBuilderStore.getState().setBaseQuery('developer')
      useQueryBuilderStore.getState().togglePreset('seniority_senior')
      useQueryBuilderStore.getState().togglePreset('exclude_recruiter')
      useQueryBuilderStore.getState().setLocation('Jakarta')

      const query = useQueryBuilderStore.getState().buildQuery()

      expect(query).toContain('site:linkedin.com/in/')
      expect(query).toContain('developer')
      expect(query).toContain('("Senior" OR "Sr." OR "Lead")')
      expect(query).toContain('-recruiter')
      expect(query).toContain('Jakarta')
    })
  })

  describe('resetAll', () => {
    it('resets everything to initial state', () => {
      // Set some values
      useQueryBuilderStore.getState().setBaseQuery('test query')
      useQueryBuilderStore.getState().setSiteFilter('jobs')
      useQueryBuilderStore.getState().togglePreset('seniority_senior')
      useQueryBuilderStore.getState().setLocation('Singapore')

      // Reset all
      useQueryBuilderStore.getState().resetAll()

      // Verify complete reset
      const state = useQueryBuilderStore.getState()
      expect(state.baseQuery).toBe('')
      expect(state.siteFilter).toBe('all')
      expect(state.activePresetIds).toEqual([])
      expect(state.location).toBe('')
    })
  })
})

describe('queryPresets config', () => {
  it('exports QUERY_PRESETS array', () => {
    expect(Array.isArray(QUERY_PRESETS)).toBe(true)
    expect(QUERY_PRESETS.length).toBeGreaterThan(0)
  })

  it('has valid preset structure', () => {
    QUERY_PRESETS.forEach((preset) => {
      expect(preset).toHaveProperty('id')
      expect(preset).toHaveProperty('label')
      expect(preset).toHaveProperty('description')
      expect(preset).toHaveProperty('queryFragment')
      expect(preset).toHaveProperty('category')
      expect(['content_type', 'seniority', 'function', 'industry', 'location', 'exclusions']).toContain(preset.category)
    })
  })

  it('buildQueryFromPresets returns correct query for single preset', () => {
    const query = buildQueryFromPresets(['seniority_senior'])
    expect(query).toBe('("Senior" OR "Sr." OR "Lead")')
  })

  it('buildQueryFromPresets returns correct query for multiple presets', () => {
    const query = buildQueryFromPresets(['seniority_senior', 'exclude_recruiter'])
    expect(query).toContain('("Senior" OR "Sr." OR "Lead")')
    expect(query).toContain('-recruiter -recruiting -headhunter')
  })

  it('buildQueryFromPresets returns empty string for empty array', () => {
    const query = buildQueryFromPresets([])
    expect(query).toBe('')
  })

  it('buildQueryFromPresets returns empty string for unknown ids', () => {
    const query = buildQueryFromPresets(['unknown-preset-id'])
    expect(query).toBe('')
  })

  it('getPresetsByCategory returns correct presets', () => {
    const seniorityPresets = getPresetsByCategory('seniority')
    expect(seniorityPresets.length).toBeGreaterThan(0)
    seniorityPresets.forEach((preset) => {
      expect(preset.category).toBe('seniority')
    })
  })
})
