"use client";

import { Panel } from "./Panel";
import { cn } from "@/lib/utils";

interface SplitPanelLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  className?: string;
}

/**
 * SplitPanelLayout Component
 *
 * A two-column layout with focus-based resizing.
 * - Focused panel gets 60% width
 * - Unfocused panel gets 40% width
 * - Each panel scrolls independently
 * - Smooth 150ms transition on focus change
 */
export function SplitPanelLayout({
  leftPanel,
  rightPanel,
  className,
}: SplitPanelLayoutProps) {
  return (
    <div
      className={cn(
        "flex w-full h-[calc(100vh-var(--header-height,64px))] overflow-hidden",
        className
      )}
    >
      {/* Left Panel */}
      <Panel id="left" className="border-r border-border">
        {leftPanel}
      </Panel>

      {/* Right Panel */}
      <Panel id="right">
        {rightPanel}
      </Panel>
    </div>
  );
}
