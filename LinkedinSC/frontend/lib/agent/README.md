# Agentic Query Builder

LLM prompt templates and scoring utilities for the LinkedIn SERP Agentic Query Builder.

## Overview

This module provides a complete toolkit for building an agentic query generation system with two-pass scoring:

1. **Pass 1 (Pre-execution)**: LLM evaluates query quality before execution
2. **Pass 2 (Post-execution)**: LLM evaluates actual SERP results

## Files

- **`types.ts`** - Complete type definitions for sessions, queries, scoring, and configuration
- **`prompts.ts`** - LLM prompt template functions for query generation and scoring
- **`scoring.ts`** - Utility functions for parsing LLM responses and calculating scores
- **`index.ts`** - Main exports for easy importing

## Quick Start

### 1. Generate Queries

```typescript
import { buildQueryGenerationPrompt, parseGeneratedQueries } from '@/lib/agent';

const persona = {
  jobTitles: ['Chief Technology Officer', 'VP Engineering'],
  seniorityLevels: ['C-Level', 'VP', 'Director'],
  industries: ['Fintech', 'SaaS', 'Enterprise Software'],
};

const seedQuery = 'site:linkedin.com/in/ "CTO" fintech blockchain';

// Build prompt for LLM
const prompt = buildQueryGenerationPrompt(persona, seedQuery);

// Send to LLM and parse response
const llmResponse = await callLLM(prompt); // Your LLM call
const queries = parseGeneratedQueries(llmResponse);

console.log(queries);
// [
//   { query: 'site:linkedin.com/in/ ...', reasoning: '...' },
//   { query: 'site:linkedin.com/in/ ...', reasoning: '...' },
//   ...
// ]
```

### 2. Pass 1 Scoring (Pre-execution)

```typescript
import { buildPass1ScoringPrompt, parsePass1Response } from '@/lib/agent';

const query = 'site:linkedin.com/in/ "VP Engineering" (startup OR "series A") -recruiter';

// Build scoring prompt
const scoringPrompt = buildPass1ScoringPrompt(
  query,
  persona,
  'Find senior technical leaders in early-stage fintech companies'
);

// Send to LLM and parse response
const llmResponse = await callLLM(scoringPrompt);
const scoreResult = parsePass1Response(llmResponse);

console.log(scoreResult);
// {
//   score: 82,
//   breakdown: {
//     expectedYield: 35,
//     personaRelevance: 30,
//     queryUniqueness: 17
//   },
//   reasoning: '...'
// }

// Check if query passes threshold
if (scoreResult.score >= 60) {
  console.log('Query passed Pass 1! Proceeding to execution...');
}
```

### 3. Pass 2 Scoring (Post-execution)

```typescript
import { buildPass2ScoringPrompt, parsePass2Response } from '@/lib/agent';

// After executing query and getting results
const sampleResults = topResults.slice(0, 10).map(r => ({
  title: r.title,
  description: r.description,
  type: r.type,
}));

// Build Pass 2 scoring prompt
const pass2Prompt = buildPass2ScoringPrompt(query, sampleResults, persona);

// Send to LLM and parse response
const llmResponse = await callLLM(pass2Prompt);
const pass2Result = parsePass2Response(llmResponse);

console.log(pass2Result);
// {
//   score: 76,
//   relevantCount: 7,
//   breakdown: {
//     resultRelevance: 38,
//     qualitySignal: 24,
//     diversity: 14
//   },
//   reasoning: '...',
//   topMatches: [1, 2, 4, 5, 7, 8, 10]
// }
```

### 4. Calculate Composite Score

```typescript
import { calculateCompositeScore } from '@/lib/agent';

const compositeScore = calculateCompositeScore(
  scoreResult.score,      // Pass 1: 82
  pass2Result.score,      // Pass 2: 76
  { pass1: 0.3, pass2: 0.7 } // Optional custom weights
);

console.log(compositeScore); // 77.8
```

### 5. Select Top Queries for Next Iteration

```typescript
import { selectTopQueriesForContext } from '@/lib/agent';

const allQueries = [
  {
    query: 'site:linkedin.com/in/ ...',
    pass1Score: 82,
    pass2Score: 76,
    compositeScore: 77.8,
    // ... other fields
  },
  // ... more queries
];

// Get top 5 queries for LLM context in next round
const topQueries = selectTopQueriesForContext(allQueries, 5);

// Use in next query generation prompt
const nextPrompt = buildQueryGenerationPrompt(
  persona,
  seedQuery,
  topQueries, // LLM will learn from these
  { maxQueries: 10 }
);
```

## Prompt Templates

### Query Generation Prompt

**Input:**
- `persona`: Target persona definition
- `seedQuery`: Initial example query
- `previousQueries`: (Optional) Top-performing queries from previous iterations
- `budget`: (Optional) Query generation budget configuration

**Output:**
- System prompt instructing LLM to generate N diverse LinkedIn search queries
- Includes Boolean operator techniques and specificity guidance
- Incorporates top performers from previous rounds (if provided)

### Pass 1 Scoring Prompt

**Input:**
- `query`: Query to evaluate
- `persona`: Target persona
- `masterPrompt`: Original context/instructions

**Output:**
- System prompt for evaluating query quality before execution
- Scoring criteria (100 points total):
  - Expected Yield (0-40): Boolean operators, breadth, technical quality
  - Persona Relevance (0-35): Seniority, job function, industry alignment
  - Query Uniqueness (0-25): Creativity, novelty, strategic exclusions

### Pass 2 Scoring Prompt

**Input:**
- `query`: Query that was executed
- `results`: Sample of SERP results (typically top 10)
- `persona`: Target persona

**Output:**
- System prompt for evaluating actual result quality
- Scoring criteria (100 points total):
  - Result Relevance (0-50): Profile matches, title/description alignment
  - Quality Signal (0-30): Seniority indicators, company quality
  - Diversity (0-20): Company variety, role diversity

## Scoring Utilities

### `parsePass1Response(llmResponse: string): Pass1ScoreResult`

Parses LLM response for Pass 1 scoring. Handles:
- JSON extraction from markdown code blocks
- Structure validation
- Score range validation
- Graceful error handling (returns default low score on parse failure)

### `parsePass2Response(llmResponse: string): Pass2ScoreResult`

Parses LLM response for Pass 2 scoring. Handles:
- JSON extraction from markdown code blocks
- Structure validation
- Score range validation
- Graceful error handling (returns default low score on parse failure)

### `parseGeneratedQueries(llmResponse: string): Array<{ query, reasoning }>`

Parses LLM response for query generation. Features:
- Filters invalid entries
- Deduplicates queries
- Returns empty array on error (fail-safe)

### `calculateCompositeScore(pass1Score, pass2Score, weights?): number`

Calculates weighted composite score. Features:
- Default weights: 30% Pass 1, 70% Pass 2 (prediction vs. reality)
- Custom weight support
- Input validation and clamping
- Weight normalization

### `selectTopQueriesForContext(queries, limit): QueryContext[]`

Selects top N queries for next iteration context. Features:
- Filters queries with complete scores
- Sorts by composite score descending
- Returns lightweight QueryContext (no full payloads)

## Type Definitions

### Core Types

- **`SearchPersona`** - Target persona definition (job titles, seniority, industries, etc.)
- **`AgentSessionConfig`** - Session configuration (thresholds, budgets, concurrency)
- **`AgentSession`** - Full session entity with round history
- **`GeneratedQuery`** - Complete query with Pass 1, Pass 2, and execution metadata
- **`QueryContext`** - Lightweight query summary for LLM prompts

### Status Types

- **`AgentSessionStatus`** - Session lifecycle states (idle → generating → pass1_scoring → pass2_validating → executing → completed)
- **`QueryStatus`** - Individual query pipeline stages (GENERATED → PASS1_SCORED → PASS2_VALIDATED → DONE)

### Scoring Types

- **`Pass1ScoreResult`** - Pre-execution evaluation results
- **`Pass2ScoreResult`** - Post-execution evaluation results
- **`Pass1ScoreBreakdown`** - Detailed Pass 1 scoring breakdown
- **`Pass2ScoreBreakdown`** - Detailed Pass 2 scoring breakdown
- **`ScoreWeights`** - Composite score calculation weights

## Error Handling

All parsing functions (`parsePass1Response`, `parsePass2Response`, `parseGeneratedQueries`) include robust error handling:

1. **Markdown code block extraction** - Handles \`\`\`json blocks
2. **JSON parsing** - Try/catch with detailed error logging
3. **Structure validation** - Checks for required fields and types
4. **Range validation** - Warns on out-of-range scores
5. **Graceful degradation** - Returns sensible defaults on failure

Example:
```typescript
// If LLM returns malformed JSON, parsing will not throw
const result = parsePass1Response(malformedJSON);
// Returns: { score: 20, breakdown: {...}, reasoning: 'Failed to parse...' }
```

## Integration Example

Complete workflow integrating all components:

```typescript
import {
  buildQueryGenerationPrompt,
  buildPass1ScoringPrompt,
  buildPass2ScoringPrompt,
  parseGeneratedQueries,
  parsePass1Response,
  parsePass2Response,
  calculateCompositeScore,
  selectTopQueriesForContext,
} from '@/lib/agent';

async function runAgenticQueryRound(
  persona,
  seedQuery,
  previousTopQueries = []
) {
  // 1. Generate queries
  const genPrompt = buildQueryGenerationPrompt(
    persona,
    seedQuery,
    previousTopQueries,
    { maxQueries: 10 }
  );
  const genResponse = await callLLM(genPrompt);
  const queries = parseGeneratedQueries(genResponse);

  // 2. Pass 1 scoring
  const pass1Results = [];
  for (const q of queries) {
    const p1Prompt = buildPass1ScoringPrompt(q.query, persona, 'Master context');
    const p1Response = await callLLM(p1Prompt);
    const p1Result = parsePass1Response(p1Response);

    if (p1Result.score >= 60) {
      pass1Results.push({ ...q, pass1: p1Result });
    }
  }

  // 3. Execute queries and Pass 2 scoring
  const fullResults = [];
  for (const q of pass1Results) {
    const searchResults = await executeQuery(q.query);
    const sampleResults = searchResults.slice(0, 10);

    const p2Prompt = buildPass2ScoringPrompt(q.query, sampleResults, persona);
    const p2Response = await callLLM(p2Prompt);
    const p2Result = parsePass2Response(p2Response);

    if (p2Result.score >= 60) {
      const compositeScore = calculateCompositeScore(
        q.pass1.score,
        p2Result.score
      );

      fullResults.push({
        ...q,
        pass2: p2Result,
        compositeScore,
        results: searchResults,
      });
    }
  }

  // 4. Select top queries for next round
  const topQueries = selectTopQueriesForContext(fullResults, 5);

  return { fullResults, topQueries };
}
```

## Best Practices

1. **Always validate LLM responses** - Use the provided parse functions, don't parse manually
2. **Set reasonable thresholds** - Pass 1: 60+, Pass 2: 60+ are good starting points
3. **Limit sample size** - Pass 2 should evaluate top 10-20 results, not all
4. **Use context from previous rounds** - Feed top performers back for continuous improvement
5. **Monitor score distributions** - If everything passes/fails, adjust thresholds
6. **Cache LLM responses** - Scoring is deterministic, cache by prompt hash
7. **Parallelize scoring** - Pass 1 scoring is embarrassingly parallel
8. **Batch LLM calls** - Group multiple scoring requests when possible

## License

MIT
