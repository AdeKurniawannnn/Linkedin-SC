"use client";

import { cn } from "@/lib/utils";
import type { PipelineStats } from "@/lib/agent/types";

/**
 * AgentPipelineView Component
 *
 * Horizontal funnel visualization showing pipeline flow through stages.
 * Displays query counts at each stage with rejection counts between stages.
 *
 * Layout:
 * [Generated] → [Pass 1] → [Pass 2] → [Executing] → [Done]
 *     50          38          28          24          24
 *               -12         -10
 *
 * Features:
 * - Rounded boxes for each stage with count inside
 * - Arrows between stages
 * - Current/active stage highlighted with glow
 * - Rejected counts shown below arrows in red/muted
 * - Animated transitions with CSS
 */

interface AgentPipelineViewProps {
  stats: PipelineStats;
  currentStage?: "generating" | "pass1" | "pass2" | "executing" | "complete";
}

interface PipelineStage {
  id: string;
  label: string;
  count: number;
  rejectedCount?: number;
}

export function AgentPipelineView({ stats, currentStage = "generating" }: AgentPipelineViewProps) {
  // Calculate stage counts and rejections
  const stages: PipelineStage[] = [
    {
      id: "generated",
      label: "Generated",
      count: stats.generated,
    },
    {
      id: "pass1",
      label: "Pass 1",
      count: stats.pass1Passed,
      rejectedCount: stats.pass1Rejected,
    },
    {
      id: "pass2",
      label: "Pass 2",
      count: stats.pass2Passed,
      rejectedCount: stats.pass2Rejected,
    },
    {
      id: "executing",
      label: "Executing",
      count: stats.executing,
    },
    {
      id: "done",
      label: "Done",
      count: stats.completed,
    },
  ];

  // Determine if stage is active
  const isStageActive = (stageId: string): boolean => {
    const stageMap: Record<string, string> = {
      generating: "generated",
      pass1: "pass1",
      pass2: "pass2",
      executing: "executing",
      complete: "done",
    };
    return stageMap[currentStage] === stageId;
  };

  // Determine if stage is completed
  const isStageCompleted = (stageId: string): boolean => {
    const stageOrder = ["generated", "pass1", "pass2", "executing", "done"];
    const currentIndex = stageOrder.indexOf(
      {
        generating: "generated",
        pass1: "pass1",
        pass2: "pass2",
        executing: "executing",
        complete: "done",
      }[currentStage]
    );
    const stageIndex = stageOrder.indexOf(stageId);
    return stageIndex < currentIndex;
  };

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-2 overflow-x-auto pb-4">
        {stages.map((stage, index) => {
          const isActive = isStageActive(stage.id);
          const isCompleted = isStageCompleted(stage.id);
          const showArrow = index < stages.length - 1;

          return (
            <div key={stage.id} className="flex items-start gap-2 min-w-0">
              {/* Stage Box */}
              <div className="flex flex-col items-center gap-2 min-w-[100px]">
                <div
                  className={cn(
                    "relative rounded-lg border-2 px-4 py-3 text-center transition-all duration-300",
                    isActive && "border-primary shadow-lg ring-4 ring-primary/20 scale-105",
                    isCompleted && "border-green-500 bg-green-50 dark:bg-green-950/20 scale-100",
                    !isActive && !isCompleted && "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 scale-95"
                  )}
                >
                  <div
                    className={cn(
                      "text-xs font-medium uppercase tracking-wide mb-1 transition-colors",
                      isActive && "text-primary",
                      isCompleted && "text-green-700 dark:text-green-400",
                      !isActive && !isCompleted && "text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {stage.label}
                  </div>
                  <div
                    className={cn(
                      "text-2xl font-bold transition-colors",
                      isActive && "text-primary",
                      isCompleted && "text-green-700 dark:text-green-400",
                      !isActive && !isCompleted && "text-gray-900 dark:text-gray-100"
                    )}
                  >
                    {stage.count}
                  </div>
                </div>

                {/* Rejected Count */}
                {stage.rejectedCount !== undefined && stage.rejectedCount > 0 && (
                  <div className="text-xs text-destructive font-medium animate-in fade-in duration-300">
                    -{stage.rejectedCount} rejected
                  </div>
                )}
              </div>

              {/* Arrow */}
              {showArrow && (
                <div className="flex items-center pt-6 min-w-[40px]">
                  <svg
                    className={cn(
                      "w-8 h-8 transition-colors",
                      isCompleted ? "text-green-500" : "text-gray-400 dark:text-gray-600"
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
