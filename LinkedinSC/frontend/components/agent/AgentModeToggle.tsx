"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface AgentModeToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/**
 * AgentModeToggle - Simple toggle switch to enable/disable Agent Mode
 *
 * Compact design for header placement with robot icon indicator
 */
export function AgentModeToggle({
  checked,
  onChange,
  disabled = false,
  className,
}: AgentModeToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch
        id="agent-mode-toggle"
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <Label
        htmlFor="agent-mode-toggle"
        className="flex items-center gap-1.5 cursor-pointer"
      >
        <Sparkles className={cn(
          "size-4 transition-colors",
          checked ? "text-primary" : "text-muted-foreground"
        )} />
        <span className="text-sm font-medium">Agent Mode</span>
      </Label>
    </div>
  )
}
