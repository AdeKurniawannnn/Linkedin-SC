"use client";

import { useState, useEffect } from "react";
import { ClockCounterClockwise, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SearchHistoryTabs } from "./SearchHistoryTabs";
import { StoragePopover } from "./StoragePopover";
import { useConvexSearchHistory } from "@/hooks";
import { cn } from "@/lib/utils";

interface SearchHistorySectionProps {
  /** When true, the section auto-collapses (e.g., when results are displayed) */
  autoCollapse?: boolean;
}

/**
 * SearchHistorySection Component
 *
 * Main wrapper with Collapsible that auto-collapses when results appear.
 * Contains header with icon, title, count badge, and storage popover.
 */
export function SearchHistorySection({
  autoCollapse = false,
}: SearchHistorySectionProps) {
  const [isOpen, setIsOpen] = useState(!autoCollapse);
  const [isMounted, setIsMounted] = useState(false);

  const { entries, isLoading } = useConvexSearchHistory();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-collapse when autoCollapse prop changes
  useEffect(() => {
    if (autoCollapse) {
      setIsOpen(false);
    }
  }, [autoCollapse]);

  if (!isMounted || isLoading) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ClockCounterClockwise className="h-4 w-4" weight="duotone" />
            <span className="text-sm font-medium">History</span>
            {entries.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {entries.length}
              </Badge>
            )}
            <CaretDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
              weight="bold"
            />
          </Button>
        </CollapsibleTrigger>
        <StoragePopover />
      </div>

      <CollapsibleContent className="pt-3">
        <SearchHistoryTabs />
      </CollapsibleContent>
    </Collapsible>
  );
}
