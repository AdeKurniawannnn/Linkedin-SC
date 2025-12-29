"use client";

import { Button } from "@/components/ui/button";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { getQuickPickPresets } from "@/config/queryPresets";

/**
 * QuickPicks Component
 *
 * Displays most common presets as quick access buttons.
 * Shows horizontally arranged buttons above the accordion categories.
 *
 * Features:
 * - Horizontal button layout for quick access
 * - Active state visualization (filled vs outline)
 * - Single click to toggle preset on/off
 */
export function QuickPicks() {
  // Get quick pick presets from config
  const quickPicks = getQuickPickPresets();

  // Zustand store integration
  const activePresetIds = useQueryBuilderStore((state) => state.activePresetIds);
  const togglePreset = useQueryBuilderStore((state) => state.togglePreset);

  // Don't render if no quick picks configured
  if (quickPicks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Section Header */}
      <div>
        <h4 className="text-sm font-medium text-gray-900">Quick Picks</h4>
        <p className="text-xs text-gray-500">
          Common presets for quick access
        </p>
      </div>

      {/* Quick Pick Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickPicks.map((preset) => {
          const isActive = activePresetIds.includes(preset.id);
          return (
            <Button
              key={preset.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => togglePreset(preset.id)}
              title={preset.description}
              className="text-xs"
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
