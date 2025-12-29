/**
 * API client for LinkedScraper backend (SERP Aggregator)
 * Unified query builder interface
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minute timeout for batch operations
});

// Health Check
export const testAPI = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

// Raw Search Types (Unified Query Builder)
export interface RawSearchRequest {
  query: string;
  country: string;
  language: string;
  max_results: number;
}

export interface UnifiedResult {
  url: string;
  title: string;
  description: string;
  type: 'profile' | 'company' | 'post' | 'job' | 'other';
  rank: number;
  author_name?: string;
  company_name?: string;
  followers?: number;
  location?: string;
}

export interface RawSearchResponse {
  success: boolean;
  query: string;
  total_results: number;
  results: UnifiedResult[];
  metadata: {
    country: string;
    language: string;
    pages_fetched: number;
    time_taken_seconds: number;
  };
}

/**
 * Search LinkedIn profiles using raw query
 * @param params - Search parameters
 * @param signal - Optional AbortSignal for request cancellation
 */
export const searchRaw = async (
  params: RawSearchRequest,
  signal?: AbortSignal
): Promise<RawSearchResponse> => {
  const response = await apiClient.post<RawSearchResponse>('/search-raw', params, {
    signal,
  });
  return response.data;
};

/**
 * Check if an error is an abort/cancellation error
 */
export function isAbortError(error: unknown): boolean {
  if (axios.isCancel(error)) {
    return true;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }
  return false;
}
