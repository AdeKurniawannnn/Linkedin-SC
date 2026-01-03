"use client";

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import {
  LOCATION_PRESETS,
  LOCATION_QUICK_PICKS,
  getLocationById,
  type LocationPreset,
} from "@/config/locationPresets";

/**
 * LocationSelector Component
 *
 * A searchable command palette for selecting locations.
 * Features:
 * - Quick picks for common locations
 * - Hierarchical grouping (regions, countries, cities)
 * - Multi-select with visual badges
 * - Real-time search filtering
 */
export function LocationSelector() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Store integration
  const activeLocationIds = useQueryBuilderStore((state) => state.activeLocationIds);
  const toggleLocation = useQueryBuilderStore((state) => state.toggleLocation);
  const clearLocations = useQueryBuilderStore((state) => state.clearLocations);

  // Get selected locations for display
  const selectedLocations = useMemo(() => {
    return LOCATION_PRESETS.filter((loc) => activeLocationIds.includes(loc.id));
  }, [activeLocationIds]);

  // Filter and group locations based on search
  const { quickPicks, regions, countries, cities } = useMemo(() => {
    const searchLower = search.toLowerCase();

    const filtered = search
      ? LOCATION_PRESETS.filter(
          (loc) =>
            loc.label.toLowerCase().includes(searchLower) ||
            loc.queryFragment.toLowerCase().includes(searchLower)
        )
      : LOCATION_PRESETS;

    // Get quick picks (only show when not searching)
    const quickPickLocations = search
      ? []
      : LOCATION_QUICK_PICKS.map((id) => getLocationById(id)).filter(
          Boolean
        ) as LocationPreset[];

    return {
      quickPicks: quickPickLocations,
      regions: filtered.filter((loc) => loc.type === "region"),
      countries: filtered.filter((loc) => loc.type === "country"),
      cities: filtered.filter((loc) => loc.type === "city"),
    };
  }, [search]);

  const handleSelect = (locationId: string) => {
    toggleLocation(locationId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Locations</span>
        </div>
        {selectedLocations.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLocations}
            className="h-6 px-2 text-xs"
          >
            Clear ({selectedLocations.length})
          </Button>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10 py-2"
          >
            {selectedLocations.length === 0 ? (
              <span className="text-muted-foreground">Select locations...</span>
            ) : (
              <div className="flex flex-wrap gap-1 max-w-[280px]">
                {selectedLocations.slice(0, 3).map((loc) => (
                  <Badge
                    key={loc.id}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {loc.flag && <span>{loc.flag}</span>}
                    {loc.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLocation(loc.id);
                      }}
                    />
                  </Badge>
                ))}
                {selectedLocations.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedLocations.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[350px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search locations..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[350px]">
              <CommandEmpty>No locations found.</CommandEmpty>

              {/* Quick Picks */}
              {quickPicks.length > 0 && (
                <>
                  <CommandGroup heading="Quick Picks">
                    {quickPicks.map((loc) => (
                      <CommandItem
                        key={loc.id}
                        value={loc.id}
                        onSelect={() => handleSelect(loc.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            activeLocationIds.includes(loc.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="mr-2">{loc.flag}</span>
                        <span>{loc.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground capitalize">
                          {loc.type}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {/* Regions */}
              {regions.length > 0 && (
                <CommandGroup heading="Regions">
                  {regions.map((loc) => (
                    <CommandItem
                      key={loc.id}
                      value={loc.id}
                      onSelect={() => handleSelect(loc.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          activeLocationIds.includes(loc.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span>{loc.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Countries */}
              {countries.length > 0 && (
                <CommandGroup heading="Countries">
                  {countries.map((loc) => (
                    <CommandItem
                      key={loc.id}
                      value={loc.id}
                      onSelect={() => handleSelect(loc.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          activeLocationIds.includes(loc.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="mr-2">{loc.flag}</span>
                      <span>{loc.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Cities */}
              {cities.length > 0 && (
                <CommandGroup heading="Cities">
                  {cities.map((loc) => (
                    <CommandItem
                      key={loc.id}
                      value={loc.id}
                      onSelect={() => handleSelect(loc.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          activeLocationIds.includes(loc.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="mr-2">{loc.flag}</span>
                      <span>{loc.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected locations preview */}
      {selectedLocations.length > 3 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selectedLocations.slice(3).map((loc) => (
            <Badge
              key={loc.id}
              variant="outline"
              className="text-xs flex items-center gap-1"
            >
              {loc.flag && <span>{loc.flag}</span>}
              {loc.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleLocation(loc.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
