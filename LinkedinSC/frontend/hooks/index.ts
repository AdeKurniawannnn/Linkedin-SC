// Convex-backed hooks for persistent storage
export { useConvexSearchHistory } from "./useConvexSearchHistory";
export { useConvexSavedSearches } from "./useConvexSavedSearches";
export { useConvexCustomPresets } from "./useConvexCustomPresets";

// Query building with Convex integration
export { useBuildQueryWithPresets } from "./useBuildQueryWithPresets";

// Agentic Query Builder - OpenRouter LLM integration
export { useOpenRouterLLM } from "./useOpenRouterLLM";

// Agentic Query Builder - Session management
export { useAgentSession } from "./useAgentSession";

// Agentic Query Builder - Pipeline orchestration
export { useAgentPipeline } from "./useAgentPipeline";

// Re-export types
export type { SearchHistoryQuery } from "./useConvexSearchHistory";
export type { SavedSearchState, SavedSearchInput } from "./useConvexSavedSearches";
export type { CustomPresetInput } from "./useConvexCustomPresets";
