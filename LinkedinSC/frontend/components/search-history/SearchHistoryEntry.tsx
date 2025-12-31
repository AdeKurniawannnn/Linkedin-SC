"use client";

import { Clock, ArrowClockwise, DownloadSimple, Trash, FileX } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatDistanceToNow } from "date-fns";
import type { SearchHistoryEntry as SearchHistoryEntryType } from "@/stores/searchHistoryStore";

interface SearchHistoryEntryProps {
  entry: SearchHistoryEntryType;
  onRerun: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * SearchHistoryEntry Component
 *
 * Displays a single search history entry with actions.
 */
export function SearchHistoryEntry({
  entry,
  onRerun,
  onExport,
  onDelete,
}: SearchHistoryEntryProps) {
  const truncatedQuery =
    entry.query.composedQuery.length > 80
      ? entry.query.composedQuery.substring(0, 80) + "..."
      : entry.query.composedQuery;

  return (
    <div className="border rounded-lg p-3 space-y-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm truncate" title={entry.query.composedQuery}>
            {truncatedQuery}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {entry.totalResults} results
            </Badge>
            <Badge variant="outline" className="text-xs">
              {entry.query.country.toUpperCase()}
            </Badge>
            {entry.compressed && (
              <Badge variant="destructive" className="text-xs">
                <FileX className="h-3 w-3 mr-1" weight="bold" />
                Compressed
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRerun(entry.id)}
            className="h-7 w-7 p-0"
            title="Load query to search form"
          >
            <ArrowClockwise className="h-3.5 w-3.5" weight="bold" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExport(entry.id)}
            className="h-7 w-7 p-0"
            title="Export to CSV"
            disabled={entry.compressed}
          >
            <DownloadSimple className="h-3.5 w-3.5" weight="bold" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                title="Delete this entry"
              >
                <Trash className="h-3.5 w-3.5" weight="bold" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete history entry?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this search from your history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(entry.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" weight="bold" />
          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
        </span>
        <span>{entry.metadata.time_taken_seconds.toFixed(1)}s</span>
        <span>{entry.metadata.pages_fetched} pages</span>
      </div>
    </div>
  );
}
