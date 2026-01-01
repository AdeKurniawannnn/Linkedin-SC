import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Unified result type validator
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
  author_name: v.optional(v.string()),
  company_name: v.optional(v.string()),
  followers: v.optional(v.number()),
  location: v.optional(v.string()),
});

// Search query parameters validator
const searchQueryValidator = v.object({
  baseQuery: v.string(),
  activePresetIds: v.array(v.string()),
  activeLocationIds: v.array(v.string()),
  country: v.string(),
  language: v.string(),
  maxResults: v.number(),
  composedQuery: v.string(),
});

// Search metadata validator
const searchMetadataValidator = v.object({
  country: v.string(),
  language: v.string(),
  pages_fetched: v.number(),
  time_taken_seconds: v.number(),
});

// Saved search state validator
const savedSearchStateValidator = v.object({
  baseQuery: v.string(),
  activePresetIds: v.array(v.string()),
  activeLocationIds: v.array(v.string()),
  country: v.string(),
  language: v.string(),
  maxResults: v.number(),
});

export default defineSchema({
  // Search History - stores every search with results
  searchHistory: defineTable({
    // Optional user ID for future auth support
    userId: v.optional(v.string()),
    // Search timestamp
    timestamp: v.number(),
    // Query parameters
    query: searchQueryValidator,
    // Search results (can be empty if compressed)
    results: v.array(unifiedResultValidator),
    // Search metadata
    metadata: searchMetadataValidator,
    // Result stats
    totalResults: v.number(),
    // Storage management
    sizeBytes: v.number(),
    compressed: v.optional(v.boolean()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId", "timestamp"]),

  // Saved Searches - user-named search configurations
  savedSearches: defineTable({
    // Optional user ID for future auth support
    userId: v.optional(v.string()),
    // Search metadata
    name: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    // Query state to restore
    state: savedSearchStateValidator,
    // Usage tracking
    useCount: v.number(),
    createdAt: v.number(),
    lastUsedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_lastUsed", ["lastUsedAt"])
    .index("by_useCount", ["useCount"])
    .searchIndex("search_name", { searchField: "name" }),

  // Custom Presets - user-created query fragments
  customPresets: defineTable({
    // Optional user ID for future auth support
    userId: v.optional(v.string()),
    // Preset data
    category: v.string(), // PresetCategory | 'custom'
    label: v.string(),
    description: v.string(),
    queryFragment: v.string(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"]),
});
