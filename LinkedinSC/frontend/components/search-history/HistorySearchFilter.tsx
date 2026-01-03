"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HistorySearchFilterProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * HistorySearchFilter Component
 *
 * Search input for filtering history entries.
 */
export function HistorySearchFilter({
  value,
  onChange,
}: HistorySearchFilterProps) {
  return (
    <div className="relative">
      <MagnifyingGlass
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        weight="bold"
      />
      <Input
        placeholder="Filter history..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 h-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={() => onChange("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
