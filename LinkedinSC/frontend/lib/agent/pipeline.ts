/**
 * Pipeline State Machine for Agentic Query Builder
 *
 * Manages the state transitions and flow control for the multi-pass
 * query generation, scoring, and execution pipeline.
 */

import type { AgentSessionStatus } from './types';

/**
 * Pipeline stage type (simplified from AgentSessionStatus for state machine)
 */
export type PipelineStage =
  | 'idle'
  | 'generating'
  | 'pass1'
  | 'pass2'
  | 'executing'
  | 'aggregating'
  | 'complete'
  | 'error';

/**
 * Pipeline state snapshot
 */
export interface PipelineState {
  /** Current pipeline stage */
  stage: PipelineStage;
  /** Current round number */
  round: number;
  /** Generated query IDs for this round */
  queriesGenerated: string[];
  /** Pass 1 queue (query IDs waiting for Pass 1 scoring) */
  pass1Queue: string[];
  /** Pass 1 completed (query IDs that completed Pass 1) */
  pass1Completed: string[];
  /** Pass 2 queue (query IDs waiting for Pass 2 scoring) */
  pass2Queue: string[];
  /** Pass 2 completed (query IDs that completed Pass 2) */
  pass2Completed: string[];
  /** Execution queue (query IDs waiting for full search execution) */
  executeQueue: string[];
  /** Execution completed (query IDs that completed execution) */
  executeCompleted: string[];
  /** Optional error message */
  error?: string;
}

/**
 * Valid state transitions
 */
const TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  idle: ['generating'],
  generating: ['pass1', 'error'],
  pass1: ['pass2', 'error'],
  pass2: ['executing', 'error'],
  executing: ['aggregating', 'error'],
  aggregating: ['complete', 'generating', 'error'], // Can start next round or complete
  complete: ['generating', 'idle'], // Can start next round or reset
  error: ['idle', 'generating'], // Can retry or reset
};

/**
 * Create initial pipeline state
 */
export function createInitialState(): PipelineState {
  return {
    stage: 'idle',
    round: 0,
    queriesGenerated: [],
    pass1Queue: [],
    pass1Completed: [],
    pass2Queue: [],
    pass2Completed: [],
    executeQueue: [],
    executeCompleted: [],
  };
}

/**
 * Check if a state transition is valid
 */
export function canTransition(from: PipelineStage, to: PipelineStage): boolean {
  const validTransitions = TRANSITIONS[from];
  return validTransitions.includes(to);
}

/**
 * Transition pipeline to a new stage
 *
 * @throws Error if transition is invalid
 */
export function transition(
  state: PipelineState,
  to: PipelineStage,
  error?: string
): PipelineState {
  if (!canTransition(state.stage, to)) {
    throw new Error(
      `Invalid pipeline transition: ${state.stage} -> ${to}. Valid transitions: ${TRANSITIONS[state.stage].join(', ')}`
    );
  }

  const newState: PipelineState = {
    ...state,
    stage: to,
  };

  // Clear error when leaving error state
  if (state.stage === 'error' && to !== 'error') {
    delete newState.error;
  }

  // Set error when entering error state
  if (to === 'error' && error) {
    newState.error = error;
  }

  // Reset queues when starting new round (from aggregating, complete, or idle)
  if (to === 'generating' && (state.stage === 'aggregating' || state.stage === 'complete' || state.stage === 'idle')) {
    // Only increment round if coming from a completed state (not initial start)
    if (state.stage === 'aggregating' || state.stage === 'complete') {
      newState.round = state.round + 1;
    }
    newState.queriesGenerated = [];
    newState.pass1Queue = [];
    newState.pass1Completed = [];
    newState.pass2Queue = [];
    newState.pass2Completed = [];
    newState.executeQueue = [];
    newState.executeCompleted = [];
  }

  return newState;
}

/**
 * Determine the next stage based on current state
 *
 * @returns Next stage or null if no automatic transition should occur
 */
export function getNextStage(state: PipelineState): PipelineStage | null {
  switch (state.stage) {
    case 'generating':
      // After generating queries, move to Pass 1
      if (state.queriesGenerated.length > 0) {
        return 'pass1';
      }
      return null;

    case 'pass1':
      // After Pass 1 completes, move to Pass 2
      if (state.pass1Queue.length === 0 && state.pass1Completed.length > 0) {
        return 'pass2';
      }
      return null;

    case 'pass2':
      // After Pass 2 completes, move to execution
      if (state.pass2Queue.length === 0 && state.pass2Completed.length > 0) {
        return 'executing';
      }
      return null;

    case 'executing':
      // After execution completes, move to aggregation
      if (state.executeQueue.length === 0 && state.executeCompleted.length > 0) {
        return 'aggregating';
      }
      return null;

    case 'aggregating':
      // After aggregation, move to complete
      return 'complete';

    case 'complete':
    case 'idle':
    case 'error':
      // Terminal states - no automatic transition
      return null;

    default:
      return null;
  }
}

/**
 * Check if stage is a terminal stage (requires user action to proceed)
 */
export function isTerminalStage(stage: PipelineStage): boolean {
  return stage === 'complete' || stage === 'idle' || stage === 'error';
}

/**
 * Map PipelineStage to AgentSessionStatus
 */
export function pipelineStageToSessionStatus(stage: PipelineStage): AgentSessionStatus {
  switch (stage) {
    case 'idle':
      return 'idle';
    case 'generating':
      return 'generating';
    case 'pass1':
      return 'pass1_scoring';
    case 'pass2':
      return 'pass2_validating';
    case 'executing':
    case 'aggregating':
      return 'executing';
    case 'complete':
      return 'completed';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
}

/**
 * Map AgentSessionStatus to PipelineStage
 */
export function sessionStatusToPipelineStage(status: AgentSessionStatus): PipelineStage {
  switch (status) {
    case 'idle':
      return 'idle';
    case 'generating':
      return 'generating';
    case 'pass1_scoring':
      return 'pass1';
    case 'pass2_validating':
      return 'pass2';
    case 'executing':
      return 'executing';
    case 'completed':
      return 'complete';
    case 'error':
      return 'error';
    case 'paused':
      // Treat paused as the last known stage (requires state restoration)
      return 'idle';
    default:
      return 'idle';
  }
}
