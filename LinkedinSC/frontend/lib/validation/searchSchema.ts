/**
 * Search Form Validation Schema
 *
 * Zod schema for validating search form inputs.
 * Used by UnifiedSearchForm for inline validation.
 */

import { z } from "zod";
import {
  MIN_RESULTS,
  MAX_RESULTS,
  GOOGLE_MAX_QUERY_LENGTH,
} from "@/config/searchOptions";

/**
 * Schema for the search form
 */
export const searchFormSchema = z.object({
  baseQuery: z
    .string()
    .max(500, "Base query must be less than 500 characters")
    .optional(),

  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional(),

  country: z.string().min(1, "Country is required"),

  language: z.string().min(1, "Language is required"),

  maxResults: z
    .number()
    .int("Max results must be a whole number")
    .min(MIN_RESULTS, `Minimum ${MIN_RESULTS} result`)
    .max(MAX_RESULTS, `Maximum ${MAX_RESULTS} results`),
});

/**
 * Type for the search form values
 */
export type SearchFormValues = z.infer<typeof searchFormSchema>;

/**
 * Validate that either baseQuery or activePresets is provided
 * This is a custom validation that checks the composed query
 */
export function validateQueryNotEmpty(composedQuery: string): string | null {
  if (!composedQuery.trim()) {
    return "Please enter a search query or select at least one preset";
  }
  return null;
}

/**
 * Validate that the composed query doesn't exceed Google's limit
 */
export function validateQueryLength(composedQuery: string): string | null {
  if (composedQuery.length > GOOGLE_MAX_QUERY_LENGTH) {
    return `Query exceeds ${GOOGLE_MAX_QUERY_LENGTH} characters. Please reduce your query.`;
  }
  return null;
}

/**
 * Validate the entire search form before submission
 * Returns an array of error messages, or empty array if valid
 */
export function validateSearchForm(
  formValues: Partial<SearchFormValues>,
  composedQuery: string
): string[] {
  const errors: string[] = [];

  // Validate form fields
  const result = searchFormSchema.safeParse(formValues);
  if (!result.success) {
    errors.push(...result.error.issues.map((issue) => issue.message));
  }

  // Validate composed query is not empty
  const queryEmptyError = validateQueryNotEmpty(composedQuery);
  if (queryEmptyError) {
    errors.push(queryEmptyError);
  }

  // Validate query length
  const queryLengthError = validateQueryLength(composedQuery);
  if (queryLengthError) {
    errors.push(queryLengthError);
  }

  return errors;
}

/**
 * Field-level validation helpers
 */
export const fieldValidators = {
  maxResults: (value: number): string | null => {
    if (!Number.isInteger(value)) {
      return "Must be a whole number";
    }
    if (value < MIN_RESULTS) {
      return `Minimum ${MIN_RESULTS} result`;
    }
    if (value > MAX_RESULTS) {
      return `Maximum ${MAX_RESULTS} results`;
    }
    return null;
  },

  baseQuery: (value: string): string | null => {
    if (value.length > 500) {
      return "Query too long (max 500 characters)";
    }
    return null;
  },

  location: (value: string): string | null => {
    if (value.length > 100) {
      return "Location too long (max 100 characters)";
    }
    return null;
  },
};
