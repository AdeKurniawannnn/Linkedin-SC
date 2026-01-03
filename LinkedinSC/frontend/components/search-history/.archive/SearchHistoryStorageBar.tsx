"use client";

import { useConvexSearchHistory } from "@/hooks";
import { formatBytes, getStorageStatusColor } from "@/lib/utils/storageUtils";
import { cn } from "@/lib/utils";

/**
 * SearchHistoryStorageBar Component
 *
 * Visual indicator of storage usage for search history.
 */
export function SearchHistoryStorageBar() {
  const { getStorageInfo } = useConvexSearchHistory();
  const { used, max, percentage } = getStorageInfo();

  const color = getStorageStatusColor(percentage);

  const colorClasses = {
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all", colorClasses[color])}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatBytes(used)} / {formatBytes(max)}
      </span>
    </div>
  );
}
