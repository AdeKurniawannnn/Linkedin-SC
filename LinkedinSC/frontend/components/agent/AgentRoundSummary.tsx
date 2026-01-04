"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

/**
 * AgentRoundSummary Component
 *
 * Summary card for each round, displayed in a horizontal scroll.
 *
 * Layout (horizontal scroll of cards):
 * ┌─ Round 1 ──────┐  ┌─ Round 2 ──────┐  ┌─ Round 3 ──────┐
 * │ Generated: 50  │  │ Generated: 50  │  │ In Progress... │
 * │ P1 Passed: 38  │  │ P1 Passed: 42  │  │ ████░░░░ 40%   │
 * │ P2 Passed: 28  │  │ P2 Passed: 35  │  │                │
 * │ Avg Score: 81% │  │ Avg Score: 78% │  │                │
 * └────────────────┘  └────────────────┘  └────────────────┘
 *
 * Features:
 * - Card for each completed round
 * - Special "In Progress" card for current round
 * - Stats: queriesGenerated, queriesPassedPass1, queriesPassedPass2, avgCompositeScore
 * - Completion timestamp
 */

/**
 * Convex-compatible round history entry
 */
interface ConvexRoundHistory {
  round: number;
  queriesGenerated: number;
  queriesPassedPass1: number;
  queriesPassedPass2: number;
  avgCompositeScore?: number;
  timestamp: number;
}

interface AgentRoundSummaryProps {
  roundHistory: ConvexRoundHistory[];
  currentRound: number;
  currentProgress?: {
    generated: number;
    pass1Passed: number;
    pass2Passed: number;
    executing: number;
    completed: number;
  };
}

export function AgentRoundSummary({
  roundHistory,
  currentRound,
  currentProgress,
}: AgentRoundSummaryProps) {
  const showInProgress = currentRound > 0 && currentProgress;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {/* Completed Rounds */}
        {roundHistory.map((round) => {
          const avgComposite = round.avgCompositeScore ?? 0;
          const pass1Rejected = round.queriesGenerated - round.queriesPassedPass1;
          const pass2Rejected = round.queriesPassedPass1 - round.queriesPassedPass2;

          return (
            <Card key={round.round} className="min-w-[280px] shrink-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Round {round.round}</CardTitle>
                  <Badge variant="default" className="bg-green-600">
                    Completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatRow label="Generated" value={round.queriesGenerated} />
                <StatRow
                  label="P1 Passed"
                  value={round.queriesPassedPass1}
                  subtext={`${pass1Rejected} rejected`}
                />
                <StatRow
                  label="P2 Passed"
                  value={round.queriesPassedPass2}
                  subtext={`${pass2Rejected} rejected`}
                />
                <StatRow
                  label="Avg Score"
                  value={`${Math.round(avgComposite)}%`}
                  color={getScoreColor(avgComposite)}
                />
                <div className="pt-2 border-t mt-3">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(round.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* In Progress Round */}
        {showInProgress && currentProgress && (
          <Card className="min-w-[280px] shrink-0 border-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Round {currentRound}</CardTitle>
                <Badge variant="outline" className="border-primary text-primary">
                  In Progress
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <StatRow label="Generated" value={currentProgress.generated} />
              <StatRow label="P1 Passed" value={currentProgress.pass1Passed} />
              <StatRow label="P2 Passed" value={currentProgress.pass2Passed} />
              <StatRow label="Executing" value={currentProgress.executing} />
              <StatRow label="Completed" value={currentProgress.completed} highlight />

              {/* Progress Bar */}
              {currentProgress.generated > 0 && (
                <div className="pt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {Math.round((currentProgress.completed / currentProgress.generated) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${(currentProgress.completed / currentProgress.generated) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Placeholder for no rounds */}
        {roundHistory.length === 0 && !showInProgress && (
          <Card className="min-w-[280px] shrink-0 border-dashed">
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No rounds started yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * StatRow Component - Reusable stat display row
 */
interface StatRowProps {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
  color?: string;
}

function StatRow({ label, value, subtext, highlight, color }: StatRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <div className="text-right">
        <span
          className={cn(
            "text-sm font-semibold",
            highlight && "text-primary",
            color && `text-${color}-600 dark:text-${color}-400`
          )}
        >
          {value}
        </span>
        {subtext && (
          <p className="text-xs text-muted-foreground">{subtext}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Helper to get score color
 */
function getScoreColor(score: number): string {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  if (score >= 40) return "orange";
  return "red";
}
