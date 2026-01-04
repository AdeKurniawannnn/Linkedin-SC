import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Round history validator
const roundHistoryValidator = v.object({
  round: v.number(),
  queriesGenerated: v.number(),
  queriesPassedPass1: v.number(),
  queriesPassedPass2: v.number(),
  avgCompositeScore: v.optional(v.number()),
  timestamp: v.number(),
});

// Agent session status validator
const agentSessionStatusValidator = v.union(
  v.literal("idle"),
  v.literal("generating_queries"),
  v.literal("scoring_pass1"),
  v.literal("scoring_pass2"),
  v.literal("executing_queries"),
  v.literal("completed"),
  v.literal("error")
);

// ============ QUERIES ============

/**
 * Get a single agent session by ID
 */
export const get = query({
  args: { id: v.id("agentSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all agent sessions for a user
 */
export const getByUser = query({
  args: {
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const userId = args.userId ?? undefined;

    return await ctx.db
      .query("agentSessions")
      .withIndex("by_user", (q) =>
        userId ? q.eq("userId", userId) : q.eq("userId", undefined)
      )
      .order("desc")
      .take(limit);
  },
});

/**
 * Get active agent sessions (not completed or error)
 */
export const getActive = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allSessions = await ctx.db.query("agentSessions").collect();

    return allSessions.filter(
      (session) =>
        session.status !== "completed" &&
        session.status !== "error" &&
        (args.userId === undefined || session.userId === args.userId)
    );
  },
});

/**
 * List all agent sessions
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("agentSessions")
      .order("desc")
      .take(limit);
  },
});

// ============ MUTATIONS ============

/**
 * Create a new agent session
 */
export const create = mutation({
  args: {
    userId: v.optional(v.string()),
    persona: v.string(),
    seedQuery: v.string(),
    scoringMasterPrompt: v.string(),
    pass1Threshold: v.optional(v.number()),
    pass2Threshold: v.optional(v.number()),
    queryBudgetPerRound: v.optional(v.number()),
    concurrencyLimit: v.optional(v.number()),
    maxResultsPerQuery: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("agentSessions", {
      userId: args.userId,
      persona: args.persona,
      seedQuery: args.seedQuery,
      scoringMasterPrompt: args.scoringMasterPrompt,
      pass1Threshold: args.pass1Threshold ?? 70,
      pass2Threshold: args.pass2Threshold ?? 60,
      queryBudgetPerRound: args.queryBudgetPerRound ?? 10,
      concurrencyLimit: args.concurrencyLimit ?? 5,
      maxResultsPerQuery: args.maxResultsPerQuery ?? 100,
      currentRound: 0,
      roundHistory: [],
      status: "idle",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

/**
 * Update agent session configuration
 */
export const update = mutation({
  args: {
    id: v.id("agentSessions"),
    persona: v.optional(v.string()),
    seedQuery: v.optional(v.string()),
    scoringMasterPrompt: v.optional(v.string()),
    pass1Threshold: v.optional(v.number()),
    pass2Threshold: v.optional(v.number()),
    queryBudgetPerRound: v.optional(v.number()),
    concurrencyLimit: v.optional(v.number()),
    maxResultsPerQuery: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    if (updates.persona !== undefined) patch.persona = updates.persona;
    if (updates.seedQuery !== undefined) patch.seedQuery = updates.seedQuery;
    if (updates.scoringMasterPrompt !== undefined)
      patch.scoringMasterPrompt = updates.scoringMasterPrompt;
    if (updates.pass1Threshold !== undefined)
      patch.pass1Threshold = updates.pass1Threshold;
    if (updates.pass2Threshold !== undefined)
      patch.pass2Threshold = updates.pass2Threshold;
    if (updates.queryBudgetPerRound !== undefined)
      patch.queryBudgetPerRound = updates.queryBudgetPerRound;
    if (updates.concurrencyLimit !== undefined)
      patch.concurrencyLimit = updates.concurrencyLimit;
    if (updates.maxResultsPerQuery !== undefined)
      patch.maxResultsPerQuery = updates.maxResultsPerQuery;

    patch.updatedAt = Date.now();

    await ctx.db.patch(id, patch);
  },
});

/**
 * Update agent session status
 */
export const updateStatus = mutation({
  args: {
    id: v.id("agentSessions"),
    status: agentSessionStatusValidator,
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      lastError: args.lastError,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Complete a round and update session history
 */
export const completeRound = mutation({
  args: {
    id: v.id("agentSessions"),
    roundStats: v.object({
      queriesGenerated: v.number(),
      queriesPassedPass1: v.number(),
      queriesPassedPass2: v.number(),
      avgCompositeScore: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Agent session not found");

    const nextRound = session.currentRound + 1;
    const roundEntry = {
      round: session.currentRound,
      queriesGenerated: args.roundStats.queriesGenerated,
      queriesPassedPass1: args.roundStats.queriesPassedPass1,
      queriesPassedPass2: args.roundStats.queriesPassedPass2,
      avgCompositeScore: args.roundStats.avgCompositeScore,
      timestamp: Date.now(),
    };

    await ctx.db.patch(args.id, {
      currentRound: nextRound,
      roundHistory: [...session.roundHistory, roundEntry],
      updatedAt: Date.now(),
    });

    return { newRound: nextRound };
  },
});

/**
 * Delete an agent session (and all associated queries)
 */
export const remove = mutation({
  args: { id: v.id("agentSessions") },
  handler: async (ctx, args) => {
    // Delete all associated queries first
    const queries = await ctx.db
      .query("generatedQueries")
      .withIndex("by_session", (q) => q.eq("sessionId", args.id))
      .collect();

    await Promise.all(queries.map((query) => ctx.db.delete(query._id)));

    // Delete the session
    await ctx.db.delete(args.id);

    return { deletedQueries: queries.length };
  },
});
