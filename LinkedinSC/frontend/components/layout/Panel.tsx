"use client";

import { useCallback } from "react";
import { usePanelFocusStore, type PanelId } from "@/stores/panelFocusStore";
import { cn } from "@/lib/utils";

interface PanelProps {
  id: PanelId;
  children: React.ReactNode;
  className?: string;
}

/**
 * Panel Component
 *
 * A wrapper for split-panel content that handles focus detection.
 * When clicked or focused, this panel becomes the "focused" panel (60% width).
 */
export function Panel({ id, children, className }: PanelProps) {
  const focusedPanel = usePanelFocusStore((state) => state.focusedPanel);
  const setFocus = usePanelFocusStore((state) => state.setFocus);

  const isFocused = focusedPanel === id;

  const handleFocus = useCallback(() => {
    if (focusedPanel !== id) {
      setFocus(id);
    }
  }, [focusedPanel, id, setFocus]);

  return (
    <div
      onMouseDown={handleFocus}
      onFocus={handleFocus}
      className={cn(
        // Base styles
        "overflow-y-auto px-4 py-4",
        // Transition for smooth resize
        "transition-[flex] duration-150 ease-out",
        // Focus-based sizing: 60% for focused, 40% for unfocused
        isFocused ? "flex-[6]" : "flex-[4]",
        className
      )}
    >
      {children}
    </div>
  );
}
