/**
 * OpenRouter LLM Integration Hook for Agentic Query Builder
 *
 * Handles query generation, Pass 1 scoring, and Pass 2 scoring via OpenRouter API.
 * Supports batch operations with concurrency control, retry logic, and cancellation.
 */

import { useState, useRef, useCallback, useMemo } from 'react';
import {
  buildQueryGenerationPrompt,
  buildPass1ScoringPrompt,
  buildPass2ScoringPrompt,
} from '@/lib/agent/prompts';
import {
  parseGeneratedQueries,
  parsePass1Response,
  parsePass2Response,
} from '@/lib/agent/scoring';
import type {
  Pass1ScoreResult,
  Pass2ScoreResult,
  QueryContext,
  SearchPersona,
  SampleResult,
} from '@/lib/agent/types';
import type { UnifiedResult } from '@/lib/api';

// OpenRouter API Configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3-haiku'; // Fast and cost-effective
const DEFAULT_CONCURRENCY = 3; // Conservative default
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface UseOpenRouterLLMOptions {
  apiKey?: string;
  model?: string;
}

interface UseOpenRouterLLMReturn {
  // Core functions
  generateQueries: (
    persona: string,
    seedQuery: string,
    previousQueries?: QueryContext[],
    budget?: number
  ) => Promise<Array<{ query: string; reasoning: string }>>;

  scoreQueryPass1: (
    query: string,
    persona: string,
    masterPrompt: string
  ) => Promise<Pass1ScoreResult>;

  scoreResultsPass2: (
    query: string,
    results: UnifiedResult[],
    persona: string
  ) => Promise<Pass2ScoreResult>;

  // Batch operations
  batchScorePass1: (
    queries: string[],
    persona: string,
    masterPrompt: string,
    concurrency?: number
  ) => Promise<Map<string, Pass1ScoreResult>>;

  batchScorePass2: (
    queryResultPairs: Array<{ query: string; results: UnifiedResult[] }>,
    persona: string,
    concurrency?: number
  ) => Promise<Map<string, Pass2ScoreResult>>;

  // State
  isLoading: boolean;
  error: string | null;
  tokensUsed: number;

  // Control
  cancel: () => void;
}

/**
 * OpenRouter LLM integration hook
 */
export function useOpenRouterLLM(options: UseOpenRouterLLMOptions = {}): UseOpenRouterLLMReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Get API key from options or environment
  const apiKey = options.apiKey || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const model = options.model || DEFAULT_MODEL;

  // Use refs to avoid stale closures in callbacks
  const apiKeyRef = useRef(apiKey);
  const modelRef = useRef(model);
  apiKeyRef.current = apiKey;
  modelRef.current = model;

  /**
   * Cancel all ongoing operations
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  /**
   * Call OpenRouter API with retry logic
   */
  const callOpenRouter = async (
    prompt: string,
    systemPrompt?: string,
    retries = MAX_RETRIES
  ): Promise<string> => {
    const currentApiKey = apiKeyRef.current;
    const currentModel = modelRef.current;

    if (!currentApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Create new abort controller for this request if not already active
    if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
      abortControllerRef.current = new AbortController();
    }

    const messages = systemPrompt
      ? [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ]
      : [{ role: 'user', content: prompt }];

    const requestBody = {
      model: currentModel,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://linkedin-sc.com',
            'X-Title': 'LinkedinSC Agent Pipeline',
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `OpenRouter API error (${response.status}): ${errorData.error?.message || response.statusText}`
          );
        }

        const data = await response.json();

        // Track token usage
        if (data.usage) {
          setTokensUsed(prev => prev + (data.usage.total_tokens || 0));
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error('No content in OpenRouter response');
        }

        return content;
      } catch (err) {
        // Don't retry on abort
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('Request cancelled');
        }

        lastError = err instanceof Error ? err : new Error(String(err));

        // Exponential backoff before retry
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError || new Error('Failed to call OpenRouter API');
  };

  /**
   * Generate LinkedIn search queries
   */
  const generateQueries = useCallback(async (
    persona: string,
    seedQuery: string,
    previousQueries?: QueryContext[],
    budget?: number
  ): Promise<Array<{ query: string; reasoning: string }>> => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse persona string to SearchPersona object
      // For simplicity, treat entire persona as jobTitles - adjust as needed
      const searchPersona: SearchPersona = {
        jobTitles: [persona],
        seniorityLevels: [],
        industries: [],
      };

      const prompt = buildQueryGenerationPrompt(
        searchPersona,
        seedQuery,
        previousQueries,
        budget ? { maxQueries: budget } : undefined
      );

      const response = await callOpenRouter(prompt);
      const queries = parseGeneratedQueries(response);

      if (queries.length === 0) {
        throw new Error('No valid queries generated');
      }

      return queries;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate queries';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Score a query before execution (Pass 1)
   */
  const scoreQueryPass1 = useCallback(async (
    query: string,
    persona: string,
    masterPrompt: string
  ): Promise<Pass1ScoreResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const searchPersona: SearchPersona = {
        jobTitles: [persona],
        seniorityLevels: [],
        industries: [],
      };

      const prompt = buildPass1ScoringPrompt(query, searchPersona, masterPrompt);
      const response = await callOpenRouter(prompt);
      const result = parsePass1Response(response);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to score query (Pass 1)';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Score query results after execution (Pass 2)
   */
  const scoreResultsPass2 = useCallback(async (
    query: string,
    results: UnifiedResult[],
    persona: string
  ): Promise<Pass2ScoreResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const searchPersona: SearchPersona = {
        jobTitles: [persona],
        seniorityLevels: [],
        industries: [],
      };

      // Convert UnifiedResult to SampleResult
      const sampleResults: SampleResult[] = results.map(r => ({
        title: r.title,
        description: r.description,
        type: r.type,
      }));

      const prompt = buildPass2ScoringPrompt(query, sampleResults, searchPersona);
      const response = await callOpenRouter(prompt);
      const result = parsePass2Response(response);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to score results (Pass 2)';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Batch score queries with concurrency control (Pass 1)
   */
  const batchScorePass1 = useCallback(async (
    queries: string[],
    persona: string,
    masterPrompt: string,
    concurrency = DEFAULT_CONCURRENCY
  ): Promise<Map<string, Pass1ScoreResult>> => {
    setIsLoading(true);
    setError(null);

    const results = new Map<string, Pass1ScoreResult>();
    const errors: string[] = [];

    try {
      // Process queries in batches
      for (let i = 0; i < queries.length; i += concurrency) {
        const batch = queries.slice(i, i + concurrency);

        const batchPromises = batch.map(async (query) => {
          try {
            const result = await scoreQueryPass1(query, persona, masterPrompt);
            results.set(query, result);
          } catch (err) {
            const errorMsg = `Failed to score "${query}": ${err instanceof Error ? err.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        });

        await Promise.all(batchPromises);
      }

      if (errors.length > 0) {
        setError(`Batch scoring completed with ${errors.length} errors`);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch Pass 1 scoring failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [scoreQueryPass1]);

  /**
   * Batch score results with concurrency control (Pass 2)
   */
  const batchScorePass2 = useCallback(async (
    queryResultPairs: Array<{ query: string; results: UnifiedResult[] }>,
    persona: string,
    concurrency = DEFAULT_CONCURRENCY
  ): Promise<Map<string, Pass2ScoreResult>> => {
    setIsLoading(true);
    setError(null);

    const results = new Map<string, Pass2ScoreResult>();
    const errors: string[] = [];

    try {
      // Process pairs in batches
      for (let i = 0; i < queryResultPairs.length; i += concurrency) {
        const batch = queryResultPairs.slice(i, i + concurrency);

        const batchPromises = batch.map(async (pair) => {
          try {
            const result = await scoreResultsPass2(pair.query, pair.results, persona);
            results.set(pair.query, result);
          } catch (err) {
            const errorMsg = `Failed to score results for "${pair.query}": ${err instanceof Error ? err.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        });

        await Promise.all(batchPromises);
      }

      if (errors.length > 0) {
        setError(`Batch scoring completed with ${errors.length} errors`);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch Pass 2 scoring failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [scoreResultsPass2]);

  return {
    generateQueries,
    scoreQueryPass1,
    scoreResultsPass2,
    batchScorePass1,
    batchScorePass2,
    isLoading,
    error,
    tokensUsed,
    cancel,
  };
}
