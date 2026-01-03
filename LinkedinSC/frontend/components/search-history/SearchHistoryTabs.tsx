"use client";

import { useState, useMemo, useCallback } from "react";
import { ClockCounterClockwise, ListBullets, Star } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryEntryCard } from "./HistoryEntryCard";
import { HistoryEmptyState } from "./HistoryEmptyState";
import { HistorySearchFilter } from "./HistorySearchFilter";
import { HistoryBulkActions } from "./HistoryBulkActions";
import { useConvexSearchHistory } from "@/hooks";
import type { Id } from "@/convex/_generated/dataModel";

type TabType = "recent" | "all" | "starred";

/**
 * SearchHistoryTabs Component
 *
 * Tabs container with Recent / All / Starred views.
 * Handles selection state and coordinates with HistoryBulkActions.
 */
export function SearchHistoryTabs() {
  const [activeTab, setActiveTab] = useState<TabType>("recent");
  const [filter, setFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<Id<"searchHistory">>>(
    new Set()
  );

  const {
    entries,
    starredEntries,
    getRecentEntries,
    loadQueryToBuilder,
    loadResultsFromHistory,
    downloadCSV,
    deleteEntry,
    deleteMany,
    toggleStar,
  } = useConvexSearchHistory();

  // Get entries based on active tab
  const recentEntries = useMemo(() => getRecentEntries(10), [entries]);

  const filteredEntries = useMemo(() => {
    if (!filter) return entries;
    const term = filter.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.query.composedQuery.toLowerCase().includes(term) ||
        entry.query.baseQuery.toLowerCase().includes(term)
    );
  }, [entries, filter]);

  const displayedEntries = useMemo(() => {
    switch (activeTab) {
      case "recent":
        return recentEntries;
      case "all":
        return filteredEntries;
      case "starred":
        return starredEntries;
      default:
        return [];
    }
  }, [activeTab, recentEntries, filteredEntries, starredEntries]);

  // Selection handlers
  const handleSelect = useCallback(
    (id: Id<"searchHistory">, selected: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    []
  );

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleExportSelected = useCallback(() => {
    const ids = Array.from(selectedIds);
    downloadCSV(ids);
    handleClearSelection();
  }, [selectedIds, downloadCSV, handleClearSelection]);

  const handleDeleteSelected = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await deleteMany(ids);
    handleClearSelection();
  }, [selectedIds, deleteMany, handleClearSelection]);

  // Entry action handlers
  const handleLoadResults = useCallback(
    (id: Id<"searchHistory">) => {
      loadResultsFromHistory(id);
    },
    [loadResultsFromHistory]
  );

  const handleRerun = useCallback(
    (id: Id<"searchHistory">) => {
      loadQueryToBuilder(id);
    },
    [loadQueryToBuilder]
  );

  const handleExport = useCallback(
    (id: Id<"searchHistory">) => {
      downloadCSV([id]);
    },
    [downloadCSV]
  );

  const handleDelete = useCallback(
    (id: Id<"searchHistory">) => {
      deleteEntry(id);
      // Remove from selection if selected
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [deleteEntry]
  );

  const handleToggleStar = useCallback(
    (id: Id<"searchHistory">) => {
      toggleStar(id);
    },
    [toggleStar]
  );

  // Clear selection when changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
    setSelectedIds(new Set());
    setFilter("");
  };

  return (
    <div className="relative">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="recent" className="gap-1.5">
            <ClockCounterClockwise className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">Recent</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-1.5">
            <ListBullets className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">All</span>
          </TabsTrigger>
          <TabsTrigger value="starred" className="gap-1.5">
            <Star className="h-4 w-4" weight="duotone" />
            <span className="hidden sm:inline">Starred</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-3">
          {recentEntries.length === 0 ? (
            <HistoryEmptyState tab="recent" />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentEntries.map((entry) => (
                <HistoryEntryCard
                  key={entry._id}
                  entry={entry}
                  isSelected={selectedIds.has(entry._id)}
                  onSelect={handleSelect}
                  onLoadResults={handleLoadResults}
                  onRerun={handleRerun}
                  onExport={handleExport}
                  onDelete={handleDelete}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-3 space-y-3">
          {entries.length > 5 && (
            <HistorySearchFilter value={filter} onChange={setFilter} />
          )}
          {filteredEntries.length === 0 ? (
            <HistoryEmptyState tab="all" />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredEntries.map((entry) => (
                <HistoryEntryCard
                  key={entry._id}
                  entry={entry}
                  isSelected={selectedIds.has(entry._id)}
                  onSelect={handleSelect}
                  onLoadResults={handleLoadResults}
                  onRerun={handleRerun}
                  onExport={handleExport}
                  onDelete={handleDelete}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </div>
          )}
          {filter && filteredEntries.length < entries.length && (
            <p className="text-xs text-center text-muted-foreground">
              Showing {filteredEntries.length} of {entries.length} entries
            </p>
          )}
        </TabsContent>

        <TabsContent value="starred" className="mt-3">
          {starredEntries.length === 0 ? (
            <HistoryEmptyState tab="starred" />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {starredEntries.map((entry) => (
                <HistoryEntryCard
                  key={entry._id}
                  entry={entry}
                  isSelected={selectedIds.has(entry._id)}
                  onSelect={handleSelect}
                  onLoadResults={handleLoadResults}
                  onRerun={handleRerun}
                  onExport={handleExport}
                  onDelete={handleDelete}
                  onToggleStar={handleToggleStar}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bulk Actions Toolbar */}
      <HistoryBulkActions
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onExportSelected={handleExportSelected}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  );
}
