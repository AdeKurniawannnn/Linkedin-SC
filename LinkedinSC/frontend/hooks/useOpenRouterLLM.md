# useOpenRouterLLM Hook

React hook for integrating OpenRouter LLM API into the Agentic Query Builder pipeline.

## Features

- **Query Generation**: Generate diverse LinkedIn SERP queries based on persona and seed query
- **Pass 1 Scoring**: Pre-execution evaluation of query quality
- **Pass 2 Scoring**: Post-execution evaluation based on actual results
- **Batch Operations**: Process multiple queries/results with configurable concurrency
- **Retry Logic**: Automatic retry with exponential backoff (3 attempts)
- **Cancellation**: Support for aborting ongoing operations
- **Token Tracking**: Monitor API token usage

## Installation

```typescript
import { useOpenRouterLLM } from '@/hooks';
```

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_OPENROUTER_API_KEY=your-api-key-here
```

### Options

```typescript
interface UseOpenRouterLLMOptions {
  apiKey?: string;    // Override env var
  model?: string;     // Default: 'anthropic/claude-3-haiku'
}
```

## Usage

### Basic Setup

```typescript
const {
  generateQueries,
  scoreQueryPass1,
  scoreResultsPass2,
  batchScorePass1,
  batchScorePass2,
  isLoading,
  error,
  tokensUsed,
  cancel,
} = useOpenRouterLLM({
  model: 'anthropic/claude-3-haiku', // Optional
});
```

### Generate Queries

```typescript
const queries = await generateQueries(
  'Senior Engineering Leaders in Fintech',  // persona
  'site:linkedin.com/in/ "CTO" fintech',   // seedQuery
  previousTopQueries,                       // optional
  10                                        // budget (max queries)
);

// Returns:
// [
//   {
//     query: 'site:linkedin.com/in/ "VP Engineering" (startup OR "series A") blockchain',
//     reasoning: 'Targets senior tech leaders in early-stage fintech companies'
//   },
//   ...
// ]
```

### Score Query (Pass 1)

```typescript
const result = await scoreQueryPass1(
  'site:linkedin.com/in/ "CTO" fintech blockchain',  // query
  'Senior Engineering Leaders in Fintech',            // persona
  'Find qualified leads for B2B SaaS sales'           // masterPrompt
);

// Returns:
// {
//   score: 82,
//   breakdown: {
//     expectedYield: 35,
//     personaRelevance: 30,
//     queryUniqueness: 17
//   },
//   reasoning: 'Strong Boolean operators, good seniority match...'
// }
```

### Score Results (Pass 2)

```typescript
const result = await scoreResultsPass2(
  'site:linkedin.com/in/ "CTO" fintech blockchain',  // query
  searchResults,                                      // UnifiedResult[]
  'Senior Engineering Leaders in Fintech'             // persona
);

// Returns:
// {
//   score: 76,
//   relevantCount: 7,
//   breakdown: {
//     resultRelevance: 38,
//     qualitySignal: 24,
//     diversity: 14
//   },
//   reasoning: '7/10 results match persona. Strong seniority signals...',
//   topMatches: [1, 2, 4, 5, 7, 8, 10]
// }
```

### Batch Scoring (Pass 1)

```typescript
const queries = [
  'site:linkedin.com/in/ "CTO" fintech',
  'site:linkedin.com/in/ "VP Engineering" blockchain',
  'site:linkedin.com/in/ "Head of Product" crypto'
];

const results = await batchScorePass1(
  queries,
  'Senior Engineering Leaders in Fintech',
  'Find qualified leads for B2B SaaS sales',
  3  // concurrency (optional, default: 3)
);

// Returns Map<string, Pass1ScoreResult>
results.get(queries[0]); // { score: 82, breakdown: {...}, reasoning: '...' }
```

### Batch Scoring (Pass 2)

```typescript
const queryResultPairs = [
  { query: 'query1', results: [...] },
  { query: 'query2', results: [...] },
  { query: 'query3', results: [...] }
];

const results = await batchScorePass2(
  queryResultPairs,
  'Senior Engineering Leaders in Fintech',
  3  // concurrency (optional, default: 3)
);

// Returns Map<string, Pass2ScoreResult>
results.get('query1'); // { score: 76, relevantCount: 7, ... }
```

### Cancellation

```typescript
// Start long-running operation
const promise = generateQueries(persona, seedQuery);

// Cancel if needed
cancel();

// Promise will reject with "Request cancelled"
```

### Error Handling

```typescript
try {
  const queries = await generateQueries(persona, seedQuery);

  if (error) {
    console.error('Operation completed with errors:', error);
  }
} catch (err) {
  console.error('Operation failed:', err.message);
}
```

## API Reference

### Core Functions

#### generateQueries()

Generate LinkedIn SERP queries based on persona and seed query.

**Parameters:**
- `persona` (string): Target audience description
- `seedQuery` (string): Example query to build upon
- `previousQueries` (QueryContext[], optional): Top queries from previous iterations
- `budget` (number, optional): Max queries to generate (default: 10)

**Returns:** `Promise<Array<{ query: string; reasoning: string }>>`

#### scoreQueryPass1()

Evaluate query quality before execution.

**Parameters:**
- `query` (string): Query to evaluate
- `persona` (string): Target audience
- `masterPrompt` (string): Scoring context

**Returns:** `Promise<Pass1ScoreResult>`

#### scoreResultsPass2()

Evaluate actual search results quality.

**Parameters:**
- `query` (string): Executed query
- `results` (UnifiedResult[]): Search results
- `persona` (string): Target audience

**Returns:** `Promise<Pass2ScoreResult>`

### Batch Functions

#### batchScorePass1()

Score multiple queries with concurrency control.

**Parameters:**
- `queries` (string[]): Queries to score
- `persona` (string): Target audience
- `masterPrompt` (string): Scoring context
- `concurrency` (number, optional): Max parallel requests (default: 3)

**Returns:** `Promise<Map<string, Pass1ScoreResult>>`

#### batchScorePass2()

Score multiple result sets with concurrency control.

**Parameters:**
- `queryResultPairs` (Array<{ query, results }>): Pairs to score
- `persona` (string): Target audience
- `concurrency` (number, optional): Max parallel requests (default: 3)

**Returns:** `Promise<Map<string, Pass2ScoreResult>>`

### State

- `isLoading` (boolean): Operation in progress
- `error` (string | null): Last error message
- `tokensUsed` (number): Total tokens consumed

### Control

- `cancel()`: Abort all ongoing operations

## Retry Logic

The hook implements automatic retry with exponential backoff:

- **Max retries:** 3 attempts
- **Initial delay:** 1 second
- **Backoff strategy:** Exponential (1s, 2s, 4s)
- **Non-retriable errors:** AbortError (cancellation)

## Token Usage

Token usage is tracked automatically and accumulated across all requests:

```typescript
const { tokensUsed } = useOpenRouterLLM();

// After operations
console.log(`Total tokens used: ${tokensUsed}`);
```

## Best Practices

### 1. Model Selection

```typescript
// Fast and cheap (recommended for production)
useOpenRouterLLM({ model: 'anthropic/claude-3-haiku' });

// More intelligent (for complex reasoning)
useOpenRouterLLM({ model: 'anthropic/claude-3-sonnet' });
```

### 2. Concurrency Tuning

```typescript
// Conservative (default)
await batchScorePass1(queries, persona, masterPrompt, 3);

// Aggressive (rate limits permitting)
await batchScorePass1(queries, persona, masterPrompt, 10);
```

### 3. Error Recovery

```typescript
const results = await batchScorePass1(queries, persona, masterPrompt);

// Check for partial failures
if (error) {
  console.warn('Some queries failed:', error);
}

// Process successful results
const successfulScores = Array.from(results.values());
```

### 4. Resource Management

```typescript
// Cancel on component unmount
useEffect(() => {
  return () => cancel();
}, [cancel]);
```

## Type Definitions

### Pass1ScoreResult

```typescript
interface Pass1ScoreResult {
  score: number;                    // 0-100
  breakdown: {
    expectedYield: number;          // 0-40
    personaRelevance: number;       // 0-35
    queryUniqueness: number;        // 0-25
  };
  reasoning: string;
}
```

### Pass2ScoreResult

```typescript
interface Pass2ScoreResult {
  score: number;                    // 0-100
  relevantCount: number;
  breakdown: {
    resultRelevance: number;        // 0-50
    qualitySignal: number;          // 0-30
    diversity: number;              // 0-20
  };
  reasoning: string;
  topMatches: number[];             // Indices of best results
}
```

### QueryContext

```typescript
interface QueryContext {
  query: string;
  compositeScore?: number;
  pass1Score?: number;
  pass2Score?: number;
}
```

## Integration Example

Complete example of using the hook in an agent pipeline:

```typescript
import { useOpenRouterLLM } from '@/hooks';
import { calculateCompositeScore } from '@/lib/agent/scoring';

function AgentPipeline() {
  const llm = useOpenRouterLLM();
  const [topQueries, setTopQueries] = useState<QueryContext[]>([]);

  const runPipeline = async () => {
    // Round 1: Generate initial queries
    const queries = await llm.generateQueries(
      'Senior Engineering Leaders in Fintech',
      'site:linkedin.com/in/ "CTO" fintech'
    );

    // Pass 1: Score all queries
    const pass1Results = await llm.batchScorePass1(
      queries.map(q => q.query),
      'Senior Engineering Leaders in Fintech',
      'Find qualified leads for B2B SaaS sales'
    );

    // Filter by threshold
    const pass1Filtered = queries.filter(
      q => (pass1Results.get(q.query)?.score || 0) >= 70
    );

    // Execute filtered queries (fetch actual results)
    const executionResults = await Promise.all(
      pass1Filtered.map(async q => {
        const results = await searchRaw({ query: q.query, ... });
        return { query: q.query, results: results.results };
      })
    );

    // Pass 2: Score actual results
    const pass2Results = await llm.batchScorePass2(
      executionResults,
      'Senior Engineering Leaders in Fintech'
    );

    // Calculate composite scores
    const scoredQueries = pass1Filtered.map(q => {
      const p1 = pass1Results.get(q.query)!.score;
      const p2 = pass2Results.get(q.query)!.score;

      return {
        query: q.query,
        pass1Score: p1,
        pass2Score: p2,
        compositeScore: calculateCompositeScore(p1, p2),
      };
    });

    // Select top performers for next round
    const top = scoredQueries
      .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
      .slice(0, 5);

    setTopQueries(top);

    // Round 2: Learn from top queries
    const nextQueries = await llm.generateQueries(
      'Senior Engineering Leaders in Fintech',
      'site:linkedin.com/in/ "CTO" fintech',
      top,  // Pass top queries for learning
      15    // Generate more this round
    );

    // Continue pipeline...
  };

  return (
    <div>
      <button onClick={runPipeline} disabled={llm.isLoading}>
        {llm.isLoading ? 'Running...' : 'Start Pipeline'}
      </button>

      {llm.error && <div>Error: {llm.error}</div>}
      <div>Tokens used: {llm.tokensUsed}</div>

      <button onClick={llm.cancel} disabled={!llm.isLoading}>
        Cancel
      </button>
    </div>
  );
}
```

## Related Files

- **Prompts:** `/lib/agent/prompts.ts` - Prompt builders
- **Scoring:** `/lib/agent/scoring.ts` - Response parsers and scoring logic
- **Types:** `/lib/agent/types.ts` - Type definitions
- **API:** `/lib/api.ts` - Backend search client

## Troubleshooting

### "OpenRouter API key not configured"

Ensure `NEXT_PUBLIC_OPENROUTER_API_KEY` is set in your `.env.local`:

```env
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
```

### Rate Limits

OpenRouter has rate limits per model. If you hit them:

1. Reduce `concurrency` parameter
2. Add delays between batches
3. Upgrade OpenRouter plan

### Parsing Failures

If LLM returns malformed JSON:

1. Check `console.error` for raw response
2. Try different model (Sonnet is more reliable than Haiku)
3. Adjust prompts in `/lib/agent/prompts.ts`

### Token Usage Optimization

To reduce token costs:

1. Use smaller models (Haiku < Sonnet < Opus)
2. Reduce sample size for Pass 2 (fewer results)
3. Increase Pass 1 threshold to filter more aggressively
4. Cache results when possible

## License

MIT
