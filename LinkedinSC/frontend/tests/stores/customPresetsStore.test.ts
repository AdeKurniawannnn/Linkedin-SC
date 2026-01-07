import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCustomPresetsStore } from '@/stores/customPresetsStore'
import type { CustomPreset } from '@/stores/customPresetsStore'
import { createMockCustomPreset } from '@/tests/utils/testUtils'
import type { PresetCategory } from '@/config/queryPresets'

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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('customPresetsStore', () => {
  beforeEach(() => {
    // Clear localStorage and reset store
    localStorageMock.clear()
    useCustomPresetsStore.persist.clearStorage()
    useCustomPresetsStore.setState({ presets: [] })
  })

  describe('initial state', () => {
    it('starts with empty presets array', () => {
      const state = useCustomPresetsStore.getState()
      expect(state.presets).toEqual([])
    })

    it('can be populated with custom presets', () => {
      // Add presets directly to test state
      const mockPresets: CustomPreset[] = [
        createMockCustomPreset({ label: 'Preset 1' }),
        createMockCustomPreset({ label: 'Preset 2' }),
      ]

      useCustomPresetsStore.setState({ presets: mockPresets })

      const state = useCustomPresetsStore.getState()
      expect(state.presets).toHaveLength(2)
      expect(state.presets[0].label).toBe('Preset 1')
      expect(state.presets[1].label).toBe('Preset 2')
    })
  })

  describe('addPreset', () => {
    it('adds a new preset with unique ID', () => {
      const presetData = {
        category: 'custom' as PresetCategory | 'custom',
        label: 'New Preset',
        description: 'Test description',
        queryFragment: 'test query',
      }

      useCustomPresetsStore.getState().addPreset(presetData)

      const state = useCustomPresetsStore.getState()
      expect(state.presets).toHaveLength(1)
      expect(state.presets[0].label).toBe('New Preset')
      expect(state.presets[0].id).toMatch(/^custom_/)
    })

    it('auto-generates createdAt and updatedAt timestamps', () => {
      const beforeTime = Date.now()

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test Preset',
        description: 'Test',
        queryFragment: 'test',
      })

      const afterTime = Date.now()
      const state = useCustomPresetsStore.getState()
      const preset = state.presets[0]

      const createdAt = new Date(preset.createdAt).getTime()
      const updatedAt = new Date(preset.updatedAt).getTime()

      expect(createdAt).toBeGreaterThanOrEqual(beforeTime)
      expect(createdAt).toBeLessThanOrEqual(afterTime)
      expect(updatedAt).toBeGreaterThanOrEqual(beforeTime)
      expect(updatedAt).toBeLessThanOrEqual(afterTime)
    })

    it('preserves all preset fields', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'seniority',
        label: 'Senior Level',
        description: 'Senior-level positions',
        queryFragment: 'Senior OR "Sr."',
      })

      const state = useCustomPresetsStore.getState()
      const preset = state.presets[0]

      expect(preset.category).toBe('seniority')
      expect(preset.label).toBe('Senior Level')
      expect(preset.description).toBe('Senior-level positions')
      expect(preset.queryFragment).toBe('Senior OR "Sr."')
    })

    it('allows multiple presets to be added', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 1',
        description: 'First preset',
        queryFragment: 'query1',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 2',
        description: 'Second preset',
        queryFragment: 'query2',
      })

      const state = useCustomPresetsStore.getState()
      expect(state.presets).toHaveLength(2)
      expect(state.presets[0].label).toBe('Preset 1')
      expect(state.presets[1].label).toBe('Preset 2')
    })

    it('generates unique IDs for each preset', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 1',
        description: 'Test',
        queryFragment: 'test',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 2',
        description: 'Test',
        queryFragment: 'test',
      })

      const state = useCustomPresetsStore.getState()
      expect(state.presets[0].id).not.toBe(state.presets[1].id)
    })
  })

  describe('updatePreset', () => {
    it('updates preset fields', () => {
      // Add a preset first
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Original Label',
        description: 'Original description',
        queryFragment: 'original query',
      })

      const state = useCustomPresetsStore.getState()
      const presetId = state.presets[0].id

      // Update the preset
      useCustomPresetsStore.getState().updatePreset(presetId, {
        label: 'Updated Label',
        description: 'Updated description',
      })

      const updatedState = useCustomPresetsStore.getState()
      const updatedPreset = updatedState.presets[0]

      expect(updatedPreset.label).toBe('Updated Label')
      expect(updatedPreset.description).toBe('Updated description')
      expect(updatedPreset.queryFragment).toBe('original query') // Unchanged
    })

    it('preserves preset ID during update', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test',
        description: 'Test',
        queryFragment: 'test',
      })

      const originalId = useCustomPresetsStore.getState().presets[0].id

      useCustomPresetsStore.getState().updatePreset(originalId, {
        label: 'Updated',
      })

      const updatedId = useCustomPresetsStore.getState().presets[0].id
      expect(updatedId).toBe(originalId)
    })

    it('updates updatedAt timestamp', async () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test',
        description: 'Test',
        queryFragment: 'test',
      })

      const originalUpdatedAt = useCustomPresetsStore.getState().presets[0].updatedAt

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10))

      const presetId = useCustomPresetsStore.getState().presets[0].id
      useCustomPresetsStore.getState().updatePreset(presetId, {
        label: 'Updated Label',
      })

      const newUpdatedAt = useCustomPresetsStore.getState().presets[0].updatedAt
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      )
    })

    it('does not modify other presets', () => {
      // Add two presets
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 1',
        description: 'Description 1',
        queryFragment: 'query1',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 2',
        description: 'Description 2',
        queryFragment: 'query2',
      })

      const state = useCustomPresetsStore.getState()
      const firstPresetId = state.presets[0].id

      // Update only the first preset
      useCustomPresetsStore.getState().updatePreset(firstPresetId, {
        label: 'Updated Preset 1',
      })

      const updatedState = useCustomPresetsStore.getState()
      expect(updatedState.presets[0].label).toBe('Updated Preset 1')
      expect(updatedState.presets[1].label).toBe('Preset 2') // Unchanged
    })

    it('handles non-existent preset ID gracefully', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test',
        description: 'Test',
        queryFragment: 'test',
      })

      // Try to update a non-existent preset
      useCustomPresetsStore.getState().updatePreset('non-existent-id', {
        label: 'Should not apply',
      })

      const state = useCustomPresetsStore.getState()
      expect(state.presets[0].label).toBe('Test') // Unchanged
    })
  })

  describe('deletePreset', () => {
    it('removes preset by ID', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test Preset',
        description: 'Test',
        queryFragment: 'test',
      })

      const state = useCustomPresetsStore.getState()
      const presetId = state.presets[0].id

      useCustomPresetsStore.getState().deletePreset(presetId)

      const updatedState = useCustomPresetsStore.getState()
      expect(updatedState.presets).toHaveLength(0)
    })

    it('removes only the specified preset', () => {
      // Add three presets
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 1',
        description: 'Test',
        queryFragment: 'test1',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 2',
        description: 'Test',
        queryFragment: 'test2',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 3',
        description: 'Test',
        queryFragment: 'test3',
      })

      const state = useCustomPresetsStore.getState()
      const middlePresetId = state.presets[1].id

      // Delete the middle preset
      useCustomPresetsStore.getState().deletePreset(middlePresetId)

      const updatedState = useCustomPresetsStore.getState()
      expect(updatedState.presets).toHaveLength(2)
      expect(updatedState.presets[0].label).toBe('Preset 1')
      expect(updatedState.presets[1].label).toBe('Preset 3')
    })

    it('handles non-existent preset ID gracefully', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test',
        description: 'Test',
        queryFragment: 'test',
      })

      // Try to delete non-existent preset
      useCustomPresetsStore.getState().deletePreset('non-existent-id')

      const state = useCustomPresetsStore.getState()
      expect(state.presets).toHaveLength(1) // Still has the original preset
    })
  })

  describe('getPresetsByCategory', () => {
    it('filters presets by category', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'seniority',
        label: 'Senior',
        description: 'Test',
        queryFragment: 'senior',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'industry',
        label: 'Tech',
        description: 'Test',
        queryFragment: 'tech',
      })

      const seniorityPresets = useCustomPresetsStore.getState().getPresetsByCategory('seniority')
      expect(seniorityPresets).toHaveLength(1)
      expect(seniorityPresets[0].category).toBe('seniority')
    })

    it('returns custom presets for any category', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Custom Preset',
        description: 'Test',
        queryFragment: 'custom',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'seniority',
        label: 'Senior',
        description: 'Test',
        queryFragment: 'senior',
      })

      // Custom presets should appear when filtering by any category
      const seniorityPresets = useCustomPresetsStore.getState().getPresetsByCategory('seniority')
      expect(seniorityPresets).toHaveLength(2)
      expect(seniorityPresets.some((p) => p.category === 'custom')).toBe(true)
      expect(seniorityPresets.some((p) => p.category === 'seniority')).toBe(true)
    })

    it('returns empty array when no presets match category', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'seniority',
        label: 'Senior',
        description: 'Test',
        queryFragment: 'senior',
      })

      const industryPresets = useCustomPresetsStore.getState().getPresetsByCategory('industry')
      expect(industryPresets).toHaveLength(0)
    })

    it('returns all custom presets when filtering by custom category', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Custom 1',
        description: 'Test',
        queryFragment: 'custom1',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Custom 2',
        description: 'Test',
        queryFragment: 'custom2',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'seniority',
        label: 'Senior',
        description: 'Test',
        queryFragment: 'senior',
      })

      const customPresets = useCustomPresetsStore.getState().getPresetsByCategory('custom')
      expect(customPresets).toHaveLength(2)
      expect(customPresets.every((p) => p.category === 'custom')).toBe(true)
    })
  })

  describe('getPresetById', () => {
    it('returns preset by ID', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test Preset',
        description: 'Test',
        queryFragment: 'test',
      })

      const state = useCustomPresetsStore.getState()
      const presetId = state.presets[0].id

      const foundPreset = useCustomPresetsStore.getState().getPresetById(presetId)
      expect(foundPreset).toBeDefined()
      expect(foundPreset?.label).toBe('Test Preset')
    })

    it('returns undefined for non-existent ID', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test',
        description: 'Test',
        queryFragment: 'test',
      })

      const foundPreset = useCustomPresetsStore.getState().getPresetById('non-existent-id')
      expect(foundPreset).toBeUndefined()
    })

    it('returns correct preset when multiple exist', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 1',
        description: 'Test',
        queryFragment: 'test1',
      })

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 2',
        description: 'Test',
        queryFragment: 'test2',
      })

      const state = useCustomPresetsStore.getState()
      const secondPresetId = state.presets[1].id

      const foundPreset = useCustomPresetsStore.getState().getPresetById(secondPresetId)
      expect(foundPreset?.label).toBe('Preset 2')
    })
  })

  describe('persistence', () => {
    it('maintains state when adding presets', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Persistent Preset',
        description: 'Test',
        queryFragment: 'test',
      })

      // Verify preset was added to state
      const state = useCustomPresetsStore.getState()
      expect(state.presets).toHaveLength(1)
      expect(state.presets[0].label).toBe('Persistent Preset')
    })

    it('maintains state when updating presets', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Original',
        description: 'Test',
        queryFragment: 'test',
      })

      const presetId = useCustomPresetsStore.getState().presets[0].id

      useCustomPresetsStore.getState().updatePreset(presetId, {
        label: 'Updated',
      })

      // Verify state was updated
      const state = useCustomPresetsStore.getState()
      expect(state.presets[0].label).toBe('Updated')
    })

    it('maintains state when deleting presets', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'To Delete',
        description: 'Test',
        queryFragment: 'test',
      })

      const presetId = useCustomPresetsStore.getState().presets[0].id

      useCustomPresetsStore.getState().deletePreset(presetId)

      // Verify state was updated
      const state = useCustomPresetsStore.getState()
      expect(state.presets).toHaveLength(0)
    })

    it('preserves presets across multiple operations', () => {
      // Add first preset
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 1',
        description: 'First',
        queryFragment: 'test1',
      })

      // Add second preset
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Preset 2',
        description: 'Second',
        queryFragment: 'test2',
      })

      // Update first preset
      const firstId = useCustomPresetsStore.getState().presets[0].id
      useCustomPresetsStore.getState().updatePreset(firstId, {
        label: 'Updated Preset 1',
      })

      // Verify all operations persisted correctly
      const state = useCustomPresetsStore.getState()
      expect(state.presets).toHaveLength(2)
      expect(state.presets[0].label).toBe('Updated Preset 1')
      expect(state.presets[1].label).toBe('Preset 2')
    })
  })

  describe('edge cases', () => {
    it('handles empty queryFragment', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Empty Query',
        description: 'Test',
        queryFragment: '',
      })

      const state = useCustomPresetsStore.getState()
      expect(state.presets[0].queryFragment).toBe('')
    })

    it('handles very long queryFragment', () => {
      const longQuery = 'A'.repeat(1000)

      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Long Query',
        description: 'Test',
        queryFragment: longQuery,
      })

      const state = useCustomPresetsStore.getState()
      expect(state.presets[0].queryFragment).toBe(longQuery)
    })

    it('handles special characters in fields', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test <>&"',
        description: 'Test with "quotes" and \'apostrophes\'',
        queryFragment: 'query AND (test OR "value")',
      })

      const state = useCustomPresetsStore.getState()
      expect(state.presets[0].label).toBe('Test <>&"')
      expect(state.presets[0].description).toContain('"quotes"')
      expect(state.presets[0].queryFragment).toContain('(test OR "value")')
    })

    it('handles concurrent updates correctly', () => {
      useCustomPresetsStore.getState().addPreset({
        category: 'custom',
        label: 'Test',
        description: 'Test',
        queryFragment: 'test',
      })

      const presetId = useCustomPresetsStore.getState().presets[0].id

      // Simulate concurrent updates
      useCustomPresetsStore.getState().updatePreset(presetId, { label: 'Update 1' })
      useCustomPresetsStore.getState().updatePreset(presetId, { description: 'Update 2' })

      const state = useCustomPresetsStore.getState()
      expect(state.presets[0].label).toBe('Update 1')
      expect(state.presets[0].description).toBe('Update 2')
    })
  })
})
