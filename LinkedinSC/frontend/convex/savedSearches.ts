import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Saved search state validator
const savedSearchStateValidator = v.object({
  baseQuery: v.string(),
  activePresetIds: v.array(v.string()),
  activeLocationIds: v.array(v.string()),
  country: v.string(),
  language: v.string(),
  maxResults: v.number(),
});

// ============ QUERIES ============

/**
 * Get all saved searches
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("savedSearches").collect();
  },
});

/**
 * Get a single saved search by ID
 */
export const getById = query({
  args: { id: v.id("savedSearches") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get recently used searches
 */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    return await ctx.db
      .query("savedSearches")
      .withIndex("by_lastUsed")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get most used searches
 */
export const getMostUsed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5;
    return await ctx.db
      .query("savedSearches")
      .withIndex("by_useCount")
      .order("desc")
      .take(limit);
  },
});

/**
 * Search saved searches by name
 */
export const searchByName = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    // Full-text search on name field
    return await ctx.db
      .query("savedSearches")
      .withSearchIndex("search_name", (q) => q.search("name", args.searchTerm))
      .collect();
  },
});

// ============ MUTATIONS ============

/**
 * Add a new saved search
 */
export const add = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    state: savedSearchStateValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("savedSearches", {
      name: args.name,
      description: args.description,
      tags: args.tags,
      state: args.state,
      useCount: 0,
      createdAt: now,
      lastUsedAt: now,
    });
    return id;
  },
});

/**
 * Update a saved search
 */
export const update = mutation({
  args: {
    id: v.id("savedSearches"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    state: v.optional(savedSearchStateValidator),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.tags !== undefined) patch.tags = updates.tags;
    if (updates.state !== undefined) patch.state = updates.state;

    await ctx.db.patch(id, patch);
  },
});

/**
 * Delete a saved search
 */
export const remove = mutation({
  args: { id: v.id("savedSearches") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Record usage of a saved search (increments useCount and updates lastUsedAt)
 */
export const recordUsage = mutation({
  args: { id: v.id("savedSearches") },
  handler: async (ctx, args) => {
    const search = await ctx.db.get(args.id);
    if (!search) throw new Error("Saved search not found");

    await ctx.db.patch(args.id, {
      useCount: search.useCount + 1,
      lastUsedAt: Date.now(),
    });
  },
});
