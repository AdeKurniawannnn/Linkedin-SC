"use client";

import { MagnifyingGlass, Sparkle } from "@phosphor-icons/react";

/**
 * EmptyState Component
 *
 * Displayed in the right panel when no search results are available.
 * Provides helpful hints to guide the user.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-6">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MagnifyingGlass className="w-8 h-8 text-muted-foreground" weight="duotone" />
      </div>

      <h3 className="text-lg font-medium text-foreground mb-2">
        No results yet
      </h3>

      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Build your query using the presets and form on the left, then click Search to see results here.
      </p>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkle className="w-4 h-4" weight="fill" />
        <span>
          Tip: Press <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">⌘K</kbd> for quick preset search
        </span>
      </div>
    </div>
  );
}
