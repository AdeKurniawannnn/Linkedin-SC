/**
 * Type definitions for Agentic Query Builder
 *
 * Complete type system for the multi-pass agentic query generation pipeline.
 * Handles session management, query lifecycle, scoring, and execution tracking.
 */

import type { Id } from "@/convex/_generated/dataModel";

// ============ Status Enums ============

/**
 * Agent session lifecycle states
 */
export type AgentSessionStatus =
  | "idle"                  // Session created, not started
  | "generating"            // LLM generating new queries
  | "pass1_scoring"         // Pass 1: Scoring queries for potential
  | "pass2_validating"      // Pass 2: Validating with actual results
  | "executing"             // Executing validated queries
  | "paused"                // Session paused by user
  | "completed"             // Round completed successfully
  | "error";                // Error occurred

/**
 * Individual query status through pipeline stages
 */
export type QueryStatus =
  | "GENERATED"             // Query generated, awaiting Pass 1
  | "PASS1_PENDING"         // Queued for Pass 1 scoring
  | "PASS1_SCORED"          // Pass 1 complete, awaiting decision
  | "PASS1_REJECTED"        // Failed Pass 1 threshold
  | "PASS2_PENDING"         // Passed Pass 1, queued for Pass 2
  | "PASS2_VALIDATED"       // Pass 2 complete, ready to execute
  | "PASS2_REJECTED"        // Failed Pass 2 threshold
  | "EXECUTING"             // Currently fetching full results
  | "DONE"                  // Execution complete
  | "ERROR";                // Error during processing

// ============ Persona & Configuration ============

/**
 * Persona definition for LinkedIn search targeting
 */
export interface SearchPersona {
  /** Job titles to target */
  jobTitles: string[];
  /** Seniority levels */
  seniorityLevels: string[];
  /** Industries to focus on */
  industries: string[];
  /** Company characteristics */
  companyTypes?: string[];
  /** Geographic locations */
  locations?: string[];
  /** Additional keywords */
  keywords?: string[];
}

/**
 * Session configuration for a single agent run
 */
export interface AgentSessionConfig {
  /** Target persona/audience description for LLM context */
  persona: string;

  /** Initial query or topic to expand upon */
  seedQuery: string;

  /** Master prompt for LLM scoring criteria */
  scoringMasterPrompt: string;

  /** Minimum Pass 1 score to proceed (0-100) */
  pass1Threshold: number;

  /** Minimum Pass 2 score to proceed (0-100) */
  pass2Threshold: number;

  /** How many queries to generate per round */
  queryBudgetPerRound: number;

  /** Max parallel operations (scoring, validation, execution) */
  concurrencyLimit: number;

  /** Max results per query execution */
  maxResultsPerQuery: number;
}

/**
 * Round completion summary
 */
export interface RoundHistory {
  /** Round number (1-indexed) */
  round: number;

  /** Total queries generated this round */
  queriesGenerated: number;

  /** Queries that passed Pass 1 */
  pass1Passed: number;

  /** Queries rejected in Pass 1 */
  pass1Rejected: number;

  /** Queries that passed Pass 2 */
  pass2Passed: number;

  /** Queries rejected in Pass 2 */
  pass2Rejected: number;

  /** Total results fetched this round */
  totalResults: number;

  /** Unique results (deduplicated) */
  uniqueResults: number;

  /** Average Pass 1 score */
  avgP1Score: number;

  /** Average Pass 2 score */
  avgP2Score: number;

  /** Timestamp when round completed */
  completedAt: number;
}

/**
 * Full agent session entity
 */
export interface AgentSession {
  _id: Id<"agentSessions">;
  _creationTime: number;
  userId?: string;

  /** Session configuration */
  config: AgentSessionConfig;

  /** Current round number (0 = not started) */
  currentRound: number;

  /** History of completed rounds */
  roundHistory: RoundHistory[];

  /** Current session status */
  status: AgentSessionStatus;

  /** Session creation timestamp */
  createdAt: number;

  /** Last updated timestamp */
  updatedAt: number;

  /** Optional completion timestamp */
  completedAt?: number;

  /** Optional error message */
  error?: string;
}

// ============ Scoring Types ============

/**
 * Pass 1 scoring breakdown (before query execution)
 */
export interface Pass1ScoreBreakdown {
  /** Expected yield quality (0-100) */
  expectedYield: number;
  /** Relevance to persona (0-100) */
  personaRelevance: number;
  /** Query uniqueness and creativity (0-100) */
  queryUniqueness: number;
}

/**
 * Pass 1 scoring result (pre-execution evaluation)
 */
export interface Pass1ScoreResult {
  /** Total score (0-100) */
  score: number;
  /** Detailed breakdown */
  breakdown: Pass1ScoreBreakdown;
  /** LLM reasoning */
  reasoning: string;
}

/**
 * Pass 2 scoring breakdown (after query execution)
 */
export interface Pass2ScoreBreakdown {
  /** Result relevance to persona (0-100) */
  resultRelevance: number;
  /** Quality signals in results (0-100) */
  qualitySignal: number;
  /** Diversity of results (0-100) */
  diversity: number;
}

/**
 * Pass 2 scoring result (post-execution evaluation)
 */
export interface Pass2ScoreResult {
  /** Total score (0-100) */
  score: number;
  /** Number of relevant results */
  relevantCount: number;
  /** Detailed breakdown */
  breakdown: Pass2ScoreBreakdown;
  /** LLM reasoning */
  reasoning: string;
  /** Top N matching results for validation */
  topMatches: Array<{
    url: string;
    title: string;
    description: string;
    relevanceReason: string;
  }>;
}

// ============ Query Types ============

/**
 * Generated query with full pipeline metadata
 */
export interface GeneratedQuery {
  _id: Id<"generatedQueries">;
  _creationTime: number;

  /** Parent session ID */
  sessionId: Id<"agentSessions">;

  /** Round number when generated */
  round: number;

  /** The actual search query string */
  query: string;

  /** LLM reasoning for generating this query */
  generationReasoning: string;

  // === Pass 1 Data ===

  /** Pass 1 score (0-100) */
  pass1Score?: number;

  /** Pass 1 pipeline status */
  pass1Status: QueryStatus;

  /** Pass 1 reasoning */
  pass1Reasoning?: string;

  // === Pass 2 Data ===

  /** Pass 2 score (0-100) */
  pass2Score?: number;

  /** Pass 2 pipeline status */
  pass2Status?: QueryStatus;

  /** Pass 2 reasoning */
  pass2Reasoning?: string;

  /** Sample results from Pass 2 validation */
  pass2SampleResults?: Array<{
    url: string;
    title: string;
    description: string;
  }>;

  // === Execution Data ===

  /** Composite score for ranking (weighted Pass 1 + Pass 2) */
  compositeScore?: number;

  /** Execution status */
  execStatus?: "pending" | "executing" | "completed" | "error";

  /** Full results after execution */
  fullResults?: Array<{
    url: string;
    title: string;
    description: string;
    type: "profile" | "company" | "post" | "job" | "other";
    rank: number;
  }>;

  /** Number of results returned */
  resultsCount?: number;

  // === Timestamps ===

  /** Query generated timestamp */
  generatedAt: number;

  /** Pass 1 scored timestamp */
  pass1ScoredAt?: number;

  /** Pass 2 validated timestamp */
  pass2ValidatedAt?: number;

  /** Execution completed timestamp */
  executedAt?: number;
}

/**
 * Lightweight query context for LLM prompts
 * (to avoid sending massive payloads)
 */
export interface QueryContext {
  /** Query string */
  query: string;
  /** Composite score */
  compositeScore?: number;
  /** Pass 1 score */
  pass1Score?: number;
  /** Pass 2 score */
  pass2Score?: number;
}

/**
 * Sample SERP result for Pass 2 scoring
 */
export interface SampleResult {
  /** Result title */
  title: string;
  /** Result description/snippet */
  description: string;
  /** Result type */
  type: 'profile' | 'company' | 'post' | 'job' | 'other';
}

// ============ Progress Types ============

/**
 * Real-time pipeline progress indicator
 */
export interface PipelineProgress {
  /** Current stage */
  stage: "generating" | "pass1" | "pass2" | "executing" | "aggregating" | "complete";

  /** Current progress count */
  current: number;

  /** Total items in stage */
  total: number;

  /** User-facing message */
  message: string;
}

/**
 * Pipeline statistics snapshot
 */
export interface PipelineStats {
  /** Total queries generated */
  generated: number;

  /** Queries pending Pass 1 */
  pass1Pending: number;

  /** Queries passed Pass 1 */
  pass1Passed: number;

  /** Queries rejected in Pass 1 */
  pass1Rejected: number;

  /** Queries pending Pass 2 */
  pass2Pending: number;

  /** Queries passed Pass 2 */
  pass2Passed: number;

  /** Queries rejected in Pass 2 */
  pass2Rejected: number;

  /** Queries currently executing */
  executing: number;

  /** Queries completed */
  completed: number;
}

// ============ Helper Types ============

/**
 * Composite score calculation weights
 */
export interface ScoreWeights {
  /** Weight for Pass 1 score (0-1) */
  pass1: number;
  /** Weight for Pass 2 score (0-1) */
  pass2: number;
}

/**
 * Budget configuration for query generation
 */
export interface QueryBudget {
  /** Maximum number of queries to generate per iteration */
  maxQueries?: number;
  /** Target number of final queries */
  targetQueries?: number;
  /** Maximum iterations */
  maxIterations?: number;
}

/**
 * Query execution result
 */
export interface QueryExecutionResult {
  queryId: Id<"generatedQueries">;
  query: string;
  results: Array<{
    url: string;
    title: string;
    description: string;
    type: "profile" | "company" | "post" | "job" | "other";
    rank: number;
  }>;
  resultsCount: number;
  executedAt: number;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult<T> {
  success: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  total: number;
  successCount: number;
  failureCount: number;
}
