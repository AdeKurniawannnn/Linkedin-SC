"use client";

import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QueryPreviewCompact } from "@/components/query-builder/QueryPreview";
import { TrashSimple } from "@phosphor-icons/react";

interface HeaderBarProps {
  onClear: () => void;
  agentModeToggle?: React.ReactNode;
}

/**
 * HeaderBar Component
 *
 * A compact horizontal header bar that spans the full width of the viewport.
 * Contains:
 * - Left: StatusIndicator (backend status)
 * - Center: QueryPreviewCompact (live query preview with actions)
 * - Right: AgentModeToggle (optional) + ThemeToggle + Clear button
 */
export function HeaderBar({ onClear, agentModeToggle }: HeaderBarProps) {
  return (
    <header
      className="h-16 px-4 flex items-center gap-4 border-b border-border bg-background"
      style={{ "--header-height": "64px" } as React.CSSProperties}
    >
      {/* Left: Status Indicator */}
      <StatusIndicator />

      {/* Center: Query Preview (flex-grow) */}
      <QueryPreviewCompact />

      {/* Right: Agent Mode Toggle + Theme Toggle + Clear Button */}
      <div className="flex items-center gap-3">
        {agentModeToggle}
        <div className="h-4 w-px bg-border" />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
          title="Clear all data"
        >
          <TrashSimple className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>
    </header>
  );
}
