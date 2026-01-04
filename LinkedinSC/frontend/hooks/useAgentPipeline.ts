/**
 * Agent Pipeline Orchestration Hook
 *
 * Main hook for managing the agentic query builder pipeline execution.
 * Orchestrates query generation, Pass 1 scoring, Pass 2 validation, execution, and aggregation.
 * Integrates with OpenRouter LLM for AI scoring and Convex for persistence.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import type {
  PipelineProgress,
  PipelineStats,
  GeneratedQuery,
  AgentSessionConfig,
  Pass1ScoreResult,
  Pass2ScoreResult,
  QueryContext,
} from '@/lib/agent/types';
import type { AgentSessionStatus } from './useAgentSession';
import type { AggregatedResult, UnifiedResult } from '@/lib/api';
import {
  type PipelineState,
  type PipelineStage,
  createInitialState,
  transition,
} from '@/lib/agent/pipeline';
import {
  calculateCompositeScore,
  selectTopQueriesForContext,
} from '@/lib/agent/scoring';
import { searchRaw } from '@/lib/api';
import { useOpenRouterLLM } from './useOpenRouterLLM';
import { useAgentSessionStore } from '@/stores/agentSessionStore';

/**
 * Convex callbacks for persisting pipeline state
 */
export interface ConvexCallbacks {
  /** Add batch of generated queries to Convex */
  addQueryBatch: (
    sessionId: Id<"agentSessions">,
    round: number,
    queries: Array<{ query: string; generationReasoning?: string }>
  ) => Promise<{ inserted: number; ids: Id<"generatedQueries">[] }>;
  /** Update Pass 1 score in Convex */
  updatePass1: (
    id: Id<"generatedQueries">,
    pass1Score: number,
    pass1Status: "pending" | "passed" | "failed",
    pass1Reasoning?: string
  ) => Promise<void>;
  /** Update Pass 2 score in Convex */
  updatePass2: (
    id: Id<"generatedQueries">,
    pass2Score: number,
    pass2Status: "pending" | "passed" | "failed",
    compositeScore: number,
    pass2Reasoning?: string,
    pass2SampleResults?: UnifiedResult[]
  ) => Promise<void>;
  /** Update execution status in Convex */
  updateExecution: (
    id: Id<"generatedQueries">,
    execStatus: "pending" | "running" | "completed" | "error",
    fullResults?: UnifiedResult[],
    resultsCount?: number
  ) => Promise<void>;
  /** Update session status */
  updateStatus: (
    id: Id<"agentSessions">,
    status: AgentSessionStatus,
    lastError?: string
  ) => Promise<void>;
  /** Get top queries for context building */
  getTopQueriesForContext: (limit?: number) => QueryContext[];
}

/**
 * Configuration options for the pipeline hook
 */
export interface UseAgentPipelineOptions {
  /** Session ID to track execution */
  sessionId: string;
  /** Session configuration */
  config: AgentSessionConfig;
  /** Convex callbacks for persistence */
  convex?: ConvexCallbacks;
  /** Progress callback */
  onProgress?: (progress: PipelineProgress) => void;
  /** Stage completion callback */
  onStageComplete?: (stage: PipelineStage, stats: Partial<PipelineStats>) => void;
  /** Pipeline completion callback */
  onComplete?: (totalResults: number) => void;
  /** Error callback */
  onError?: (error: string) => void;
}

/**
 * Return type for the pipeline hook
 */
export interface UseAgentPipelineReturn {
  // Execution control
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  generateMore: () => Promise<void>;

  // State
  currentStage: PipelineStage;
  isRunning: boolean;
  isPaused: boolean;
  progress: PipelineProgress;
  stats: PipelineStats;

  // Results
  aggregatedResults: AggregatedResult[];
}

/**
 * Internal query tracking with IDs
 */
interface TrackedQuery {
  id: Id<"generatedQueries">;
  query: string;
  reasoning: string;
  pass1Score?: number;
  pass1Status: "pending" | "passed" | "failed";
  pass2Score?: number;
  pass2Status?: "pending" | "passed" | "failed";
  compositeScore?: number;
}

/**
 * Hook for orchestrating the agent pipeline
 */
export function useAgentPipeline(
  options: UseAgentPipelineOptions
): UseAgentPipelineReturn {
  const { sessionId, config, convex, onProgress, onStageComplete, onComplete, onError } = options;

  // OpenRouter LLM integration
  const llm = useOpenRouterLLM();

  // Zustand store for UI state
  const store = useAgentSessionStore();

  // State
  const [pipelineState, setPipelineState] = useState<PipelineState>(createInitialState());
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResult[]>([]);
  const [currentRoundQueries, setCurrentRoundQueries] = useState<TrackedQuery[]>([]);
  const [stats, setStats] = useState<PipelineStats>({
    generated: 0,
    pass1Pending: 0,
    pass1Passed: 0,
    pass1Rejected: 0,
    pass2Pending: 0,
    pass2Passed: 0,
    pass2Rejected: 0,
    executing: 0,
    completed: 0,
  });

  // Progress state for UI
  const [progressState, setProgressState] = useState<PipelineProgress>({
    stage: 'complete',
    current: 0,
    total: 0,
    message: '',
  });

  // Refs for cancellation and pause control
  const abortControllerRef = useRef<AbortController | null>(null);
  const pauseRequestedRef = useRef(false);
  const pipelineStateRef = useRef(pipelineState);
  pipelineStateRef.current = pipelineState;

  /**
   * Update progress indicator
   */
  const updateProgress = useCallback(
    (stage: PipelineProgress['stage'], current: number, total: number, message: string) => {
      const progress: PipelineProgress = { stage, current, total, message };
      setProgressState(progress);
      onProgress?.(progress);
    },
    [onProgress]
  );

  /**
   * Update statistics
   */
  const updateStats = useCallback((updates: Partial<PipelineStats>) => {
    setStats((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Transition to new stage
   */
  const transitionStage = useCallback(
    (to: PipelineStage, error?: string) => {
      setPipelineState((prev) => transition(prev, to, error));
    },
    []
  );

  /**
   * Generate queries using OpenRouter LLM
   */
  const generateQueries = useCallback(async (): Promise<TrackedQuery[]> => {
    updateProgress('generating', 0, 1, 'Generating new queries with AI...');
    store.setStage('generating');

    try {
      // Get previous top queries for context (if any)
      const previousQueries = convex?.getTopQueriesForContext(5) ?? [];

      // Call OpenRouter LLM to generate queries
      const generatedQueries = await llm.generateQueries(
        config.persona,
        config.seedQuery,
        previousQueries,
        config.queryBudgetPerRound
      );

      if (generatedQueries.length === 0) {
        throw new Error('No queries were generated');
      }

      updateProgress('generating', 0.5, 1, `Generated ${generatedQueries.length} queries, saving...`);

      // Save to Convex if callbacks provided
      let queryIds: Id<"generatedQueries">[] = [];
      if (convex) {
        const currentRound = pipelineStateRef.current.round;
        const result = await convex.addQueryBatch(
          sessionId as Id<"agentSessions">,
          currentRound + 1,
          generatedQueries.map(q => ({
            query: q.query,
            generationReasoning: q.reasoning,
          }))
        );
        queryIds = result.ids;
      } else {
        // Generate temporary IDs for local tracking
        queryIds = generatedQueries.map((_, i) => `temp-${Date.now()}-${i}` as Id<"generatedQueries">);
      }

      // Create tracked queries
      const trackedQueries: TrackedQuery[] = generatedQueries.map((q, i) => ({
        id: queryIds[i],
        query: q.query,
        reasoning: q.reasoning,
        pass1Status: "pending" as const,
      }));

      setCurrentRoundQueries(trackedQueries);
      updateStats({ generated: generatedQueries.length, pass1Pending: generatedQueries.length });
      updateProgress('generating', 1, 1, `Generated ${generatedQueries.length} queries`);

      return trackedQueries;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Query generation failed';
      onError?.(errorMsg);
      throw error;
    }
  }, [sessionId, config, convex, llm, updateProgress, updateStats, onError, store]);

  /**
   * Execute Pass 1 scoring in batches with real LLM calls
   */
  const runPass1Scoring = useCallback(
    async (queries: TrackedQuery[]): Promise<TrackedQuery[]> => {
      const total = queries.length;
      let completed = 0;

      updateProgress('pass1', 0, total, 'Scoring queries with AI (Pass 1)...');
      store.setStage('pass1');

      const { concurrencyLimit, pass1Threshold } = config;
      const batches: TrackedQuery[][] = [];

      for (let i = 0; i < queries.length; i += concurrencyLimit) {
        batches.push(queries.slice(i, i + concurrencyLimit));
      }

      let passed = 0;
      let rejected = 0;
      const updatedQueries: TrackedQuery[] = [];

      for (const batch of batches) {
        if (pauseRequestedRef.current) {
          // Add remaining queries as pending
          updatedQueries.push(...batch);
          continue;
        }

        const results = await Promise.all(
          batch.map(async (q) => {
            try {
              const result = await llm.scoreQueryPass1(
                q.query,
                config.persona,
                config.scoringMasterPrompt
              );
              return { query: q, result, error: null };
            } catch (error) {
              return { query: q, result: null, error };
            }
          })
        );

        for (const { query, result, error } of results) {
          if (error || !result) {
            // On error, mark as failed
            const updatedQuery: TrackedQuery = {
              ...query,
              pass1Score: 0,
              pass1Status: "failed",
            };
            updatedQueries.push(updatedQuery);
            rejected++;

            if (convex) {
              await convex.updatePass1(query.id, 0, "failed", "Scoring error");
            }
          } else {
            const status = result.score >= pass1Threshold ? "passed" : "failed";
            const updatedQuery: TrackedQuery = {
              ...query,
              pass1Score: result.score,
              pass1Status: status,
            };
            updatedQueries.push(updatedQuery);

            if (status === "passed") {
              passed++;
            } else {
              rejected++;
            }

            if (convex) {
              await convex.updatePass1(query.id, result.score, status, result.reasoning);
            }
          }
        }

        completed += batch.length;
        updateProgress('pass1', completed, total, `Pass 1: ${completed}/${total} scored (${passed} passed)`);
      }

      // Update local state with scored queries
      setCurrentRoundQueries(updatedQueries);
      updateStats({ pass1Passed: passed, pass1Rejected: rejected, pass1Pending: 0 });
      onStageComplete?.('pass1', { pass1Passed: passed, pass1Rejected: rejected });

      // Return only queries that passed Pass 1
      return updatedQueries.filter(q => q.pass1Status === "passed");
    },
    [config, convex, llm, updateProgress, updateStats, onStageComplete, store]
  );

  /**
   * Execute Pass 2 validation in batches with real SERP + LLM scoring
   */
  const runPass2Validation = useCallback(
    async (queries: TrackedQuery[]): Promise<TrackedQuery[]> => {
      const total = queries.length;
      let completed = 0;

      updateProgress('pass2', 0, total, 'Validating queries with sample search (Pass 2)...');
      store.setStage('pass2');

      const { concurrencyLimit, pass2Threshold } = config;
      const batches: TrackedQuery[][] = [];

      for (let i = 0; i < queries.length; i += concurrencyLimit) {
        batches.push(queries.slice(i, i + concurrencyLimit));
      }

      let passed = 0;
      let rejected = 0;
      const updatedQueries: TrackedQuery[] = [];

      for (const batch of batches) {
        if (pauseRequestedRef.current) {
          // Add remaining queries with pending status
          updatedQueries.push(...batch.map(q => ({ ...q, pass2Status: "pending" as const })));
          continue;
        }

        const results = await Promise.all(
          batch.map(async (q) => {
            try {
              // Execute sample search (10 results)
              const sampleResponse = await searchRaw({
                query: q.query,
                country: 'us',
                language: 'en',
                max_results: 10,
              });

              // Score results with LLM
              const result = await llm.scoreResultsPass2(
                q.query,
                sampleResponse.results,
                config.persona
              );

              return { query: q, result, sampleResults: sampleResponse.results, error: null };
            } catch (error) {
              return { query: q, result: null, sampleResults: null, error };
            }
          })
        );

        for (const { query, result, sampleResults, error } of results) {
          if (error || !result) {
            // On error, mark as failed
            const updatedQuery: TrackedQuery = {
              ...query,
              pass2Score: 0,
              pass2Status: "failed",
            };
            updatedQueries.push(updatedQuery);
            rejected++;

            if (convex) {
              await convex.updatePass2(query.id, 0, "failed", 0, "Validation error");
            }
          } else {
            const status = result.score >= pass2Threshold ? "passed" : "failed";
            const compositeScore = calculateCompositeScore(query.pass1Score || 0, result.score);

            const updatedQuery: TrackedQuery = {
              ...query,
              pass2Score: result.score,
              pass2Status: status,
              compositeScore,
            };
            updatedQueries.push(updatedQuery);

            if (status === "passed") {
              passed++;
            } else {
              rejected++;
            }

            if (convex && sampleResults) {
              await convex.updatePass2(
                query.id,
                result.score,
                status,
                compositeScore,
                result.reasoning,
                sampleResults.slice(0, 5) // Store top 5 sample results
              );
            }
          }
        }

        completed += batch.length;
        updateProgress('pass2', completed, total, `Pass 2: ${completed}/${total} validated (${passed} passed)`);
      }

      // Update local state
      setCurrentRoundQueries(prev =>
        prev.map(q => {
          const updated = updatedQueries.find(u => u.id === q.id);
          return updated || q;
        })
      );
      updateStats({ pass2Passed: passed, pass2Rejected: rejected, pass2Pending: 0 });
      onStageComplete?.('pass2', { pass2Passed: passed, pass2Rejected: rejected });

      // Return only queries that passed Pass 2
      return updatedQueries.filter(q => q.pass2Status === "passed");
    },
    [config, convex, llm, updateProgress, updateStats, onStageComplete, store]
  );

  /**
   * Execute full search for validated queries
   */
  const executeQueries = useCallback(
    async (queries: TrackedQuery[]): Promise<AggregatedResult[]> => {
      const total = queries.length;
      let completed = 0;

      updateProgress('executing', 0, total, 'Executing validated queries...');
      store.setStage('executing');

      const { concurrencyLimit, maxResultsPerQuery } = config;
      const batches: TrackedQuery[][] = [];

      for (let i = 0; i < queries.length; i += concurrencyLimit) {
        batches.push(queries.slice(i, i + concurrencyLimit));
      }

      const allResults: AggregatedResult[] = [];

      for (const batch of batches) {
        if (pauseRequestedRef.current) {
          break;
        }

        const results = await Promise.all(
          batch.map(async (q) => {
            try {
              // Mark as executing in Convex
              if (convex) {
                await convex.updateExecution(q.id, "running");
              }

              const response = await searchRaw({
                query: q.query,
                country: 'us',
                language: 'en',
                max_results: maxResultsPerQuery,
              });

              return {
                query: q,
                response,
                error: null,
              };
            } catch (error) {
              return { query: q, response: null, error };
            }
          })
        );

        for (const { query, response, error } of results) {
          if (error || !response) {
            // Mark as error in Convex
            if (convex) {
              await convex.updateExecution(query.id, "error");
            }
            continue;
          }

          // Convert to AggregatedResult format
          const aggregated: AggregatedResult[] = response.results.map((r) => ({
            ...r,
            sourceQueries: [query.query],
            firstSeenAt: Date.now(),
          }));

          allResults.push(...aggregated);

          // Update Convex with execution results
          if (convex) {
            await convex.updateExecution(
              query.id,
              "completed",
              response.results,
              response.results.length
            );
          }
        }

        completed += batch.length;
        updateProgress('executing', completed, total, `Executing: ${completed}/${total} (${allResults.length} results)`);
      }

      // Deduplicate and aggregate results
      const deduplicated = mergeAggregatedResults(aggregatedResults, allResults);
      setAggregatedResults(deduplicated);

      updateStats({ executing: 0, completed: queries.length });
      onStageComplete?.('executing', { completed: queries.length });

      return deduplicated;
    },
    [config, convex, aggregatedResults, updateProgress, updateStats, onStageComplete, store]
  );

  /**
   * Start pipeline execution
   */
  const start = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    store.setRunning(true);
    setPipelineState(createInitialState());
    abortControllerRef.current = new AbortController();

    try {
      // Update session status in Convex
      if (convex) {
        await convex.updateStatus(sessionId as Id<"agentSessions">, "generating_queries");
      }

      // Generate queries
      transitionStage('generating');
      const generatedQueries = await generateQueries();

      if (generatedQueries.length === 0) {
        throw new Error('No queries were generated');
      }

      // Update session status
      if (convex) {
        await convex.updateStatus(sessionId as Id<"agentSessions">, "scoring_pass1");
      }

      // Pass 1 scoring - returns only queries that passed
      transitionStage('pass1');
      const pass1Passed = await runPass1Scoring(generatedQueries);

      if (pass1Passed.length === 0) {
        updateProgress('complete', 1, 1, 'No queries passed Pass 1 threshold');
        transitionStage('complete');
        onComplete?.(0);
        return;
      }

      // Update session status
      if (convex) {
        await convex.updateStatus(sessionId as Id<"agentSessions">, "scoring_pass2");
      }

      // Pass 2 validation - returns only queries that passed
      transitionStage('pass2');
      const pass2Passed = await runPass2Validation(pass1Passed);

      if (pass2Passed.length === 0) {
        updateProgress('complete', 1, 1, 'No queries passed Pass 2 threshold');
        transitionStage('complete');
        onComplete?.(0);
        return;
      }

      // Update session status
      if (convex) {
        await convex.updateStatus(sessionId as Id<"agentSessions">, "executing_queries");
      }

      // Execute queries
      transitionStage('executing');
      const results = await executeQueries(pass2Passed);

      // Aggregation stage
      transitionStage('aggregating');
      updateProgress('aggregating', 1, 1, 'Aggregating results...');
      store.setStage('idle');

      // Update session status
      if (convex) {
        await convex.updateStatus(sessionId as Id<"agentSessions">, "completed");
      }

      // Complete
      transitionStage('complete');
      onComplete?.(results.length);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Pipeline execution failed';
      transitionStage('error', errorMsg);

      if (convex) {
        await convex.updateStatus(sessionId as Id<"agentSessions">, "error", errorMsg);
      }

      onError?.(errorMsg);
    } finally {
      setIsRunning(false);
      store.setRunning(false);
    }
  }, [
    isRunning,
    sessionId,
    convex,
    store,
    transitionStage,
    generateQueries,
    runPass1Scoring,
    runPass2Validation,
    executeQueries,
    updateProgress,
    onComplete,
    onError,
  ]);

  /**
   * Pause execution
   */
  const pause = useCallback(() => {
    pauseRequestedRef.current = true;
    setIsPaused(true);
    store.setPaused(true);
  }, [store]);

  /**
   * Resume execution from paused state
   */
  const resume = useCallback(async () => {
    pauseRequestedRef.current = false;
    setIsPaused(false);
    store.setPaused(false);

    // Get queries that still need processing based on current stage
    const stage = pipelineState.stage;

    if (stage === 'pass1') {
      // Resume Pass 1 for pending queries
      const pendingQueries = currentRoundQueries.filter(q => q.pass1Status === "pending");
      if (pendingQueries.length > 0) {
        const pass1Passed = await runPass1Scoring(pendingQueries);

        // Continue to Pass 2 if we have passed queries
        if (pass1Passed.length > 0) {
          transitionStage('pass2');
          const pass2Passed = await runPass2Validation(pass1Passed);

          if (pass2Passed.length > 0) {
            transitionStage('executing');
            await executeQueries(pass2Passed);
          }
        }
        transitionStage('complete');
      }
    } else if (stage === 'pass2') {
      // Resume Pass 2 for queries that passed Pass 1 but are pending Pass 2
      const pendingQueries = currentRoundQueries.filter(
        q => q.pass1Status === "passed" && (!q.pass2Status || q.pass2Status === "pending")
      );
      if (pendingQueries.length > 0) {
        const pass2Passed = await runPass2Validation(pendingQueries);

        if (pass2Passed.length > 0) {
          transitionStage('executing');
          await executeQueries(pass2Passed);
        }
        transitionStage('complete');
      }
    } else if (stage === 'executing') {
      // Resume execution for queries that passed Pass 2 but haven't been executed
      const pendingQueries = currentRoundQueries.filter(
        q => q.pass2Status === "passed" && q.compositeScore !== undefined
      );
      if (pendingQueries.length > 0) {
        await executeQueries(pendingQueries);
        transitionStage('complete');
      }
    }
  }, [pipelineState.stage, currentRoundQueries, store, runPass1Scoring, runPass2Validation, executeQueries, transitionStage]);

  /**
   * Stop execution
   */
  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    llm.cancel();
    setIsRunning(false);
    setIsPaused(false);
    pauseRequestedRef.current = false;
    store.setRunning(false);
    store.setPaused(false);
  }, [llm, store]);

  /**
   * Generate more queries (start next round with context from top queries)
   */
  const generateMore = useCallback(async () => {
    if (isRunning) return;

    // Increment round
    setPipelineState(prev => ({
      ...prev,
      round: prev.round + 1,
    }));

    // Start new round - the generateQueries function will use context from top queries
    await start();
  }, [isRunning, start]);

  return {
    // Execution control
    start,
    pause,
    resume,
    stop,
    generateMore,

    // State
    currentStage: pipelineState.stage,
    isRunning,
    isPaused,
    progress: progressState,
    stats,

    // Results
    aggregatedResults,
  };
}

/**
 * Deduplicate aggregated results helper
 */
function mergeAggregatedResults(
  existing: AggregatedResult[],
  incoming: AggregatedResult[]
): AggregatedResult[] {
  const resultMap = new Map<string, AggregatedResult>();

  // Add existing results
  existing.forEach((result) => {
    resultMap.set(result.url, { ...result });
  });

  // Merge incoming results
  incoming.forEach((result) => {
    const existingResult = resultMap.get(result.url);

    if (existingResult) {
      // Merge sourceQueries
      const mergedQueries = Array.from(
        new Set([...existingResult.sourceQueries, ...result.sourceQueries])
      );
      existingResult.sourceQueries = mergedQueries;
    } else {
      // New result
      resultMap.set(result.url, { ...result });
    }
  });

  return Array.from(resultMap.values());
}
