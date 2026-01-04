"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAgentSessionStore } from "@/stores/agentSessionStore";
import { toast } from "sonner";
import type { UnifiedResult } from "@/lib/api";

// Import centralized config type
import type { AgentSessionConfig } from "@/lib/agent/types";

// Re-export for consumers
export type { AgentSessionConfig } from "@/lib/agent/types";

/**
 * Query status type from Convex schema
 * Note: These match Convex schema, different from lib/agent/types.ts QueryStatus
 */
export type QueryStatus = "pending" | "passed" | "failed";

/**
 * Execution status type from Convex schema
 */
export type ExecStatus = "pending" | "running" | "completed" | "error";

/**
 * Agent session status from Convex schema
 * Note: These match Convex schema validators, different from lib/agent/types.ts
 */
export type AgentSessionStatus =
  | "idle"
  | "generating_queries"
  | "scoring_pass1"
  | "scoring_pass2"
  | "executing_queries"
  | "completed"
  | "error";

/**
 * Round statistics for completing a round
 */
export interface RoundStats {
  queriesGenerated: number;
  queriesPassedPass1: number;
  queriesPassedPass2: number;
  avgCompositeScore?: number;
}

/**
 * Hook for Convex-backed agent sessions
 * Provides real-time sync and persistent storage for agentic query builder
 */
export function useAgentSession() {
  const activeSessionId = useAgentSessionStore((s) => s.activeSessionId);

  // Queries
  const session = useQuery(
    api.agentSessions.get,
    activeSessionId ? { id: activeSessionId as Id<"agentSessions"> } : "skip"
  );
  const queries = useQuery(
    api.generatedQueries.getBySession,
    activeSessionId ? { sessionId: activeSessionId as Id<"agentSessions"> } : "skip"
  );
  const allSessions = useQuery(api.agentSessions.list, { limit: 50 });
  const activeSessions = useQuery(api.agentSessions.getActive, {});

  // Mutations
  const createMutation = useMutation(api.agentSessions.create);
  const updateMutation = useMutation(api.agentSessions.update);
  const updateStatusMutation = useMutation(api.agentSessions.updateStatus);
  const completeRoundMutation = useMutation(api.agentSessions.completeRound);
  const removeMutation = useMutation(api.agentSessions.remove);

  // Query mutations
  const addBatchMutation = useMutation(api.generatedQueries.addBatch);
  const updatePass1Mutation = useMutation(api.generatedQueries.updatePass1);
  const updatePass2Mutation = useMutation(api.generatedQueries.updatePass2);
  const updateExecutionMutation = useMutation(api.generatedQueries.updateExecution);
  const deleteBatchMutation = useMutation(api.generatedQueries.deleteBatch);

  // Create new session
  const create = async (config: AgentSessionConfig) => {
    try {
      const id = await createMutation(config);
      useAgentSessionStore.setState({ activeSessionId: id });
      toast.success("Agent session created");
      return id;
    } catch (error) {
      console.error("Failed to create agent session:", error);
      toast.error("Failed to create session");
      throw error;
    }
  };

  // Update session configuration
  const update = async (
    id: Id<"agentSessions">,
    updates: Partial<AgentSessionConfig>
  ) => {
    try {
      await updateMutation({ id, ...updates });
      toast.success("Session updated");
    } catch (error) {
      console.error("Failed to update session:", error);
      toast.error("Failed to update session");
      throw error;
    }
  };

  // Update session status
  const updateStatus = async (
    id: Id<"agentSessions">,
    status: AgentSessionStatus,
    lastError?: string
  ) => {
    try {
      await updateStatusMutation({ id, status, lastError });
    } catch (error) {
      console.error("Failed to update session status:", error);
      toast.error("Failed to update status");
      throw error;
    }
  };

  // Complete a round
  const completeRound = async (
    id: Id<"agentSessions">,
    roundStats: RoundStats
  ) => {
    try {
      const result = await completeRoundMutation({ id, roundStats });
      toast.success(`Round ${result.newRound - 1} completed`);
      return result;
    } catch (error) {
      console.error("Failed to complete round:", error);
      toast.error("Failed to complete round");
      throw error;
    }
  };

  // Delete session
  const deleteSession = async (id: Id<"agentSessions">) => {
    try {
      const result = await removeMutation({ id });
      toast.success(`Deleted session and ${result.deletedQueries} queries`);
      if (activeSessionId === id) {
        useAgentSessionStore.setState({ activeSessionId: null });
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      toast.error("Failed to delete session");
      throw error;
    }
  };

  // Add batch of generated queries
  const addQueryBatch = async (
    sessionId: Id<"agentSessions">,
    round: number,
    queries: Array<{ query: string; generationReasoning?: string }>
  ) => {
    try {
      const result = await addBatchMutation({ sessionId, round, queries });
      return result;
    } catch (error) {
      console.error("Failed to add query batch:", error);
      toast.error("Failed to save generated queries");
      throw error;
    }
  };

  // Update Pass 1 scoring
  const updatePass1 = async (
    id: Id<"generatedQueries">,
    pass1Score: number,
    pass1Status: QueryStatus,
    pass1Reasoning?: string
  ) => {
    try {
      await updatePass1Mutation({ id, pass1Score, pass1Status, pass1Reasoning });
    } catch (error) {
      console.error("Failed to update Pass 1 score:", error);
      toast.error("Failed to update Pass 1 score");
      throw error;
    }
  };

  // Update Pass 2 scoring
  const updatePass2 = async (
    id: Id<"generatedQueries">,
    pass2Score: number,
    pass2Status: QueryStatus,
    compositeScore: number,
    pass2Reasoning?: string,
    pass2SampleResults?: UnifiedResult[]
  ) => {
    try {
      await updatePass2Mutation({
        id,
        pass2Score,
        pass2Status,
        pass2Reasoning,
        pass2SampleResults,
        compositeScore,
      });
    } catch (error) {
      console.error("Failed to update Pass 2 score:", error);
      toast.error("Failed to update Pass 2 score");
      throw error;
    }
  };

  // Update query execution results
  const updateExecution = async (
    id: Id<"generatedQueries">,
    execStatus: ExecStatus,
    fullResults?: UnifiedResult[],
    resultsCount?: number
  ) => {
    try {
      await updateExecutionMutation({ id, execStatus, fullResults, resultsCount });
    } catch (error) {
      console.error("Failed to update execution status:", error);
      toast.error("Failed to update execution status");
      throw error;
    }
  };

  // Delete queries for a session/round
  const deleteQueries = async (
    sessionId: Id<"agentSessions">,
    round?: number
  ) => {
    try {
      const result = await deleteBatchMutation({ sessionId, round });
      toast.success(`Deleted ${result.deleted} queries`);
      return result;
    } catch (error) {
      console.error("Failed to delete queries:", error);
      toast.error("Failed to delete queries");
      throw error;
    }
  };

  // Helper: Get top queries by composite score (for context building)
  const getTopQueriesForContext = (limit = 10) => {
    if (!queries) return [];
    return queries
      .filter((q: { compositeScore?: number; pass2Status?: string }) => q.compositeScore !== undefined && q.pass2Status === "passed")
      .sort((a: { compositeScore?: number }, b: { compositeScore?: number }) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
      .slice(0, limit);
  };

  // Helper: Get queries by status
  const getQueriesByStatus = (status: QueryStatus) => {
    if (!queries) return [];
    return queries.filter((q: { pass1Status: string }) => q.pass1Status === status);
  };

  // Helper: Get queries by pass2 status
  const getQueriesByPass2Status = (status: QueryStatus) => {
    if (!queries) return [];
    return queries.filter((q: { pass2Status?: string }) => q.pass2Status === status);
  };

  // Helper: Get queries for current round
  const getCurrentRoundQueries = () => {
    if (!queries || !session) return [];
    return queries.filter((q: { round: number }) => q.round === session.currentRound);
  };

  // Helper: Get session statistics
  const getSessionStats = () => {
    if (!queries) {
      return {
        total: 0,
        pass1Pending: 0,
        pass1Passed: 0,
        pass1Failed: 0,
        pass2Pending: 0,
        pass2Passed: 0,
        pass2Failed: 0,
        avgCompositeScore: 0,
      };
    }

    const stats = {
      total: queries.length,
      pass1Pending: queries.filter((q) => q.pass1Status === "pending").length,
      pass1Passed: queries.filter((q) => q.pass1Status === "passed").length,
      pass1Failed: queries.filter((q) => q.pass1Status === "failed").length,
      pass2Pending: queries.filter((q) => q.pass2Status === "pending").length,
      pass2Passed: queries.filter((q) => q.pass2Status === "passed").length,
      pass2Failed: queries.filter((q) => q.pass2Status === "failed").length,
      avgCompositeScore: 0,
    };

    const scoredQueries = queries.filter((q) => q.compositeScore !== undefined);
    if (scoredQueries.length > 0) {
      stats.avgCompositeScore =
        scoredQueries.reduce((sum, q) => sum + (q.compositeScore ?? 0), 0) /
        scoredQueries.length;
    }

    return stats;
  };

  // Set active session
  const setActiveSession = (sessionId: string | null) => {
    useAgentSessionStore.setState({ activeSessionId: sessionId });
  };

  return {
    // State
    session,
    queries: queries ?? [],
    allSessions: allSessions ?? [],
    activeSessions: activeSessions ?? [],
    isLoading: session === undefined || queries === undefined,
    activeSessionId,

    // Session actions
    create,
    update,
    updateStatus,
    completeRound,
    deleteSession,
    setActiveSession,

    // Query actions
    addQueryBatch,
    updatePass1,
    updatePass2,
    updateExecution,
    deleteQueries,

    // Helpers
    getTopQueriesForContext,
    getQueriesByStatus,
    getQueriesByPass2Status,
    getCurrentRoundQueries,
    getSessionStats,
  };
}
