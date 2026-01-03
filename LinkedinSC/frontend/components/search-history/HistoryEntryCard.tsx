"use client";

import { useState } from "react";
import {
  ArrowClockwise,
  DownloadSimple,
  Star,
  Trash,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import type { ConvexSearchHistoryEntry } from "@/lib/convex-types";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface HistoryEntryCardProps {
  entry: ConvexSearchHistoryEntry;
  isSelected: boolean;
  onSelect: (id: Id<"searchHistory">, selected: boolean) => void;
  onLoadResults: (id: Id<"searchHistory">) => void;
  onRerun: (id: Id<"searchHistory">) => void;
  onExport: (id: Id<"searchHistory">) => void;
  onDelete: (id: Id<"searchHistory">) => void;
  onToggleStar: (id: Id<"searchHistory">) => void;
}

/**
 * HistoryEntryCard Component
 *
 * Clean entry card with hover-reveal actions.
 * - Click card body: Load cached results from history
 * - Click rerun button: Confirmation dialog → restore query + trigger new search
 * Features selection checkbox, minimal metadata, and visible action buttons (rerun, star, export, delete).
 */
export function HistoryEntryCard({
  entry,
  isSelected,
  onSelect,
  onLoadResults,
  onRerun,
  onExport,
  onDelete,
  onToggleStar,
}: HistoryEntryCardProps) {
  const [showRerunDialog, setShowRerunDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const truncatedQuery =
    entry.query.composedQuery.length > 60
      ? entry.query.composedQuery.substring(0, 60) + "..."
      : entry.query.composedQuery;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("[role='checkbox']") ||
      target.closest("[role='menuitem']")
    ) {
      return;
    }
    onLoadResults(entry._id);
  };

  const handleRerunConfirm = () => {
    setShowRerunDialog(false);
    onRerun(entry._id);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(false);
    onDelete(entry._id);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onLoadResults(entry._id);
          }
        }}
        className={cn(
          "relative group rounded-lg border border-transparent p-3 cursor-pointer",
          "hover:border-border hover:bg-muted/30",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isSelected && "border-primary bg-primary/5"
        )}
      >
      <div className="flex items-start gap-3">
        {/* Left: Selection checkbox */}
        <div
          className={cn(
            "pt-0.5 transition-opacity",
            !isSelected && "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          )}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(entry._id, checked === true)}
            aria-label="Select entry"
          />
        </div>

        {/* Middle: Main content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Query preview */}
          <p
            className="font-mono text-sm text-foreground truncate"
            title={entry.query.composedQuery}
          >
            {truncatedQuery}
          </p>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(entry.timestamp), {
                addSuffix: true,
              })}
            </span>
            <Separator orientation="vertical" className="h-3" />
            <span>{entry.totalResults} results</span>
            {entry.compressed && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span className="text-destructive">Compressed</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions (visible on hover) */}
        <div
          className={cn(
            "flex items-center gap-1 shrink-0",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowRerunDialog(true)}
            title="Re-run search with fresh results"
          >
            <ArrowClockwise className="h-4 w-4" weight="bold" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleStar(entry._id)}
            title={entry.starred ? "Unstar" : "Star"}
          >
            <Star
              className={cn("h-4 w-4", entry.starred && "text-yellow-500")}
              weight={entry.starred ? "fill" : "bold"}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onExport(entry._id)}
            disabled={entry.compressed}
            title="Export to CSV"
          >
            <DownloadSimple className="h-4 w-4" weight="bold" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            title="Delete"
          >
            <Trash className="h-4 w-4" weight="bold" />
          </Button>
        </div>
      </div>

        {/* Star indicator - shown when starred */}
        {entry.starred && (
          <div className="absolute top-2 right-2 text-yellow-500">
            <Star className="h-3 w-3" weight="fill" />
          </div>
        )}
      </div>

      {/* Re-run confirmation dialog */}
      <AlertDialog open={showRerunDialog} onOpenChange={setShowRerunDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-run this search?</AlertDialogTitle>
            <AlertDialogDescription>
              This will load the query parameters and execute a new search with fresh results.
              Your current results will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRerunConfirm}>
              Re-run Search
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this search?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this search history entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
