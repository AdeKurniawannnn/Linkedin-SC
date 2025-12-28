"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

              {/* Preset Toggle Group */}
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                value={presets.filter(p => activePresetIds.includes(p.id)).map(p => p.id)}
                onValueChange={(values) => {
                  // Find which preset was toggled by comparing current vs new values
                  const currentIds = presets.filter(p => activePresetIds.includes(p.id)).map(p => p.id);
                  const added = values.find(v => !currentIds.includes(v));
                  const removed = currentIds.find(v => !values.includes(v));
                  if (added) togglePreset(added);
                  if (removed) togglePreset(removed);
                }}
                className="flex flex-wrap gap-1"
              >
                {presets.map((preset) => (
                  <ToggleGroupItem
                    key={preset.id}
                    value={preset.id}
                    title={preset.description}
                    className="text-xs px-3"
                  >
                    {preset.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
