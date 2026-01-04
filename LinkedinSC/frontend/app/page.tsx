"use client";

import { useState } from "react";
import { QueryPresets } from "@/components/query-builder/QueryPresets";
import { UnifiedSearchForm } from "@/components/query-builder/UnifiedSearchForm";
import { SavedSearchesList } from "@/components/query-builder/SavedSearchesList";
import { PresetCommandPalette } from "@/components/query-builder/PresetCommandPalette";
import { UnifiedResultsTable } from "@/components/UnifiedResultsTable";
import { ProgressBar } from "@/components/ProgressBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SearchHistorySection } from "@/components/search-history";
import {
  HeaderBar,
  SplitPanelLayout,
  MobileTabs,
  EmptyState,
} from "@/components/layout";
import {
  AgentModeToggle,
  AgentConfigPanel,
  AgentControls,
  AgentProgressBar,
  AgentPipelineView,
  AgentQueryTable,
  AgentRoundSummary,
} from "@/components/agent";
import { useResultsStore } from "@/stores/resultsStore";
import { useQueryBuilderStore } from "@/stores/queryBuilderStore";
import { useAgentSessionStore } from "@/stores/agentSessionStore";
import { useConvexSearchHistory, useBuildQueryWithPresets, useAgentSession } from "@/hooks";
import { useAgentPipeline } from "@/hooks/useAgentPipeline";
import { type RawSearchResponse } from "@/lib/api";
import type { AgentSessionConfig } from "@/lib/agent/types";
import { toast } from "sonner";

export default function Home() {
  // Agent mode state
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentSessionConfig | null>(null);

  // Use persisted stores
  const { results, aggregatedMetadata, error, isLoading, appendResults, setError, clearResults } = useResultsStore();
  const { resetAll: resetQueryBuilder } = useQueryBuilderStore();
  const { addEntry: addHistoryEntry } = useConvexSearchHistory();

  // Agent stores and hooks
  const { currentStage, isRunning: isAgentRunning, isPaused, progress, pipelineStats } = useAgentSessionStore();

  // Convex-backed agent session management
  const agentSession = useAgentSession();

  // Get composed query including custom presets from Convex
  const composedQuery = useBuildQueryWithPresets();

  // Initialize agent pipeline with Convex callbacks for persistence
  const agentPipeline = useAgentPipeline({
    sessionId: agentSession.activeSessionId || "temp-session",
    config: agentConfig || {
      persona: "",
      seedQuery: "",
      scoringMasterPrompt: "",
      pass1Threshold: 70,
      pass2Threshold: 65,
      queryBudgetPerRound: 20,
      concurrencyLimit: 3,
      maxResultsPerQuery: 50,
    },
    // Wire up Convex callbacks for persistence
    convex: agentSession.activeSessionId ? {
      addQueryBatch: agentSession.addQueryBatch,
      updatePass1: agentSession.updatePass1,
      updatePass2: agentSession.updatePass2,
      updateExecution: agentSession.updateExecution,
      updateStatus: agentSession.updateStatus,
      getTopQueriesForContext: () => {
        return agentSession.getTopQueriesForContext(5).map(q => ({
          query: q.query,
          compositeScore: q.compositeScore,
          pass1Score: q.pass1Score,
          pass2Score: q.pass2Score,
        }));
      },
    } : undefined,
    onProgress: (progress) => {
      // Progress is already tracked by the pipeline store
    },
    onStageComplete: (stage, stats) => {
      toast.success(`${stage} stage completed`, {
        description: `Stats: ${JSON.stringify(stats)}`,
      });
    },
    onComplete: (totalResults) => {
      toast.success("Agent pipeline completed", {
        description: `Generated ${totalResults} total results`,
      });
    },
    onError: (error) => {
      setError(error);
      toast.error("Agent pipeline error", {
        description: error,
      });
    },
  });

  const handleSearchComplete = (response: RawSearchResponse) => {
    // Get the query state for history capture
    const queryState = useQueryBuilderStore.getState();

    // Append results with deduplication (aggregates across multiple queries)
    appendResults(response.results, response.metadata, composedQuery);

    // Capture search to history
    addHistoryEntry(
      {
        baseQuery: queryState.baseQuery,
        activePresetIds: queryState.activePresetIds,
        activeLocationIds: queryState.activeLocationIds,
        country: queryState.country,
        language: queryState.language,
        maxResults: queryState.maxResults,
        composedQuery,
      },
      response
    );

    toast.success(`Found ${response.total_results} results`, {
      description: `Search completed in ${response.metadata.time_taken_seconds.toFixed(1)}s`,
    });
  };

  const handleSearchError = (err: Error) => {
    setError(err.message || "Search failed");
    toast.error("Search failed", {
      description: err.message || "An unexpected error occurred",
    });
  };

  const handleClearAll = () => {
    clearResults();
    resetQueryBuilder();
  };

  // Agent handler functions
  const handleAgentStart = async (config: AgentSessionConfig) => {
    try {
      // Create a new session in Convex
      const sessionId = await agentSession.create(config);

      // Store config for pipeline
      setAgentConfig(config);

      // Start the pipeline
      await agentPipeline.start();
    } catch (error) {
      console.error("Failed to start agent:", error);
      toast.error("Failed to start agent", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handlePause = () => {
    agentPipeline.pause();
    toast.info("Agent pipeline paused");
  };

  const handleResume = () => {
    agentPipeline.resume();
    toast.info("Agent pipeline resumed");
  };

  const handleStop = () => {
    agentPipeline.stop();
    toast.info("Agent pipeline stopped");
  };

  const handleGenerateMore = async () => {
    try {
      await agentPipeline.generateMore();
    } catch (error) {
      console.error("Failed to generate more queries:", error);
      toast.error("Failed to generate more queries");
    }
  };

  // Left panel content: Query building tools OR agent config
  const leftPanelContent = (
    <div className="space-y-6">
      {isAgentMode ? (
        // Agent Mode: Show configuration panel
        <AgentConfigPanel
          onStart={handleAgentStart}
          isRunning={isAgentRunning}
        />
      ) : (
        // Normal Mode: Show search form and presets
        <>
          {/* Search Form - Primary action */}
          <UnifiedSearchForm
            onSearchComplete={handleSearchComplete}
            onSearchError={handleSearchError}
          />

          {/* Query Presets - Configuration before search */}
          <QueryPresets />

          {/* Saved Searches - Quick recall for returning users */}
          <SavedSearchesList />
        </>
      )}
    </div>
  );

  // Right panel content: Results and history (with optional agent views)
  const rightPanelContent = (
    <div className="space-y-6 h-full flex flex-col">
      {/* Results Section */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Agent Mode: Pipeline Views */}
        {isAgentMode && (
          <div className="space-y-4 mb-6">
            {/* Progress Bar for Agent */}
            <AgentProgressBar stage={currentStage} progress={progress} />

            {/* Pipeline Statistics */}
            <AgentPipelineView
              stats={pipelineStats}
              currentStage={currentStage === 'idle' ? undefined : currentStage}
            />

            {/* Round Summary */}
            {agentSession.session && (
              <AgentRoundSummary
                roundHistory={agentSession.session.roundHistory || []}
                currentRound={agentSession.session.currentRound}
              />
            )}

            {/* Query Table */}
            <AgentQueryTable queries={agentSession.queries} />

            {/* Agent Controls */}
            <AgentControls
              isRunning={isAgentRunning}
              isPaused={isPaused}
              currentStage={currentStage}
              currentRound={agentSession.session?.currentRound || 0}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onGenerateMore={handleGenerateMore}
            />
          </div>
        )}

        {/* Normal Mode: Progress Bar */}
        {!isAgentMode && <ProgressBar isLoading={isLoading} />}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Results Table or Empty State */}
        {results ? (
          <UnifiedResultsTable results={results} metadata={aggregatedMetadata ?? undefined} />
        ) : (
          !isLoading && !error && <EmptyState />
        )}
      </div>

      {/* Search History - Only show in normal mode, collapsible */}
      {!isAgentMode && <SearchHistorySection autoCollapse={!!results} />}
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Global Command Palette - Ctrl+K / Cmd+K */}
      <PresetCommandPalette />

      <ErrorBoundary sessionStorageKey="query-builder-session">
        {/* Header Bar with Agent Mode Toggle */}
        <HeaderBar
          onClear={handleClearAll}
          agentModeToggle={
            <AgentModeToggle
              checked={isAgentMode}
              onChange={setIsAgentMode}
            />
          }
        />

        {/* Desktop: Split Panel Layout (lg and up) */}
        <div className="hidden lg:flex flex-1 min-h-0 w-full">
          <SplitPanelLayout
            leftPanel={leftPanelContent}
            rightPanel={rightPanelContent}
          />
        </div>

        {/* Mobile: Tabbed Layout (below lg) */}
        <div className="lg:hidden flex-1 min-h-0">
          <MobileTabs
            queryTab={leftPanelContent}
            resultsTab={rightPanelContent}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
}
