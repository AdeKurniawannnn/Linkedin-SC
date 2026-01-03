import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Validators matching schema
// Helper for optional fields that may be null from API
const optionalString = v.optional(v.union(v.string(), v.null()));
const optionalNumber = v.optional(v.union(v.number(), v.null()));

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

const searchQueryValidator = v.object({
  baseQuery: v.string(),
  activePresetIds: v.array(v.string()),
  activeLocationIds: v.array(v.string()),
  country: v.string(),
  language: v.string(),
  maxResults: v.number(),
  composedQuery: v.string(),
});

const searchMetadataValidator = v.object({
  country: v.string(),
  language: v.string(),
  max_results: v.number(),
  pages_fetched: v.number(),
  time_taken_seconds: v.number(),
});

// ============ QUERIES ============

/**
 * Get all search history entries, sorted by timestamp (newest first)
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("searchHistory")
      .withIndex("by_timestamp")
      .order("desc")
      .take(limit);
  },
});

/**
 * Get a single search history entry by ID
 */
export const getById = query({
  args: { id: v.id("searchHistory") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Search history by query text
 */
export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const term = args.searchTerm.toLowerCase();
    const entries = await ctx.db.query("searchHistory").collect();
    return entries.filter(
      (entry) =>
        entry.query.composedQuery.toLowerCase().includes(term) ||
        entry.query.baseQuery.toLowerCase().includes(term)
    );
  },
});

/**
 * Get storage statistics
 */
export const getStorageStats = query({
  handler: async (ctx) => {
    const entries = await ctx.db.query("searchHistory").collect();
    const totalSizeBytes = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
    const maxSizeBytes = 4 * 1024 * 1024; // 4MB
    return {
      used: totalSizeBytes,
      max: maxSizeBytes,
      percentage: Math.round((totalSizeBytes / maxSizeBytes) * 100),
      count: entries.length,
    };
  },
});

/**
 * Get starred search history entries
 */
export const listStarred = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("searchHistory")
      .withIndex("by_starred", (q) => q.eq("starred", true))
      .order("desc")
      .take(limit);
  },
});

// ============ MUTATIONS ============

/**
 * Add a new search history entry
 */
export const add = mutation({
  args: {
    query: searchQueryValidator,
    results: v.array(unifiedResultValidator),
    metadata: searchMetadataValidator,
    totalResults: v.number(),
    sizeBytes: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("searchHistory", {
      timestamp: Date.now(),
      query: args.query,
      results: args.results,
      metadata: args.metadata,
      totalResults: args.totalResults,
      sizeBytes: args.sizeBytes,
      compressed: false,
    });
    return id;
  },
});

/**
 * Delete a search history entry
 */
export const remove = mutation({
  args: { id: v.id("searchHistory") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * Clear all search history
 */
export const clearAll = mutation({
  handler: async (ctx) => {
    const entries = await ctx.db.query("searchHistory").collect();
    await Promise.all(entries.map((entry) => ctx.db.delete(entry._id)));
    return { deleted: entries.length };
  },
});

/**
 * Compress old entries (remove results to save space)
 */
export const compressOldEntries = mutation({
  args: { olderThanDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.olderThanDays ?? 7;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const entries = await ctx.db
      .query("searchHistory")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();

    const entriesToCompress = entries.filter(
      (entry) => !entry.compressed && entry.results.length > 0
    );

    await Promise.all(
      entriesToCompress.map((entry) => {
        // Calculate new size (rough estimate without results)
        const newSizeBytes = Math.max(
          100,
          entry.sizeBytes - entry.results.length * 200
        );
        return ctx.db.patch(entry._id, {
          results: [],
          compressed: true,
          sizeBytes: newSizeBytes,
        });
      })
    );

    return { compressed: entriesToCompress.length };
  },
});

/**
 * Prune oldest entries to stay under storage limit
 */
export const pruneOldest = mutation({
  args: { targetPercentage: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const targetPercentage = args.targetPercentage ?? 70;
    const maxSizeBytes = 4 * 1024 * 1024; // 4MB
    const targetSize = (maxSizeBytes * targetPercentage) / 100;

    const entries = await ctx.db
      .query("searchHistory")
      .withIndex("by_timestamp")
      .order("asc")
      .collect();

    let totalSize = entries.reduce((sum, e) => sum + e.sizeBytes, 0);
    let removedCount = 0;

    for (const entry of entries) {
      if (totalSize <= targetSize) break;
      totalSize -= entry.sizeBytes;
      await ctx.db.delete(entry._id);
      removedCount++;
    }

    return { removed: removedCount, newTotalSize: totalSize };
  },
});

/**
 * Toggle starred status of a search history entry
 */
export const toggleStar = mutation({
  args: { id: v.id("searchHistory") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) {
      throw new Error("Entry not found");
    }
    const newStarred = !entry.starred;
    await ctx.db.patch(args.id, { starred: newStarred });
    return { starred: newStarred };
  },
});

/**
 * Delete multiple search history entries
 */
export const removeMany = mutation({
  args: { ids: v.array(v.id("searchHistory")) },
  handler: async (ctx, args) => {
    await Promise.all(args.ids.map((id) => ctx.db.delete(id)));
    return { deleted: args.ids.length };
  },
});
