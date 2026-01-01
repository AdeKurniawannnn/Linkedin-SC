"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import {
  QUERY_PRESETS,
  PRESET_CATEGORIES,
  getPresetsByCategory,
  type PresetCategory,
  type QueryPreset,
} from "@/config/queryPresets";
import { QuickPicks } from "./QuickPicks";
import { LocationSelector } from "./LocationSelector";
import { CustomPresetDialog } from "./CustomPresetDialog";
import { useConvexCustomPresets } from "@/hooks";
import { Trash2 } from "lucide-react";

/**
 * QueryPresets Component
 *
 * Displays toggleable preset buttons grouped by collapsible category accordions.
 * Users can select multiple presets to build complex queries.
 *
 * Features:
 * - Presets grouped by category with collapsible accordions
 * - Active preset count badges on category headers
 * - Toggle buttons with active/inactive visual feedback
 * - Multi-select (multiple presets can be active)
 * - Search/filter presets across all categories
 * - Clear all presets button
 * - Default expand first 2 categories (Content Type, Seniority)
 */
export function QueryPresets() {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Accordion expansion state - default expand first 2 categories (content_type, seniority)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "content_type",
    "seniority"
  ]);

  // Zustand store integration
  const activePresetIds = useQueryBuilderStore((state) => state.activePresetIds);
  const togglePreset = useQueryBuilderStore((state) => state.togglePreset);
  const clearPresets = useQueryBuilderStore((state) => state.clearPresets);

  // Custom presets from Convex
  const { presets: customPresets, deletePreset: deleteCustomPreset } = useConvexCustomPresets();

  // Filter presets based on search query
  const filteredPresets = useMemo(() => {
    if (!searchQuery.trim()) {
      return QUERY_PRESETS;
    }

    const query = searchQuery.toLowerCase();
    return QUERY_PRESETS.filter((preset) =>
      preset.label.toLowerCase().includes(query) ||
      preset.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Get categories that have matching presets (excluding 'location' which has its own selector)
  const categories = useMemo(() => {
    const allCategories = Object.keys(PRESET_CATEGORIES) as PresetCategory[];
    // Exclude 'location' category as it now has a dedicated LocationSelector
    const filteredCategories = allCategories.filter((cat) => cat !== 'location');

    if (!searchQuery.trim()) {
      return filteredCategories;
    }

    return filteredCategories.filter((category) =>
      filteredPresets.some((preset) => preset.category === category)
    );
  }, [searchQuery, filteredPresets]);

  // Count active presets per category
  const getActiveCategoryCount = (category: PresetCategory): number => {
    const categoryPresets = filteredPresets.filter((preset) => preset.category === category);
    return categoryPresets.filter((preset) => activePresetIds.includes(preset.id)).length;
  };

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
        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Picks - Show only when not searching */}
        {!searchQuery.trim() && <QuickPicks />}

        {/* Location Selector - Show only when not searching */}
        {!searchQuery.trim() && (
          <div className="border rounded-lg p-4 bg-gray-50/50">
            <LocationSelector />
          </div>
        )}

        {/* No Results Message */}
        {filteredPresets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No presets found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}

        {/* Accordion for Categories */}
        <Accordion
          type="multiple"
          value={expandedCategories}
          onValueChange={setExpandedCategories}
          className="space-y-2"
        >
          {categories.map((category) => {
            const categoryConfig = PRESET_CATEGORIES[category];
            const presets = filteredPresets.filter((preset) => preset.category === category);
            const activeCount = getActiveCategoryCount(category);

            return (
              <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {categoryConfig.label}
                    </span>
                    {activeCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {activeCount}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    <p className="text-xs text-gray-500">
                      {categoryConfig.description}
                    </p>

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
                </AccordionContent>
              </AccordionItem>
            );
          })}

          {/* My Presets - Custom user presets */}
          <AccordionItem value="my_presets" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  My Presets
                </span>
                {customPresets.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {customPresets.length}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <p className="text-xs text-gray-500">
                  Create and manage your own custom search presets
                </p>

                {customPresets.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    <p className="text-sm">No custom presets yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customPresets.map((preset) => {
                      const isActive = activePresetIds.includes(preset._id);
                      return (
                        <div
                          key={preset._id}
                          className="flex items-center gap-2 p-2 rounded-md border bg-background"
                        >
                          <Button
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => togglePreset(preset._id)}
                            className="flex-1 justify-start text-xs h-8"
                            title={preset.description || preset.queryFragment}
                          >
                            {preset.label}
                          </Button>
                          <CustomPresetDialog mode="edit" preset={preset} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCustomPreset(preset._id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete preset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <CustomPresetDialog mode="create" />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
