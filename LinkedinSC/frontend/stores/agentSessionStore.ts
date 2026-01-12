/**
 * Zustand Store for Agentic Query Builder Runtime State
 *
 * Manages local runtime state for agent sessions with sessionStorage persistence.
 * Works in coordination with Convex for persistent backend state.
 *
 * Separation of concerns:
 * - This store: Runtime UI state, progress tracking, abort controllers
 * - Convex: Session config, generated queries, scores, results
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AgentSessionConfig, PipelineProgress, PipelineStats } from '@/lib/agent/types';

// Re-export types from centralized location
export type { AgentSessionConfig, PipelineProgress, PipelineStats } from '@/lib/agent/types';

// Pipeline stage type (local to store for UI state)
export type PipelineStage = 'idle' | 'generating' | 'pass1' | 'pass2' | 'executing';

// Progress tracking interface (uses PipelineProgress from types)
export interface ProgressState extends PipelineProgress {}

// Store state interface
interface AgentRuntimeState {
  // Session reference
  activeSessionId: string | null;

  // Runtime state
  isRunning: boolean;
  isPaused: boolean;
  currentStage: PipelineStage;

  // Progress tracking
  progress: ProgressState;

  // Pipeline statistics
  pipelineStats: PipelineStats;

  // Configuration (cached from Convex for fast UI)
  config: AgentSessionConfig | null;

  // Abort controllers for cancellation
  abortControllers: Map<string, AbortController>;

  // Error state
  error: string | null;
}

// Store actions interface
interface AgentRuntimeActions {
  setActiveSession: (sessionId: string | null) => void;
  updateConfig: (config: AgentSessionConfig) => void;
  setStage: (stage: PipelineStage) => void;
  updateProgress: (progress: Partial<ProgressState>) => void;
  updateStats: (stats: Partial<PipelineStats>) => void;
  incrementStat: (stat: keyof PipelineStats) => void;
  setRunning: (isRunning: boolean) => void;
  setPaused: (isPaused: boolean) => void;
  createAbortController: (queryId: string) => AbortController;
  cancelQuery: (queryId: string) => void;
  cancelAllQueries: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// Combined store interface
type AgentSessionStore = AgentRuntimeState & AgentRuntimeActions;

// Initial state values
const initialState: AgentRuntimeState = {
  activeSessionId: null,
  isRunning: false,
  isPaused: false,
  currentStage: 'idle',
  progress: {
    stage: 'complete' as const,
    current: 0,
    total: 0,
    message: '',
  },
  pipelineStats: {
    generated: 0,
    pass1Pending: 0,
    pass1Passed: 0,
    pass1Rejected: 0,
    pass2Pending: 0,
    pass2Passed: 0,
    pass2Rejected: 0,
    executing: 0,
    completed: 0,
  },
  config: null,
  abortControllers: new Map(),
  error: null,
};

// Create the store with sessionStorage persistence
export const useAgentSessionStore = create<AgentSessionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      ...initialState,

      // Actions
      setActiveSession: (sessionId) =>
        set({
          activeSessionId: sessionId,
          error: null,
        }),

      updateConfig: (config) =>
        set({
          config,
        }),

      setStage: (stage) =>
        set({
          currentStage: stage,
        }),

      updateProgress: (progress) =>
        set((state) => ({
          progress: { ...state.progress, ...progress },
        })),

      updateStats: (stats) =>
        set((state) => ({
          pipelineStats: { ...state.pipelineStats, ...stats },
        })),

      incrementStat: (stat) =>
        set((state) => ({
          pipelineStats: {
            ...state.pipelineStats,
            [stat]: state.pipelineStats[stat] + 1,
          },
        })),

      setRunning: (isRunning) =>
        set({
          isRunning,
          error: isRunning ? null : get().error, // Clear error when starting
        }),

      setPaused: (isPaused) =>
        set({
          isPaused,
        }),

      createAbortController: (queryId) => {
        const controller = new AbortController();
        set((state) => ({
          abortControllers: new Map(state.abortControllers).set(queryId, controller),
        }));
        return controller;
      },

      cancelQuery: (queryId) => {
        const state = get();
        const controller = state.abortControllers.get(queryId);
        if (controller) {
          controller.abort();
          const newControllers = new Map(state.abortControllers);
          newControllers.delete(queryId);
          set({ abortControllers: newControllers });
        }
      },

      cancelAllQueries: () => {
        const state = get();
        state.abortControllers.forEach((controller) => controller.abort());
        set({
          abortControllers: new Map(),
          isRunning: false,
          isPaused: false,
        });
      },

      setError: (error) =>
        set({
          error,
          isRunning: false,
        }),

      reset: () =>
        set({
          ...initialState,
          activeSessionId: get().activeSessionId, // Preserve session ID
        }),
    }),
    {
      name: 'agent-session-runtime',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist these fields (not abort controllers)
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
        currentStage: state.currentStage,
        progress: state.progress,
        pipelineStats: state.pipelineStats,
        config: state.config,
        error: state.error,
        // Don't persist: isRunning, isPaused, abortControllers
      }),
    }
  )
);

// Export types for external use
export type { AgentRuntimeState, AgentRuntimeActions, AgentSessionStore };
