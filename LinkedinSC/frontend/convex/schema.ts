import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Helper for optional fields that may be null from API
const optionalString = v.optional(v.union(v.string(), v.null()));
const optionalNumber = v.optional(v.union(v.number(), v.null()));

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
  author_name: optionalString,
  company_name: optionalString,
  followers: optionalNumber,
  location: optionalString,
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
  max_results: v.number(),
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
    // User preference
    starred: v.optional(v.boolean()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_user", ["userId", "timestamp"])
    .index("by_starred", ["starred", "timestamp"]),

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

  // Agent Sessions - Agentic Query Builder sessions
  agentSessions: defineTable({
    // Optional user ID for future auth support
    userId: v.optional(v.string()),
    // Configuration
    persona: v.string(),
    seedQuery: v.string(),
    scoringMasterPrompt: v.string(),
    pass1Threshold: v.number(), // default 70
    pass2Threshold: v.number(), // default 60
    queryBudgetPerRound: v.number(), // default 10
    concurrencyLimit: v.number(), // default 5
    maxResultsPerQuery: v.number(), // default 100
    // State
    currentRound: v.number(),
    roundHistory: v.array(
      v.object({
        round: v.number(),
        queriesGenerated: v.number(),
        queriesPassedPass1: v.number(),
        queriesPassedPass2: v.number(),
        avgCompositeScore: v.optional(v.number()),
        timestamp: v.number(),
      })
    ),
    status: v.union(
      v.literal("idle"),
      v.literal("generating_queries"),
      v.literal("scoring_pass1"),
      v.literal("scoring_pass2"),
      v.literal("executing_queries"),
      v.literal("completed"),
      v.literal("error")
    ),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    lastError: v.optional(v.string()),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_status", ["status"]),

  // Generated Queries - individual queries from agent sessions
  generatedQueries: defineTable({
    // Session reference
    sessionId: v.id("agentSessions"),
    round: v.number(),
    // Query data
    query: v.string(),
    generationReasoning: v.optional(v.string()),
    // Pass 1 scoring
    pass1Score: v.optional(v.number()),
    pass1Status: v.union(
      v.literal("pending"),
      v.literal("passed"),
      v.literal("failed")
    ),
    pass1Reasoning: v.optional(v.string()),
    // Pass 2 scoring
    pass2Score: v.optional(v.number()),
    pass2Status: v.optional(
      v.union(v.literal("pending"), v.literal("passed"), v.literal("failed"))
    ),
    pass2Reasoning: v.optional(v.string()),
    pass2SampleResults: v.optional(v.array(unifiedResultValidator)),
    // Final score
    compositeScore: v.optional(v.number()),
    // Execution
    execStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("error")
      )
    ),
    fullResults: v.optional(v.array(unifiedResultValidator)),
    resultsCount: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId", "createdAt"])
    .index("by_session_status", ["sessionId", "pass1Status"])
    .index("by_composite_score", ["sessionId", "compositeScore"]),
});
