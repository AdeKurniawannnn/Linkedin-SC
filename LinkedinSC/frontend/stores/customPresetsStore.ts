/**
 * Custom Presets Store
 *
 * Allows users to create, edit, and delete their own query presets.
 * Persisted to localStorage for cross-session availability.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PresetCategory } from '@/config/queryPresets';

export interface CustomPreset {
  id: string;
  category: PresetCategory | 'custom';
  label: string;
  description: string;
  queryFragment: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomPresetsState {
  presets: CustomPreset[];
}

interface CustomPresetsActions {
  addPreset: (preset: Omit<CustomPreset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePreset: (id: string, updates: Partial<Omit<CustomPreset, 'id' | 'createdAt'>>) => void;
  deletePreset: (id: string) => void;
  getPresetsByCategory: (category: PresetCategory | 'custom') => CustomPreset[];
  getPresetById: (id: string) => CustomPreset | undefined;
}

type CustomPresetsStore = CustomPresetsState & CustomPresetsActions;

// Generate unique ID
function generateId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useCustomPresetsStore = create<CustomPresetsStore>()(
  persist(
    (set, get) => ({
      presets: [],

      addPreset: (preset) => {
        const newPreset: CustomPreset = {
          ...preset,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          presets: [...state.presets, newPreset],
        }));
      },

      updatePreset: (id, updates) => {
        set((state) => ({
          presets: state.presets.map((preset) =>
            preset.id === id
              ? {
                  ...preset,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : preset
          ),
        }));
      },

      deletePreset: (id) => {
        set((state) => ({
          presets: state.presets.filter((preset) => preset.id !== id),
        }));
      },

      getPresetsByCategory: (category) => {
        return get().presets.filter(
          (preset) => preset.category === category || preset.category === 'custom'
        );
      },

      getPresetById: (id) => {
        return get().presets.find((preset) => preset.id === id);
      },
    }),
    {
      name: 'linkedin-query-custom-presets',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        presets: state.presets,
      }),
    }
  )
);

// Export types
export type { CustomPresetsState, CustomPresetsActions, CustomPresetsStore };
