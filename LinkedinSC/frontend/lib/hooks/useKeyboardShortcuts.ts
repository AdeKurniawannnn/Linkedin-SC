/**
 * Keyboard Shortcuts Hook
 *
 * Provides keyboard shortcuts for the query builder interface.
 * Shortcuts are disabled when user is typing in an input field.
 */

import { useEffect, useCallback, useRef } from "react";

interface ShortcutConfig {
  /** Callback when Ctrl/Cmd + Enter is pressed (trigger search) */
  onSearch?: () => void;
  /** Callback when Ctrl/Cmd + K is pressed (focus search input) */
  onFocusSearch?: () => void;
  /** Callback when Escape is pressed (clear/cancel) */
  onEscape?: () => void;
  /** Callback when Ctrl/Cmd + Shift + C is pressed (copy query) */
  onCopyQuery?: () => void;
  /** Whether shortcuts are enabled (disable during loading, etc.) */
  enabled?: boolean;
}

/**
 * Hook to handle keyboard shortcuts for the query builder
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onSearch: handleSearch,
 *   onFocusSearch: () => inputRef.current?.focus(),
 *   onEscape: clearPresets,
 *   onCopyQuery: handleCopy,
 *   enabled: !isLoading,
 * });
 * ```
 */
export function useKeyboardShortcuts({
  onSearch,
  onFocusSearch,
  onEscape,
  onCopyQuery,
  enabled = true,
}: ShortcutConfig) {
  // Track if we're inside an input field
  const isInputFocused = useRef(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Ctrl/Cmd + Enter: Trigger search (works even in input)
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        onSearch?.();
        return;
      }

      // Ctrl/Cmd + K: Focus search input (works globally)
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Ctrl/Cmd + Shift + C: Copy query (works globally)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === "C") {
        event.preventDefault();
        onCopyQuery?.();
        return;
      }

      // Escape: Clear/Cancel (only when not in input, or clear input if empty)
      if (event.key === "Escape") {
        if (isInput) {
          const inputTarget = target as HTMLInputElement;
          if (inputTarget.value === "") {
            // If input is empty, blur and trigger escape action
            inputTarget.blur();
            onEscape?.();
          }
          // If input has value, let default behavior clear it
          return;
        }
        event.preventDefault();
        onEscape?.();
        return;
      }
    },
    [enabled, onSearch, onFocusSearch, onEscape, onCopyQuery]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * Component to display keyboard shortcut hints
 */
export const KEYBOARD_SHORTCUTS = {
  search: { keys: ["⌘", "Enter"], description: "Search" },
  focusSearch: { keys: ["⌘", "K"], description: "Focus search" },
  copyQuery: { keys: ["⌘", "⇧", "C"], description: "Copy query" },
  escape: { keys: ["Esc"], description: "Clear selection" },
} as const;
