/**
 * Tests for useOpenRouterLLM hook
 *
 * Note: These are integration tests that require:
 * - NEXT_PUBLIC_OPENROUTER_API_KEY environment variable
 * - Active internet connection
 * - OpenRouter API credits
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOpenRouterLLM } from '../useOpenRouterLLM';
import type { UnifiedResult } from '@/lib/api';

// Mock sample results for testing
const mockResults: UnifiedResult[] = [
  {
    url: 'https://linkedin.com/in/john-doe',
    title: 'John Doe - CTO at Fintech Startup',
    description: 'Leading engineering team at Series A fintech company...',
    type: 'profile',
    rank: 1,
  },
  {
    url: 'https://linkedin.com/in/jane-smith',
    title: 'Jane Smith - VP Engineering',
    description: 'VP of Engineering at blockchain company...',
    type: 'profile',
    rank: 2,
  },
];

describe('useOpenRouterLLM', () => {
  // Skip tests if no API key configured
  const hasApiKey = !!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  describe('hook initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useOpenRouterLLM());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.tokensUsed).toBe(0);
      expect(typeof result.current.generateQueries).toBe('function');
      expect(typeof result.current.scoreQueryPass1).toBe('function');
      expect(typeof result.current.scoreResultsPass2).toBe('function');
      expect(typeof result.current.batchScorePass1).toBe('function');
      expect(typeof result.current.batchScorePass2).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
    });

    it('should accept custom options', () => {
      const { result } = renderHook(() =>
        useOpenRouterLLM({
          apiKey: 'test-key',
          model: 'anthropic/claude-3-sonnet',
        })
      );

      expect(result.current).toBeDefined();
    });
  });

  describe('generateQueries', () => {
    it(
      'should throw error if API key not configured',
      async () => {
        const { result } = renderHook(() => useOpenRouterLLM({ apiKey: '' }));

        await expect(
          result.current.generateQueries(
            'Senior Engineering Leaders',
            'site:linkedin.com/in/ CTO fintech'
          )
        ).rejects.toThrow('OpenRouter API key not configured');
      }
    );

    (hasApiKey ? it : it.skip)(
      'should generate queries successfully',
      async () => {
        const { result } = renderHook(() => useOpenRouterLLM());

        const queries = await result.current.generateQueries(
          'Senior Engineering Leaders in Fintech',
          'site:linkedin.com/in/ "CTO" fintech',
          undefined,
          3 // Small budget for testing
        );

        expect(queries).toBeInstanceOf(Array);
        expect(queries.length).toBeGreaterThan(0);
        expect(queries.length).toBeLessThanOrEqual(3);

        queries.forEach(q => {
          expect(q).toHaveProperty('query');
          expect(q).toHaveProperty('reasoning');
          expect(typeof q.query).toBe('string');
          expect(typeof q.reasoning).toBe('string');
        });
      },
      30000 // 30s timeout
    );

    (hasApiKey ? it : it.skip)(
      'should track token usage',
      async () => {
        const { result } = renderHook(() => useOpenRouterLLM());

        const initialTokens = result.current.tokensUsed;

        await result.current.generateQueries(
          'Senior Engineering Leaders',
          'site:linkedin.com/in/ CTO',
          undefined,
          2
        );

        await waitFor(() => {
          expect(result.current.tokensUsed).toBeGreaterThan(initialTokens);
        });
      },
      30000
    );
  });

  describe('scoreQueryPass1', () => {
    (hasApiKey ? it : it.skip)(
      'should score query successfully',
      async () => {
        const { result } = renderHook(() => useOpenRouterLLM());

        const score = await result.current.scoreQueryPass1(
          'site:linkedin.com/in/ "CTO" fintech blockchain',
          'Senior Engineering Leaders in Fintech',
          'Find qualified leads for B2B SaaS sales'
        );

        expect(score).toHaveProperty('score');
        expect(score).toHaveProperty('breakdown');
        expect(score).toHaveProperty('reasoning');

        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);

        expect(score.breakdown).toHaveProperty('expectedYield');
        expect(score.breakdown).toHaveProperty('personaRelevance');
        expect(score.breakdown).toHaveProperty('queryUniqueness');

        expect(typeof score.reasoning).toBe('string');
      },
      30000
    );
  });

  describe('scoreResultsPass2', () => {
    (hasApiKey ? it : it.skip)(
      'should score results successfully',
      async () => {
        const { result } = renderHook(() => useOpenRouterLLM());

        const score = await result.current.scoreResultsPass2(
          'site:linkedin.com/in/ "CTO" fintech blockchain',
          mockResults,
          'Senior Engineering Leaders in Fintech'
        );

        expect(score).toHaveProperty('score');
        expect(score).toHaveProperty('relevantCount');
        expect(score).toHaveProperty('breakdown');
        expect(score).toHaveProperty('reasoning');
        expect(score).toHaveProperty('topMatches');

        expect(score.score).toBeGreaterThanOrEqual(0);
        expect(score.score).toBeLessThanOrEqual(100);

        expect(score.breakdown).toHaveProperty('resultRelevance');
        expect(score.breakdown).toHaveProperty('qualitySignal');
        expect(score.breakdown).toHaveProperty('diversity');

        expect(Array.isArray(score.topMatches)).toBe(true);
      },
      30000
    );
  });

  describe('batchScorePass1', () => {
    (hasApiKey ? it : it.skip)(
      'should batch score queries with concurrency',
      async () => {
        const { result } = renderHook(() => useOpenRouterLLM());

        const queries = [
          'site:linkedin.com/in/ "CTO" fintech',
          'site:linkedin.com/in/ "VP Engineering" blockchain',
        ];

        const results = await result.current.batchScorePass1(
          queries,
          'Senior Engineering Leaders in Fintech',
          'Find qualified leads',
          2 // Concurrency
        );

        expect(results).toBeInstanceOf(Map);
        expect(results.size).toBe(queries.length);

        queries.forEach(query => {
          const score = results.get(query);
          expect(score).toBeDefined();
          expect(score?.score).toBeGreaterThanOrEqual(0);
          expect(score?.score).toBeLessThanOrEqual(100);
        });
      },
      60000 // 60s timeout for batch
    );
  });

  describe('batchScorePass2', () => {
    (hasApiKey ? it : it.skip)(
      'should batch score results with concurrency',
      async () => {
        const { result } = renderHook(() => useOpenRouterLLM());

        const pairs = [
          { query: 'query1', results: mockResults },
          { query: 'query2', results: mockResults },
        ];

        const results = await result.current.batchScorePass2(
          pairs,
          'Senior Engineering Leaders in Fintech',
          2
        );

        expect(results).toBeInstanceOf(Map);
        expect(results.size).toBe(pairs.length);

        pairs.forEach(pair => {
          const score = results.get(pair.query);
          expect(score).toBeDefined();
          expect(score?.score).toBeGreaterThanOrEqual(0);
          expect(score?.score).toBeLessThanOrEqual(100);
        });
      },
      60000
    );
  });

  describe('cancellation', () => {
    (hasApiKey ? it : it.skip)(
      'should cancel ongoing operation',
      async () => {
        const { result } = renderHook(() => useOpenRouterLLM());

        // Start operation
        const promise = result.current.generateQueries(
          'Senior Engineering Leaders',
          'site:linkedin.com/in/ CTO',
          undefined,
          5
        );

        // Cancel immediately
        result.current.cancel();

        // Should reject
        await expect(promise).rejects.toThrow();
      },
      10000
    );
  });

  describe('error handling', () => {
    it('should handle invalid API key gracefully', async () => {
      const { result } = renderHook(() =>
        useOpenRouterLLM({ apiKey: 'invalid-key' })
      );

      await expect(
        result.current.generateQueries(
          'Senior Engineering Leaders',
          'site:linkedin.com/in/ CTO'
        )
      ).rejects.toThrow();

      expect(result.current.error).toBeTruthy();
    });
  });
});
