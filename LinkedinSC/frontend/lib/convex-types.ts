/**
 * Convex entity types for use in React components
 * These types match the schema defined in convex/schema.ts
 */

import type { Id } from "@/convex/_generated/dataModel";

// ============ Search History ============

export interface ConvexSearchHistoryQuery {
  baseQuery: string;
  activePresetIds: string[];
  activeLocationIds: string[];
  country: string;
  language: string;
  maxResults: number;
  composedQuery: string;
}

export interface ConvexSearchMetadata {
  country: string;
  language: string;
  pages_fetched: number;
  time_taken_seconds: number;
}

export interface ConvexUnifiedResult {
  url: string;
  title: string;
  description: string;
  type: "profile" | "company" | "post" | "job" | "other";
  rank: number;
  author_name?: string;
  company_name?: string;
  followers?: number;
  location?: string;
}

export interface ConvexSearchHistoryEntry {
  _id: Id<"searchHistory">;
  _creationTime: number;
  userId?: string;
  timestamp: number;
  query: ConvexSearchHistoryQuery;
  results: ConvexUnifiedResult[];
  metadata: ConvexSearchMetadata;
  totalResults: number;
  sizeBytes: number;
  compressed?: boolean;
}

// ============ Saved Searches ============

export interface ConvexSavedSearchState {
  baseQuery: string;
  activePresetIds: string[];
  activeLocationIds: string[];
  country: string;
  language: string;
  maxResults: number;
}

export interface ConvexSavedSearch {
  _id: Id<"savedSearches">;
  _creationTime: number;
  userId?: string;
  name: string;
  description: string;
  tags: string[];
  state: ConvexSavedSearchState;
  useCount: number;
  createdAt: number;
  lastUsedAt: number;
}

// ============ Custom Presets ============

export interface ConvexCustomPreset {
  _id: Id<"customPresets">;
  _creationTime: number;
  userId?: string;
  category: string;
  label: string;
  description: string;
  queryFragment: string;
  createdAt: number;
  updatedAt: number;
}
