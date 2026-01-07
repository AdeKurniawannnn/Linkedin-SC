"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { PipelineStage } from "@/stores/agentSessionStore"
import { PIPELINE_STAGE_LABELS } from "@/config/agentDefaults"

interface AgentProgressBarProps {
  stage: PipelineStage
  progress: {
    current: number
    total: number
    message?: string
  }
  className?: string
}

/**
 * AgentProgressBar - Stage progress indicator
 *
 * Displays current pipeline stage with progress bar and status message.
 * Shows completion percentage and detailed progress counts.
 */
export function AgentProgressBar({
  stage,
  progress,
  className,
}: AgentProgressBarProps) {
  const { current, total, message } = progress

  // Calculate percentage (avoid division by zero)
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  // Get stage label
  const stageLabel = PIPELINE_STAGE_LABELS[stage] || "Idle"

  // Determine if stage is active
  const isActive = stage !== 'idle' && total > 0

  return (
    <div className={cn("space-y-2", className)}>
      {/* Stage Label and Progress Text */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{stageLabel}</span>
        {isActive && (
          <span className="text-muted-foreground">
            {current}/{total} {message && `• ${message}`}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{percentage}%</span>
            {message && <span className="italic">{message}</span>}
          </div>
        </div>
      )}

      {/* Idle State Message */}
      {!isActive && stage === 'idle' && (
        <p className="text-sm text-muted-foreground">
          No active pipeline operations
        </p>
      )}
    </div>
  )
}
