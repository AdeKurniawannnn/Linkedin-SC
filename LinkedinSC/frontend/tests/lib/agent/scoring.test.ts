/**
 * Tests for lib/agent/scoring.ts
 *
 * Tests JSON parsing, composite score calculation, and query selection logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateCompositeScore,
  parsePass1Response,
  parsePass2Response,
  parseGeneratedQueries,
  selectTopQueriesForContext,
} from '@/lib/agent/scoring';
import type { GeneratedQuery } from '@/lib/agent/types';

describe('calculateCompositeScore', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should calculate weighted average with default weights (0.3, 0.7)', () => {
    const result = calculateCompositeScore(80, 90);
    // 80 * 0.3 + 90 * 0.7 = 24 + 63 = 87
    expect(result).toBe(87);
  });

  it('should calculate with custom weights', () => {
    const result = calculateCompositeScore(80, 90, { pass1: 0.5, pass2: 0.5 });
    // 80 * 0.5 + 90 * 0.5 = 40 + 45 = 85
    expect(result).toBe(85);
  });

  it('should clamp pass1Score below 0', () => {
    const result = calculateCompositeScore(-10, 50);
    // 0 * 0.3 + 50 * 0.7 = 0 + 35 = 35
    expect(result).toBe(35);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid pass1Score'));
  });

  it('should clamp pass1Score above 100', () => {
    const result = calculateCompositeScore(150, 50);
    // 100 * 0.3 + 50 * 0.7 = 30 + 35 = 65
    expect(result).toBe(65);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid pass1Score'));
  });

  it('should clamp pass2Score below 0', () => {
    const result = calculateCompositeScore(50, -20);
    // 50 * 0.3 + 0 * 0.7 = 15 + 0 = 15
    expect(result).toBe(15);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid pass2Score'));
  });

  it('should clamp pass2Score above 100', () => {
    const result = calculateCompositeScore(50, 120);
    // 50 * 0.3 + 100 * 0.7 = 15 + 70 = 85
    expect(result).toBe(85);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Invalid pass2Score'));
  });

  it('should normalize weights that do not sum to 1.0', () => {
    const result = calculateCompositeScore(80, 80, { pass1: 0.2, pass2: 0.2 });
    // Weights normalize to 0.5, 0.5 each
    // 80 * 0.5 + 80 * 0.5 = 80
    expect(result).toBe(80);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Weights sum to'));
  });

  it('should handle edge case of both scores at 0', () => {
    const result = calculateCompositeScore(0, 0);
    expect(result).toBe(0);
  });

  it('should handle edge case of both scores at 100', () => {
    const result = calculateCompositeScore(100, 100);
    expect(result).toBe(100);
  });

  it('should handle decimal scores', () => {
    const result = calculateCompositeScore(75.5, 82.3);
    // 75.5 * 0.3 + 82.3 * 0.7 = 22.65 + 57.61 = 80.26
    expect(result).toBeCloseTo(80.26, 2);
  });
});

describe('parsePass1Response', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should parse valid JSON response', () => {
    const response = JSON.stringify({
      score: 85,
      breakdown: {
        expectedYield: 35,
        personaRelevance: 30,
        queryUniqueness: 20,
      },
      reasoning: 'Good query structure with strong targeting',
    });

    const result = parsePass1Response(response);

    expect(result.score).toBe(85);
    expect(result.breakdown.expectedYield).toBe(35);
    expect(result.breakdown.personaRelevance).toBe(30);
    expect(result.breakdown.queryUniqueness).toBe(20);
    expect(result.reasoning).toBe('Good query structure with strong targeting');
  });

  it('should parse JSON wrapped in markdown code blocks', () => {
    const response = `\`\`\`json
{
  "score": 75,
  "breakdown": {
    "expectedYield": 30,
    "personaRelevance": 25,
    "queryUniqueness": 20
  },
  "reasoning": "Moderate relevance"
}
\`\`\``;

    const result = parsePass1Response(response);
    expect(result.score).toBe(75);
    expect(result.breakdown.expectedYield).toBe(30);
  });

  it('should parse JSON wrapped in markdown code blocks without json specifier', () => {
    const response = `\`\`\`
{
  "score": 70,
  "breakdown": {
    "expectedYield": 28,
    "personaRelevance": 22,
    "queryUniqueness": 20
  },
  "reasoning": "Decent query"
}
\`\`\``;

    const result = parsePass1Response(response);
    expect(result.score).toBe(70);
  });

  it('should clamp score above 100', () => {
    const response = JSON.stringify({
      score: 110,
      breakdown: {
        expectedYield: 35,
        personaRelevance: 30,
        queryUniqueness: 20,
      },
      reasoning: 'Over-scored',
    });

    const result = parsePass1Response(response);
    expect(result.score).toBe(100);
    expect(console.warn).toHaveBeenCalled();
  });

  it('should clamp score below 0', () => {
    const response = JSON.stringify({
      score: -5,
      breakdown: {
        expectedYield: 35,
        personaRelevance: 30,
        queryUniqueness: 20,
      },
      reasoning: 'Under-scored',
    });

    const result = parsePass1Response(response);
    expect(result.score).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });

  it('should warn on breakdown scores out of range', () => {
    const response = JSON.stringify({
      score: 80,
      breakdown: {
        expectedYield: 50, // Max is 40
        personaRelevance: 40, // Max is 35
        queryUniqueness: 30, // Max is 25
      },
      reasoning: 'Out of range breakdown',
    });

    const result = parsePass1Response(response);
    expect(result.score).toBe(80);
    expect(console.warn).toHaveBeenCalledWith('Pass 1 breakdown scores out of expected ranges');
  });

  it('should return default low score on invalid JSON', () => {
    const response = 'This is not valid JSON at all';

    const result = parsePass1Response(response);

    expect(result.score).toBe(20);
    expect(result.breakdown.expectedYield).toBe(8);
    expect(result.breakdown.personaRelevance).toBe(7);
    expect(result.breakdown.queryUniqueness).toBe(5);
    expect(result.reasoning).toContain('Failed to parse');
  });

  it('should return default low score on missing required fields', () => {
    const response = JSON.stringify({
      score: 80,
      // Missing breakdown and reasoning
    });

    const result = parsePass1Response(response);
    expect(result.score).toBe(20);
    expect(result.reasoning).toContain('Failed to parse');
  });

  it('should return default low score on invalid score type', () => {
    const response = JSON.stringify({
      score: 'high', // Should be number
      breakdown: {
        expectedYield: 30,
        personaRelevance: 25,
        queryUniqueness: 20,
      },
      reasoning: 'Invalid score type',
    });

    const result = parsePass1Response(response);
    expect(result.score).toBe(20);
  });
});

describe('parsePass2Response', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should parse valid JSON response', () => {
    const response = JSON.stringify({
      score: 78,
      relevantCount: 7,
      breakdown: {
        resultRelevance: 40,
        qualitySignal: 22,
        diversity: 16,
      },
      reasoning: 'Good result quality with diverse matches',
      topMatches: [1, 2, 4, 5, 7],
    });

    const result = parsePass2Response(response);

    expect(result.score).toBe(78);
    expect(result.relevantCount).toBe(7);
    expect(result.breakdown.resultRelevance).toBe(40);
    expect(result.breakdown.qualitySignal).toBe(22);
    expect(result.breakdown.diversity).toBe(16);
    expect(result.reasoning).toBe('Good result quality with diverse matches');
    expect(result.topMatches).toEqual([1, 2, 4, 5, 7]);
  });

  it('should parse JSON wrapped in markdown code blocks', () => {
    const response = `\`\`\`json
{
  "score": 65,
  "relevantCount": 5,
  "breakdown": {
    "resultRelevance": 35,
    "qualitySignal": 18,
    "diversity": 12
  },
  "reasoning": "Moderate results",
  "topMatches": [1, 3, 5]
}
\`\`\``;

    const result = parsePass2Response(response);
    expect(result.score).toBe(65);
    expect(result.relevantCount).toBe(5);
  });

  it('should clamp score above 100', () => {
    const response = JSON.stringify({
      score: 105,
      relevantCount: 10,
      breakdown: {
        resultRelevance: 45,
        qualitySignal: 28,
        diversity: 18,
      },
      reasoning: 'Over-scored',
      topMatches: [1, 2, 3],
    });

    const result = parsePass2Response(response);
    expect(result.score).toBe(100);
  });

  it('should warn on breakdown scores out of range', () => {
    const response = JSON.stringify({
      score: 80,
      relevantCount: 8,
      breakdown: {
        resultRelevance: 60, // Max is 50
        qualitySignal: 35, // Max is 30
        diversity: 25, // Max is 20
      },
      reasoning: 'Out of range breakdown',
      topMatches: [1, 2],
    });

    const result = parsePass2Response(response);
    expect(result.score).toBe(80);
    expect(console.warn).toHaveBeenCalledWith('Pass 2 breakdown scores out of expected ranges');
  });

  it('should return default low score on invalid JSON', () => {
    const response = 'Invalid JSON response';

    const result = parsePass2Response(response);

    expect(result.score).toBe(15);
    expect(result.relevantCount).toBe(0);
    expect(result.breakdown.resultRelevance).toBe(5);
    expect(result.breakdown.qualitySignal).toBe(5);
    expect(result.breakdown.diversity).toBe(5);
    expect(result.reasoning).toContain('Failed to parse');
    expect(result.topMatches).toEqual([]);
  });

  it('should return default low score on missing topMatches array', () => {
    const response = JSON.stringify({
      score: 80,
      relevantCount: 8,
      breakdown: {
        resultRelevance: 40,
        qualitySignal: 25,
        diversity: 15,
      },
      reasoning: 'Missing topMatches',
      // topMatches is missing
    });

    const result = parsePass2Response(response);
    expect(result.score).toBe(15);
    expect(result.topMatches).toEqual([]);
  });
});

describe('parseGeneratedQueries', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse valid JSON array of queries', () => {
    const response = JSON.stringify([
      {
        query: 'site:linkedin.com/in/ "CTO" fintech',
        reasoning: 'Targets CTOs in fintech',
      },
      {
        query: 'site:linkedin.com/in/ "VP Engineering" startup',
        reasoning: 'Targets VP Engineering at startups',
      },
    ]);

    const result = parseGeneratedQueries(response);

    expect(result).toHaveLength(2);
    expect(result[0].query).toBe('site:linkedin.com/in/ "CTO" fintech');
    expect(result[0].reasoning).toBe('Targets CTOs in fintech');
    expect(result[1].query).toBe('site:linkedin.com/in/ "VP Engineering" startup');
  });

  it('should parse JSON wrapped in markdown code blocks', () => {
    const response = `\`\`\`json
[
  {
    "query": "site:linkedin.com/in/ engineer",
    "reasoning": "General engineer search"
  }
]
\`\`\``;

    const result = parseGeneratedQueries(response);
    expect(result).toHaveLength(1);
    expect(result[0].query).toBe('site:linkedin.com/in/ engineer');
  });

  it('should deduplicate queries (case-insensitive)', () => {
    const response = JSON.stringify([
      {
        query: 'site:linkedin.com/in/ CTO',
        reasoning: 'First CTO query',
      },
      {
        query: 'site:linkedin.com/in/ cto', // Same query, different case
        reasoning: 'Duplicate CTO query',
      },
      {
        query: 'site:linkedin.com/in/ CEO',
        reasoning: 'CEO query',
      },
    ]);

    const result = parseGeneratedQueries(response);

    expect(result).toHaveLength(2);
    expect(result[0].query).toBe('site:linkedin.com/in/ CTO');
    expect(result[1].query).toBe('site:linkedin.com/in/ CEO');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Skipping duplicate'), expect.anything());
  });

  it('should skip entries with empty query', () => {
    const response = JSON.stringify([
      {
        query: '',
        reasoning: 'Empty query',
      },
      {
        query: 'site:linkedin.com/in/ valid',
        reasoning: 'Valid query',
      },
    ]);

    const result = parseGeneratedQueries(response);

    expect(result).toHaveLength(1);
    expect(result[0].query).toBe('site:linkedin.com/in/ valid');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Skipping invalid'), expect.anything());
  });

  it('should skip entries with empty reasoning', () => {
    const response = JSON.stringify([
      {
        query: 'site:linkedin.com/in/ test',
        reasoning: '',
      },
      {
        query: 'site:linkedin.com/in/ valid',
        reasoning: 'Has reasoning',
      },
    ]);

    const result = parseGeneratedQueries(response);

    expect(result).toHaveLength(1);
    expect(result[0].reasoning).toBe('Has reasoning');
  });

  it('should skip entries with wrong types', () => {
    const response = JSON.stringify([
      {
        query: 123, // Should be string
        reasoning: 'Numeric query',
      },
      {
        query: 'site:linkedin.com/in/ valid',
        reasoning: 456, // Should be string
      },
      {
        query: 'site:linkedin.com/in/ good',
        reasoning: 'Valid entry',
      },
    ]);

    const result = parseGeneratedQueries(response);

    expect(result).toHaveLength(1);
    expect(result[0].query).toBe('site:linkedin.com/in/ good');
  });

  it('should trim whitespace from queries and reasoning', () => {
    const response = JSON.stringify([
      {
        query: '  site:linkedin.com/in/ trimmed  ',
        reasoning: '  Needs trimming  ',
      },
    ]);

    const result = parseGeneratedQueries(response);

    expect(result).toHaveLength(1);
    expect(result[0].query).toBe('site:linkedin.com/in/ trimmed');
    expect(result[0].reasoning).toBe('Needs trimming');
  });

  it('should return empty array on invalid JSON with no recoverable queries', () => {
    const response = 'Not valid JSON';

    const result = parseGeneratedQueries(response);

    expect(result).toEqual([]);
    // Now uses fallback regex extraction with console.warn instead of error
    expect(console.warn).toHaveBeenCalled();
  });

  it('should recover queries from malformed JSON with unescaped quotes', () => {
    // This tests the actual error case from production - LLM returns JSON with
    // unescaped quotes inside string values like ("Chief Technology Officer")
    const response = `[
      {
        "query": "site:linkedin.com/in/ (\\"CTO\\" OR \\"VP Engineering\\")",
        "reasoning": "Targets technical leaders"
      }
    ]`;

    const result = parseGeneratedQueries(response);

    expect(result).toHaveLength(1);
    expect(result[0].query).toContain('CTO');
    expect(result[0].reasoning).toBe('Targets technical leaders');
  });

  it('should return empty array if response is not an array', () => {
    const response = JSON.stringify({
      query: 'site:linkedin.com/in/ test',
      reasoning: 'Not an array',
    });

    const result = parseGeneratedQueries(response);

    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle empty array', () => {
    const response = JSON.stringify([]);

    const result = parseGeneratedQueries(response);

    expect(result).toEqual([]);
  });
});

describe('selectTopQueriesForContext', () => {
  it('should select top N queries by composite score', () => {
    const queries: GeneratedQuery[] = [
      {
        query: 'query1',
        generationReasoning: 'r1',
        compositeScore: 70,
        pass1Score: 80,
        pass2Score: 65,
      },
      {
        query: 'query2',
        generationReasoning: 'r2',
        compositeScore: 90,
        pass1Score: 85,
        pass2Score: 92,
      },
      {
        query: 'query3',
        generationReasoning: 'r3',
        compositeScore: 85,
        pass1Score: 82,
        pass2Score: 86,
      },
      {
        query: 'query4',
        generationReasoning: 'r4',
        compositeScore: 60,
        pass1Score: 70,
        pass2Score: 55,
      },
    ];

    const result = selectTopQueriesForContext(queries, 2);

    expect(result).toHaveLength(2);
    expect(result[0].query).toBe('query2');
    expect(result[0].compositeScore).toBe(90);
    expect(result[1].query).toBe('query3');
    expect(result[1].compositeScore).toBe(85);
  });

  it('should filter out queries without all required scores', () => {
    const queries: GeneratedQuery[] = [
      {
        query: 'complete',
        generationReasoning: 'r1',
        compositeScore: 80,
        pass1Score: 75,
        pass2Score: 82,
      },
      {
        query: 'missing-pass2',
        generationReasoning: 'r2',
        compositeScore: 90,
        pass1Score: 88,
        // pass2Score missing
      },
      {
        query: 'missing-composite',
        generationReasoning: 'r3',
        pass1Score: 85,
        pass2Score: 80,
        // compositeScore missing
      },
    ];

    const result = selectTopQueriesForContext(queries, 5);

    expect(result).toHaveLength(1);
    expect(result[0].query).toBe('complete');
  });

  it('should return fewer than limit if not enough queries available', () => {
    const queries: GeneratedQuery[] = [
      {
        query: 'only-one',
        generationReasoning: 'r1',
        compositeScore: 85,
        pass1Score: 80,
        pass2Score: 88,
      },
    ];

    const result = selectTopQueriesForContext(queries, 5);

    expect(result).toHaveLength(1);
  });

  it('should return empty array if no queries have all scores', () => {
    const queries: GeneratedQuery[] = [
      {
        query: 'incomplete1',
        generationReasoning: 'r1',
        pass1Score: 80,
      },
      {
        query: 'incomplete2',
        generationReasoning: 'r2',
        pass2Score: 75,
      },
    ];

    const result = selectTopQueriesForContext(queries, 5);

    expect(result).toEqual([]);
  });

  it('should return QueryContext objects with correct shape', () => {
    const queries: GeneratedQuery[] = [
      {
        query: 'test-query',
        generationReasoning: 'test reasoning',
        compositeScore: 88,
        pass1Score: 85,
        pass2Score: 90,
        pass1Reasoning: 'extra field should be ignored',
      },
    ];

    const result = selectTopQueriesForContext(queries, 1);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      query: 'test-query',
      compositeScore: 88,
      pass1Score: 85,
      pass2Score: 90,
    });
    // Should not include generationReasoning or pass1Reasoning
    expect(result[0]).not.toHaveProperty('generationReasoning');
    expect(result[0]).not.toHaveProperty('pass1Reasoning');
  });

  it('should handle limit of 0', () => {
    const queries: GeneratedQuery[] = [
      {
        query: 'query1',
        generationReasoning: 'r1',
        compositeScore: 80,
        pass1Score: 75,
        pass2Score: 82,
      },
    ];

    const result = selectTopQueriesForContext(queries, 0);

    expect(result).toEqual([]);
  });

  it('should not mutate original array', () => {
    const queries: GeneratedQuery[] = [
      {
        query: 'query1',
        generationReasoning: 'r1',
        compositeScore: 70,
        pass1Score: 65,
        pass2Score: 72,
      },
      {
        query: 'query2',
        generationReasoning: 'r2',
        compositeScore: 90,
        pass1Score: 88,
        pass2Score: 91,
      },
    ];

    const originalFirst = queries[0].query;
    selectTopQueriesForContext(queries, 2);

    expect(queries[0].query).toBe(originalFirst);
  });
});
