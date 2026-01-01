import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============ QUERIES ============

/**
 * Get all custom presets
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("customPresets").collect();
  },
});

/**
 * Get a single custom preset by ID
 */
export const getById = query({
  args: { id: v.id("customPresets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get presets by category
 */
export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customPresets")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// ============ MUTATIONS ============

/**
 * Add a new custom preset
 */
export const add = mutation({
  args: {
    category: v.string(),
    label: v.string(),
    description: v.string(),
    queryFragment: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("customPresets", {
      category: args.category,
      label: args.label,
      description: args.description,
      queryFragment: args.queryFragment,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

/**
 * Update a custom preset
 */
export const update = mutation({
  args: {
    id: v.id("customPresets"),
    category: v.optional(v.string()),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    queryFragment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    // Filter out undefined values and add updatedAt
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.category !== undefined) patch.category = updates.category;
    if (updates.label !== undefined) patch.label = updates.label;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.queryFragment !== undefined) patch.queryFragment = updates.queryFragment;

    await ctx.db.patch(id, patch);
  },
});

/**
 * Delete a custom preset
 */
export const remove = mutation({
  args: { id: v.id("customPresets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
