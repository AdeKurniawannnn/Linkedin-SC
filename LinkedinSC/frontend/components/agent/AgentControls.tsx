"use client"

import * as React from "react"
import { Pause, Play, Square, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { PipelineStage } from "@/stores/agentSessionStore"

interface AgentControlsProps {
  isRunning: boolean
  isPaused: boolean
  currentStage: PipelineStage
  currentRound: number
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onGenerateMore: () => void
}

/**
 * AgentControls - Pipeline control buttons
 *
 * Provides controls for pausing, resuming, stopping, and generating more queries.
 * Includes confirmation dialog for destructive actions.
 */
export function AgentControls({
  isRunning,
  isPaused,
  currentStage,
  currentRound,
  onPause,
  onResume,
  onStop,
  onGenerateMore,
}: AgentControlsProps) {
  const [stopDialogOpen, setStopDialogOpen] = React.useState(false)

  const handleStop = () => {
    onStop()
    setStopDialogOpen(false)
  }

  const isComplete = currentStage === 'idle' && currentRound > 0

  return (
    <div className="flex items-center gap-3">
      {/* Round Badge */}
      {currentRound > 0 && (
        <Badge variant="outline" className="px-3 py-1">
          Round {currentRound}
        </Badge>
      )}

      {/* Pause/Resume Toggle */}
      {isRunning && !isComplete && (
        <Button
          variant="outline"
          size="sm"
          onClick={isPaused ? onResume : onPause}
          disabled={currentStage === 'idle'}
        >
          {isPaused ? (
            <>
              <Play className="mr-2 size-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="mr-2 size-4" />
              Pause
            </>
          )}
        </Button>
      )}

      {/* Stop Button with Confirmation */}
      {isRunning && !isComplete && (
        <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Square className="mr-2 size-4" />
              Stop
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Stop Agent Pipeline?</AlertDialogTitle>
              <AlertDialogDescription>
                This will stop the current round and cancel all pending operations.
                Progress will be saved, but incomplete queries will not be executed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleStop}>
                Stop Pipeline
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Generate More Button (only when complete) */}
      {isComplete && (
        <Button
          variant="default"
          size="sm"
          onClick={onGenerateMore}
        >
          <Plus className="mr-2 size-4" />
          Generate More
        </Button>
      )}
    </div>
  )
}
