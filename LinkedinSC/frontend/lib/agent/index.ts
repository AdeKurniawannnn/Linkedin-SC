/**
 * Agentic Query Builder - Main exports
 */

// Type exports
export type {
  // Status types
  AgentSessionStatus,
  QueryStatus,
  // Persona & Configuration
  SearchPersona,
  AgentSessionConfig,
  RoundHistory,
  AgentSession,
  // Scoring types
  Pass1ScoreBreakdown,
  Pass1ScoreResult,
  Pass2ScoreBreakdown,
  Pass2ScoreResult,
  // Query types
  GeneratedQuery,
  QueryContext,
  SampleResult,
  ScoreWeights,
  QueryBudget,
} from './types';

// Prompt template functions
export {
  buildQueryGenerationPrompt,
  buildPass1ScoringPrompt,
  buildPass2ScoringPrompt,
} from './prompts';

// Scoring utility functions
export {
  calculateCompositeScore,
  parsePass1Response,
  parsePass2Response,
  parseGeneratedQueries,
  selectTopQueriesForContext,
} from './scoring';

// Pipeline state machine
export type {
  PipelineStage,
  PipelineState,
} from './pipeline';

export {
  createInitialState,
  canTransition,
  transition,
  getNextStage,
  isTerminalStage,
  pipelineStageToSessionStatus,
  sessionStatusToPipelineStage,
} from './pipeline';
