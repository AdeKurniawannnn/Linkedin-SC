/**
 * Zustand Store for Panel Focus State
 *
 * Manages which panel (left or right) is currently focused.
 * Focused panel gets 60% width, unfocused gets 40%.
 */

import { create } from 'zustand';

type PanelId = 'left' | 'right';

interface PanelFocusState {
  focusedPanel: PanelId;
  setFocus: (panel: PanelId) => void;
}

export const usePanelFocusStore = create<PanelFocusState>((set) => ({
  // Initial state: left panel focused (60%)
  focusedPanel: 'left',

  setFocus: (panel) => set({ focusedPanel: panel }),
}));

// Export types for external use
export type { PanelId, PanelFocusState };
