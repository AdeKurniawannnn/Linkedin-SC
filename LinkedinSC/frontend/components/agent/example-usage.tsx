/**
 * Example Usage - Agent UI Components
 *
 * This file demonstrates how to integrate the agent components
 * into a page or layout. NOT meant for production - just a reference.
 */

"use client"

import { useState } from "react"
import {
  AgentModeToggle,
  AgentConfigPanel,
  AgentControls,
  AgentProgressBar,
} from "@/components/agent"
import { useAgentSessionStore } from "@/stores/agentSessionStore"
import type { AgentSessionConfig } from "@/lib/agent/types"

export function AgentInterfaceExample() {
  const [isAgentMode, setAgentMode] = useState(false)

  const {
    isRunning,
    isPaused,
    currentStage,
    progress,
    setRunning,
    setPaused,
    reset,
  } = useAgentSessionStore()

  // Simulated handlers - replace with actual Convex mutations
  const handleStart = (config: AgentSessionConfig) => {
    console.log("Starting pipeline with config:", config)
    setRunning(true)
    // TODO: Call Convex mutation: api.agent.createSession
  }

  const handlePause = () => {
    console.log("Pausing pipeline...")
    setPaused(true)
    // TODO: Call Convex mutation: api.agent.pauseSession
  }

  const handleResume = () => {
    console.log("Resuming pipeline...")
    setPaused(false)
    // TODO: Call Convex mutation: api.agent.resumeSession
  }

  const handleStop = () => {
    console.log("Stopping pipeline...")
    setRunning(false)
    reset()
    // TODO: Call Convex mutation: api.agent.stopSession
  }

  const handleGenerateMore = () => {
    console.log("Generating more queries...")
    // TODO: Call Convex mutation: api.agent.startNewRound
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-8">
      {/* Header with Agent Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Search</h1>
          <p className="text-muted-foreground">
            {isAgentMode
              ? "Agentic query generation mode"
              : "Standard search mode"}
          </p>
        </div>
        <AgentModeToggle checked={isAgentMode} onChange={setAgentMode} />
      </div>

      {/* Agent Mode Interface */}
      {isAgentMode && (
        <>
          {/* Configuration Panel (shown when not running) */}
          {!isRunning && (
            <AgentConfigPanel onStart={handleStart} isRunning={isRunning} />
          )}

          {/* Controls and Progress (shown when running) */}
          {isRunning && (
            <div className="space-y-4">
              {/* Control Buttons */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <h2 className="text-lg font-semibold">Pipeline Controls</h2>
                <AgentControls
                  isRunning={isRunning}
                  isPaused={isPaused}
                  currentStage={currentStage}
                  currentRound={1}
                  onPause={handlePause}
                  onResume={handleResume}
                  onStop={handleStop}
                  onGenerateMore={handleGenerateMore}
                />
              </div>

              {/* Progress Indicator */}
              <div className="rounded-lg border p-4">
                <AgentProgressBar stage={currentStage} progress={progress} />
              </div>

              {/* Results would go here */}
              <div className="rounded-lg border p-4">
                <h2 className="text-lg font-semibold mb-4">Generated Queries</h2>
                <p className="text-sm text-muted-foreground">
                  Query results and pipeline stats would appear here...
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Standard Search Interface (shown when agent mode is off) */}
      {!isAgentMode && (
        <div className="rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">
            Standard search interface would appear here...
          </p>
        </div>
      )}
    </div>
  )
}
