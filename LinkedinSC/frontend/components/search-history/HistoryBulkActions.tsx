"use client";

import { DownloadSimple, Trash, X } from "@phosphor-icons/react";
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
import { cn } from "@/lib/utils";

interface HistoryBulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExportSelected: () => void;
  onDeleteSelected: () => void;
}

/**
 * HistoryBulkActions Component
 *
 * Sticky toolbar at bottom that slides up when items are selected.
 */
export function HistoryBulkActions({
  selectedCount,
  onClearSelection,
  onExportSelected,
  onDeleteSelected,
}: HistoryBulkActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 left-0 right-0",
        "flex items-center justify-between gap-2",
        "px-3 py-2 bg-background/95 backdrop-blur border-t",
        "transition-all duration-150",
        selectedCount === 0
          ? "translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      )}
    >
      <span className="text-sm text-muted-foreground">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
        <Button variant="outline" size="sm" onClick={onExportSelected}>
          <DownloadSimple className="h-4 w-4 mr-1.5" weight="bold" />
          Export
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash className="h-4 w-4 mr-1.5" weight="bold" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected entries?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedCount} search history
                entries. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteSelected}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete {selectedCount} entries
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
