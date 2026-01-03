"use client";

import { DownloadSimple, Trash, HardDrive } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { useConvexSearchHistory } from "@/hooks";
import { formatBytes, getStorageStatusColor } from "@/lib/utils/storageUtils";
import { cn } from "@/lib/utils";

/**
 * StoragePopover Component
 *
 * Compact storage indicator that expands to show full storage details
 * and management actions (Export All, Clear All).
 */
export function StoragePopover() {
  const { getStorageInfo, downloadCSV, clearHistory, entries } =
    useConvexSearchHistory();
  const { used, max, percentage } = getStorageInfo();

  const color = getStorageStatusColor(percentage);

  const colorClasses = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  const handleExportAll = () => {
    downloadCSV();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                colorClasses[color]
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span className="text-xs">{percentage}%</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" weight="duotone" />
            <div className="space-y-0.5">
              <h4 className="text-sm font-medium">Storage</h4>
              <p className="text-xs text-muted-foreground">
                {formatBytes(used)} of {formatBytes(max)} used
              </p>
            </div>
          </div>

          {/* Full-width storage bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                colorClasses[color]
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleExportAll}
              disabled={entries.length === 0}
            >
              <DownloadSimple className="h-4 w-4 mr-1.5" weight="bold" />
              Export All
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={entries.length === 0}
                >
                  <Trash className="h-4 w-4 mr-1.5" weight="bold" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all search history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {entries.length} search
                    history entries. This action cannot be undone.
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
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
