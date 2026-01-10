// Convex-backed hooks for persistent storage
export { useConvexSearchHistory } from "./useConvexSearchHistory";
export { useConvexSavedSearches } from "./useConvexSavedSearches";
export { useConvexCustomPresets } from "./useConvexCustomPresets";

// Query building with Convex integration
export { useBuildQueryWithPresets } from "./useBuildQueryWithPresets";

// Re-export types
export type { SearchHistoryQuery } from "./useConvexSearchHistory";
export type { SavedSearchState, SavedSearchInput } from "./useConvexSavedSearches";
export type { CustomPresetInput } from "./useConvexCustomPresets";
