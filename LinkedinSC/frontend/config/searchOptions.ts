/**
 * Centralized Search Options Configuration
 *
 * Single source of truth for country and language options
 * used across the query builder components.
 */

// Country option interface
export interface CountryOption {
  readonly value: string;
  readonly label: string;
  readonly flag?: string;
}

// Language option interface
export interface LanguageOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Supported countries for LinkedIn search
 * Ordered by priority (Southeast Asia first, then global)
 */
export const COUNTRY_OPTIONS = [
  { value: "id", label: "Indonesia", flag: "🇮🇩" },
  { value: "sg", label: "Singapore", flag: "🇸🇬" },
  { value: "my", label: "Malaysia", flag: "🇲🇾" },
  { value: "ph", label: "Philippines", flag: "🇵🇭" },
  { value: "th", label: "Thailand", flag: "🇹🇭" },
  { value: "vn", label: "Vietnam", flag: "🇻🇳" },
  { value: "in", label: "India", flag: "🇮🇳" },
  { value: "au", label: "Australia", flag: "🇦🇺" },
  { value: "us", label: "United States", flag: "🇺🇸" },
  { value: "uk", label: "United Kingdom", flag: "🇬🇧" },
] as const satisfies readonly CountryOption[];

/**
 * Supported languages for search results
 * Ordered by priority (Indonesian first, then regional, then global)
 */
export const LANGUAGE_OPTIONS = [
  { value: "id", label: "Indonesian" },
  { value: "en", label: "English" },
  { value: "ms", label: "Malay" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
] as const satisfies readonly LanguageOption[];

// Type-safe value types
export type CountryCode = (typeof COUNTRY_OPTIONS)[number]["value"];
export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["value"];

// Default values
export const DEFAULT_COUNTRY: CountryCode = "id";
export const DEFAULT_LANGUAGE: LanguageCode = "id";
export const DEFAULT_MAX_RESULTS = 50;

// Limits
export const MIN_RESULTS = 1;
export const MAX_RESULTS = 100;

// Quick preset options for max results
export const MAX_RESULTS_PRESETS = [10, 25, 50, 100] as const;

// API timeouts (in milliseconds)
export const API_TIMEOUT_MS = 180000; // 3 minutes

// Google search limits
export const GOOGLE_MAX_QUERY_LENGTH = 2048;
export const GOOGLE_QUERY_WARNING_THRESHOLD = 0.9; // 90%

/**
 * Helper to get country label by code
 */
export function getCountryLabel(code: string): string {
  return COUNTRY_OPTIONS.find((c) => c.value === code)?.label ?? code;
}

/**
 * Helper to get language label by code
 */
export function getLanguageLabel(code: string): string {
  return LANGUAGE_OPTIONS.find((l) => l.value === code)?.label ?? code;
}
