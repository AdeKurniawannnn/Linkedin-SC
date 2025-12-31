"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Trash, DownloadSimple, ClockCounterClockwise } from "@phosphor-icons/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSearchHistoryStore } from "@/stores/searchHistoryStore";
import { SearchHistoryList } from "./SearchHistoryList";
import { SearchHistoryStorageBar } from "./SearchHistoryStorageBar";

/**
 * SearchHistoryPanel Component
 *
 * Main container for search history display and management.
 * Collapsible card with list, storage indicator, and bulk actions.
 */
export function SearchHistoryPanel() {
  const [expanded, setExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const entries = useSearchHistoryStore((state) => state.entries);
  const getRecentEntries = useSearchHistoryStore((state) => state.getRecentEntries);
  const loadQueryToBuilder = useSearchHistoryStore((state) => state.loadQueryToBuilder);
  const downloadCSV = useSearchHistoryStore((state) => state.downloadCSV);
  const deleteEntry = useSearchHistoryStore((state) => state.deleteEntry);
  const clearHistory = useSearchHistoryStore((state) => state.clearHistory);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const recentEntries = getRecentEntries(50);

  const handleRerun = (id: string) => {
    loadQueryToBuilder(id);
  };

  const handleExport = (id: string) => {
    downloadCSV([id]);
  };

  const handleExportAll = () => {
    downloadCSV();
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
  };

  // Empty state
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ClockCounterClockwise className="h-5 w-5 text-muted-foreground" weight="bold" />
            <div>
              <CardTitle className="text-base">Search History</CardTitle>
              <CardDescription>Your searches will appear here automatically</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">No search history yet</p>
            <p className="text-xs mt-1">Run a search to start building your history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockCounterClockwise className="h-5 w-5 text-muted-foreground" weight="bold" />
            <div>
              <CardTitle className="text-base">Search History</CardTitle>
              <CardDescription>
                {entries.length} search{entries.length !== 1 ? "es" : ""} recorded
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SearchHistoryStorageBar />

            {/* Export All */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportAll}
              className="h-8 px-2"
              title="Export all history to CSV"
            >
              <DownloadSimple className="h-4 w-4" weight="bold" />
            </Button>

            {/* Clear All */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-destructive hover:text-destructive"
                  title="Clear all history"
                >
                  <Trash className="h-4 w-4" weight="bold" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all search history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {entries.length} search history entries. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearHistory}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Expand/Collapse */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          <SearchHistoryList
            entries={recentEntries}
            onRerun={handleRerun}
            onExport={handleExport}
            onDelete={handleDelete}
          />
        </CardContent>
      )}
    </Card>
  );
}
