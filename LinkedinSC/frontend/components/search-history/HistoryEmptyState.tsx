"use client";

import { ClockCounterClockwise, Star, MagnifyingGlass } from "@phosphor-icons/react";

type TabType = "recent" | "all" | "starred";

interface HistoryEmptyStateProps {
  tab: TabType;
}

/**
 * HistoryEmptyState Component
 *
 * Context-aware empty state messages for each tab.
 */
export function HistoryEmptyState({ tab }: HistoryEmptyStateProps) {
  const states = {
    recent: {
      icon: ClockCounterClockwise,
      title: "No recent searches",
      description: "Run a search to start building your history",
    },
    all: {
      icon: MagnifyingGlass,
      title: "No search history yet",
      description: "Your searches will appear here automatically",
    },
    starred: {
      icon: Star,
      title: "No starred searches",
      description: "Star your favorite searches for quick access",
    },
  };

  const state = states[tab];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" weight="duotone" />
      </div>
      <p className="text-sm font-medium text-foreground">{state.title}</p>
      <p className="text-xs text-muted-foreground mt-1">{state.description}</p>
    </div>
  );
}
