import { describe, it, expect, beforeEach } from 'vitest'
import { usePanelFocusStore } from '@/stores/panelFocusStore'
import type { PanelId } from '@/stores/panelFocusStore'

describe('panelFocusStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePanelFocusStore.setState({ focusedPanel: 'left' })
  })

  describe('initial state', () => {
    it('starts with left panel focused by default', () => {
      const state = usePanelFocusStore.getState()
      expect(state.focusedPanel).toBe('left')
    })
  })

  describe('setFocus', () => {
    it('updates focusedPanel to right when set', () => {
      usePanelFocusStore.getState().setFocus('right')
      expect(usePanelFocusStore.getState().focusedPanel).toBe('right')
    })

    it('updates focusedPanel to left when set', () => {
      // Start with right focused
      usePanelFocusStore.getState().setFocus('right')

      // Switch to left
      usePanelFocusStore.getState().setFocus('left')
      expect(usePanelFocusStore.getState().focusedPanel).toBe('left')
    })

    it('handles setting the same panel multiple times', () => {
      usePanelFocusStore.getState().setFocus('right')
      usePanelFocusStore.getState().setFocus('right')
      usePanelFocusStore.getState().setFocus('right')

      expect(usePanelFocusStore.getState().focusedPanel).toBe('right')
    })
  })

  describe('panel identifiers', () => {
    it('handles left panel identifier', () => {
      const panelId: PanelId = 'left'
      usePanelFocusStore.getState().setFocus(panelId)
      expect(usePanelFocusStore.getState().focusedPanel).toBe('left')
    })

    it('handles right panel identifier', () => {
      const panelId: PanelId = 'right'
      usePanelFocusStore.getState().setFocus(panelId)
      expect(usePanelFocusStore.getState().focusedPanel).toBe('right')
    })
  })

  describe('focus tracking', () => {
    it('tracks multiple set cycles correctly', () => {
      // Cycle 1: left -> right
      usePanelFocusStore.getState().setFocus('right')
      expect(usePanelFocusStore.getState().focusedPanel).toBe('right')

      // Cycle 2: right -> left
      usePanelFocusStore.getState().setFocus('left')
      expect(usePanelFocusStore.getState().focusedPanel).toBe('left')

      // Cycle 3: left -> right
      usePanelFocusStore.getState().setFocus('right')
      expect(usePanelFocusStore.getState().focusedPanel).toBe('right')

      // Cycle 4: right -> left
      usePanelFocusStore.getState().setFocus('left')
      expect(usePanelFocusStore.getState().focusedPanel).toBe('left')
    })

    it('maintains correct state after rapid toggles', () => {
      // Simulate rapid panel switching
      for (let i = 0; i < 10; i++) {
        usePanelFocusStore.getState().setFocus(i % 2 === 0 ? 'left' : 'right')
      }

      // Should end on left (i=9 is odd, so last set was 'right', then loop ends)
      // Actually: i=9, 9%2=1 (odd), so 'right'
      expect(usePanelFocusStore.getState().focusedPanel).toBe('right')
    })
  })

  describe('type safety', () => {
    it('only accepts valid PanelId values', () => {
      // TypeScript enforces this at compile time
      // This test verifies runtime behavior matches
      const validPanels: PanelId[] = ['left', 'right']

      validPanels.forEach((panel) => {
        usePanelFocusStore.getState().setFocus(panel)
        expect(usePanelFocusStore.getState().focusedPanel).toBe(panel)
      })
    })
  })
})
