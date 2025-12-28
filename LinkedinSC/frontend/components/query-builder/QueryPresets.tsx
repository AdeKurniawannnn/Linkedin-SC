"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import {
  QUERY_PRESETS,
  PRESET_CATEGORIES,
  getPresetsByCategory,
  type PresetCategory,
  type QueryPreset,
} from "@/config/queryPresets";

/**
 * QueryPresets Component
 *
 * Displays toggleable preset buttons grouped by category.
 * Users can select multiple presets to build complex queries.
 *
 * Features:
 * - Presets grouped by category with section headers
 * - Toggle buttons with active/inactive visual feedback
 * - Multi-select (multiple presets can be active)
 * - Clear all presets button
 */
export function QueryPresets() {
  // Zustand store integration
  const activePresetIds = useQueryBuilderStore((state) => state.activePresetIds);
  const togglePreset = useQueryBuilderStore((state) => state.togglePreset);
  const clearPresets = useQueryBuilderStore((state) => state.clearPresets);

  // Get all categories
  const categories = Object.keys(PRESET_CATEGORIES) as PresetCategory[];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Query Presets</CardTitle>
          <CardDescription>
            Toggle presets to build your search query
          </CardDescription>
        </div>
        {activePresetIds.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearPresets}>
            Clear All ({activePresetIds.length})
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.map((category) => {
          const categoryConfig = PRESET_CATEGORIES[category];
          const presets = getPresetsByCategory(category);

          return (
            <div key={category} className="space-y-2">
              {/* Category Header */}
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {categoryConfig.label}
                </h4>
                <p className="text-xs text-gray-500">
                  {categoryConfig.description}
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => {
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
        })}
      </CardContent>
    </Card>
  );
}
