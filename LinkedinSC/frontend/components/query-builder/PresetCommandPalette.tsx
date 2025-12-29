"use client";

import { useEffect, useState, useMemo } from "react";
import { Check } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { useCustomPresetsStore } from "@/stores/customPresetsStore";
import { useSavedSearchesStore } from "@/stores/savedSearchesStore";
import {
  QUERY_PRESETS,
  PRESET_CATEGORIES,
  getPresetsByCategory,
  type PresetCategory,
} from "@/config/queryPresets";
import {
  LOCATION_PRESETS,
  getQuickPickLocations,
} from "@/config/locationPresets";
import { toast } from "sonner";

/**
 * PresetCommandPalette Component
 *
 * Global command palette for quick preset access.
 * Opens with Ctrl+K / Cmd+K keyboard shortcut.
 *
 * Features:
 * - Search across all presets, locations, and saved searches
 * - Quick toggle of presets
 * - Load saved searches
 * - Keyboard navigation
 */
export function PresetCommandPalette() {
  const [open, setOpen] = useState(false);

  // Query builder store
  const activePresetIds = useQueryBuilderStore((state) => state.activePresetIds);
  const togglePreset = useQueryBuilderStore((state) => state.togglePreset);
  const activeLocationIds = useQueryBuilderStore((state) => state.activeLocationIds);
  const toggleLocation = useQueryBuilderStore((state) => state.toggleLocation);

  // Custom presets store
  const customPresets = useCustomPresetsStore((state) => state.presets);

  // Saved searches store
  const savedSearches = useSavedSearchesStore((state) => state.searches);
  const loadSearch = useSavedSearchesStore((state) => state.loadSearch);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Group presets by category
  const groupedPresets = useMemo(() => {
    const categories = Object.keys(PRESET_CATEGORIES) as PresetCategory[];
    return categories
      .filter((cat) => cat !== "location") // Exclude location, handled separately
      .map((category) => ({
        category,
        label: PRESET_CATEGORIES[category].label,
        presets: getPresetsByCategory(category),
      }));
  }, []);

  // Quick pick locations
  const quickLocations = useMemo(() => getQuickPickLocations(), []);

  const handlePresetSelect = (presetId: string) => {
    togglePreset(presetId);
    // Don't close - allow multiple selections
  };

  const handleLocationSelect = (locationId: string) => {
    toggleLocation(locationId);
  };

  const handleLoadSearch = (searchId: string, searchName: string) => {
    loadSearch(searchId);
    setOpen(false);
    toast.success(`Loaded "${searchName}"`);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search presets, locations, and saved searches"
    >
      <CommandInput placeholder="Search presets, locations, saved searches..." />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <>
            <CommandGroup heading="Saved Searches">
              {savedSearches.slice(0, 5).map((search) => (
                <CommandItem
                  key={search.id}
                  value={`saved-${search.name}`}
                  onSelect={() => handleLoadSearch(search.id, search.name)}
                >
                  <span className="flex-1">{search.name}</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    Load
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Custom Presets */}
        {customPresets.length > 0 && (
          <>
            <CommandGroup heading="My Presets">
              {customPresets.map((preset) => (
                <CommandItem
                  key={preset.id}
                  value={`custom-${preset.label}`}
                  onSelect={() => handlePresetSelect(preset.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activePresetIds.includes(preset.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">Custom</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick Locations */}
        <CommandGroup heading="Quick Locations">
          {quickLocations.map((location) => (
            <CommandItem
              key={location.id}
              value={`location-${location.label}`}
              onSelect={() => handleLocationSelect(location.id)}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  activeLocationIds.includes(location.id) ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="mr-2">{location.flag}</span>
              <span className="flex-1">{location.label}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {location.type}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Built-in Presets by Category */}
        {groupedPresets.map(({ category, label, presets }) => (
          <CommandGroup key={category} heading={label}>
            {presets.map((preset) => (
              <CommandItem
                key={preset.id}
                value={`preset-${preset.label}-${category}`}
                onSelect={() => handlePresetSelect(preset.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    activePresetIds.includes(preset.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {/* All Locations */}
        <CommandGroup heading="All Locations">
          {LOCATION_PRESETS.filter((loc) => !loc.isQuickPick)
            .slice(0, 20)
            .map((location) => (
              <CommandItem
                key={location.id}
                value={`location-all-${location.label}`}
                onSelect={() => handleLocationSelect(location.id)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    activeLocationIds.includes(location.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                {location.flag && <span className="mr-2">{location.flag}</span>}
                <span className="flex-1">{location.label}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {location.type}
                </span>
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
