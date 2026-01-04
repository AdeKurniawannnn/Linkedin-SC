import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper for optional fields that may be null from API
const optionalString = v.optional(v.union(v.string(), v.null()));
const optionalNumber = v.optional(v.union(v.number(), v.null()));

// Unified result validator (reused from schema)
const unifiedResultValidator = v.object({
  url: v.string(),
  title: v.string(),
  description: v.string(),
  type: v.union(
    v.literal("profile"),
    v.literal("company"),
    v.literal("post"),
    v.literal("job"),
    v.literal("other")
  ),
  rank: v.number(),
  author_name: optionalString,
  company_name: optionalString,
  followers: optionalNumber,
  location: optionalString,
});

// Query status validators
const queryStatusValidator = v.union(
  v.literal("pending"),
  v.literal("passed"),
  v.literal("failed")
);

const execStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("error")
);

// ============ QUERIES ============

/**
 * Get all queries for a session
 */
export const getBySession = query({
  args: {
    sessionId: v.id("agentSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("generatedQueries")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get queries for a specific session and round
 */
export const getBySessionAndRound = query({
  args: {
    sessionId: v.id("agentSessions"),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const allQueries = await ctx.db
      .query("generatedQueries")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return allQueries.filter((q) => q.round === args.round);
  },
});

/**
 * Get top queries by composite score
 */
export const getTopByCompositeScore = query({
  args: {
    sessionId: v.id("agentSessions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const queries = await ctx.db
      .query("generatedQueries")
      .withIndex("by_composite_score", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(limit);

    // Filter out queries without composite scores and sort manually
    // (since Convex doesn't support sorting by optional fields directly)
    return queries
      .filter((q) => q.compositeScore !== undefined)
      .sort((a, b) => (b.compositeScore ?? 0) - (a.compositeScore ?? 0))
      .slice(0, limit);
  },
});

/**
 * Get queries by pass1 status
 */
export const getByStatus = query({
  args: {
    sessionId: v.id("agentSessions"),
    pass1Status: queryStatusValidator,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    return await ctx.db
      .query("generatedQueries")
      .withIndex("by_session_status", (q) =>
        q.eq("sessionId", args.sessionId).eq("pass1Status", args.pass1Status)
      )
      .take(limit);
  },
});

// ============ MUTATIONS ============

/**
 * Add a batch of generated queries
 */
export const addBatch = mutation({
  args: {
    sessionId: v.id("agentSessions"),
    round: v.number(),
    queries: v.array(
      v.object({
        query: v.string(),
        generationReasoning: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ids = await Promise.all(
      args.queries.map((q) =>
        ctx.db.insert("generatedQueries", {
          sessionId: args.sessionId,
          round: args.round,
          query: q.query,
          generationReasoning: q.generationReasoning,
          pass1Status: "pending",
          createdAt: now,
          updatedAt: now,
        })
      )
    );

    return { inserted: ids.length, ids };
  },
});

/**
 * Update Pass 1 scoring results
 */
export const updatePass1 = mutation({
  args: {
    id: v.id("generatedQueries"),
    pass1Score: v.number(),
    pass1Status: queryStatusValidator,
    pass1Reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      pass1Score: args.pass1Score,
      pass1Status: args.pass1Status,
      pass1Reasoning: args.pass1Reasoning,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update Pass 2 scoring results
 */
export const updatePass2 = mutation({
  args: {
    id: v.id("generatedQueries"),
    pass2Score: v.number(),
    pass2Status: queryStatusValidator,
    pass2Reasoning: v.optional(v.string()),
    pass2SampleResults: v.optional(v.array(unifiedResultValidator)),
    compositeScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      pass2Score: args.pass2Score,
      pass2Status: args.pass2Status,
      pass2Reasoning: args.pass2Reasoning,
      pass2SampleResults: args.pass2SampleResults,
      compositeScore: args.compositeScore,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update query execution results
 */
export const updateExecution = mutation({
  args: {
    id: v.id("generatedQueries"),
    execStatus: execStatusValidator,
    fullResults: v.optional(v.array(unifiedResultValidator)),
    resultsCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      execStatus: args.execStatus,
      fullResults: args.fullResults,
      resultsCount: args.resultsCount,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete queries for a specific session
 */
export const deleteBatch = mutation({
  args: {
    sessionId: v.id("agentSessions"),
    round: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let queries;
    if (args.round !== undefined) {
      // Delete queries for specific round
      const allQueries = await ctx.db
        .query("generatedQueries")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect();
      queries = allQueries.filter((q) => q.round === args.round);
    } else {
      // Delete all queries for session
      queries = await ctx.db
        .query("generatedQueries")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect();
    }

    await Promise.all(queries.map((q) => ctx.db.delete(q._id)));

    return { deleted: queries.length };
  },
});
