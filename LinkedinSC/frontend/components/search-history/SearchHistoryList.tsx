"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { SearchHistoryEntry } from "./SearchHistoryEntry";
import type { ConvexSearchHistoryEntry } from "@/lib/convex-types";
import type { Id } from "@/convex/_generated/dataModel";

interface SearchHistoryListProps {
  entries: ConvexSearchHistoryEntry[];
  onRerun: (id: Id<"searchHistory">) => void;
  onExport: (id: Id<"searchHistory">) => void;
  onDelete: (id: Id<"searchHistory">) => void;
}

/**
 * SearchHistoryList Component
 *
 * Displays a filterable list of search history entries.
 */
export function SearchHistoryList({
  entries,
  onRerun,
  onExport,
  onDelete,
}: SearchHistoryListProps) {
  const [filter, setFilter] = useState("");

  const filteredEntries = filter
    ? entries.filter(
        (entry) =>
          entry.query.composedQuery.toLowerCase().includes(filter.toLowerCase()) ||
          entry.query.baseQuery.toLowerCase().includes(filter.toLowerCase())
      )
    : entries;

  return (
    <div className="space-y-3">
      {entries.length > 5 && (
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" weight="bold" />
          <Input
            placeholder="Filter history..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {filter ? "No matching entries" : "No search history"}
          </p>
        ) : (
          filteredEntries.map((entry) => (
            <SearchHistoryEntry
              key={entry._id}
              entry={entry}
              onRerun={onRerun}
              onExport={onExport}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {filteredEntries.length < entries.length && (
        <p className="text-xs text-center text-muted-foreground">
          Showing {filteredEntries.length} of {entries.length} entries
        </p>
      )}
    </div>
  );
}
