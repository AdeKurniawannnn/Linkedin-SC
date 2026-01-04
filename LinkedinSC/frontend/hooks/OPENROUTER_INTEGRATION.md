# OpenRouter LLM Integration - Summary

## Overview

Complete OpenRouter API integration for the Agentic Query Builder pipeline. This implementation provides React hooks for LLM-powered query generation and multi-pass scoring with batch operations, retry logic, and cancellation support.

## Files Created

### 1. Core Hook: `hooks/useOpenRouterLLM.ts`

**Location:** `/hooks/useOpenRouterLLM.ts`

**Purpose:** Main React hook for OpenRouter API integration

**Key Features:**
- Query generation with persona and seed query
- Pass 1 scoring (pre-execution evaluation)
- Pass 2 scoring (post-execution evaluation)
- Batch operations with concurrency control
- Automatic retry with exponential backoff (3 attempts)
- Request cancellation via AbortController
- Token usage tracking
- Error handling and state management

**API Surface:**
```typescript
const {
  generateQueries,      // Generate LinkedIn queries
  scoreQueryPass1,      // Score query before execution
  scoreResultsPass2,    // Score results after execution
  batchScorePass1,      // Batch Pass 1 scoring
  batchScorePass2,      // Batch Pass 2 scoring
  isLoading,            // Loading state
  error,                // Error message
  tokensUsed,           // Total tokens consumed
  cancel,               // Cancel operations
} = useOpenRouterLLM({
  apiKey: '...',        // Optional, uses env var
  model: 'anthropic/claude-3-haiku',  // Optional
});
```

**Dependencies:**
- `@/lib/agent/prompts` - Prompt builders
- `@/lib/agent/scoring` - Response parsers
- `@/lib/agent/types` - Type definitions
- `@/lib/api` - UnifiedResult types

### 2. Documentation: `hooks/useOpenRouterLLM.md`

**Location:** `/hooks/useOpenRouterLLM.md`

**Contents:**
- Comprehensive API documentation
- Usage examples for all functions
- Integration patterns
- Best practices for concurrency, error handling, and resource management
- Type reference
- Troubleshooting guide
- Complete pipeline integration example

**Sections:**
1. Features overview
2. Installation and configuration
3. Usage examples (basic and advanced)
4. API reference with parameter details
5. Retry logic documentation
6. Token usage tracking
7. Best practices
8. Type definitions
9. Integration example (full pipeline)
10. Troubleshooting

### 3. Tests: `hooks/__tests__/useOpenRouterLLM.test.tsx`

**Location:** `/hooks/__tests__/useOpenRouterLLM.test.tsx`

**Test Coverage:**
- Hook initialization and default state
- Custom options handling
- Query generation (with API key checks)
- Pass 1 scoring
- Pass 2 scoring
- Batch operations (Pass 1 and Pass 2)
- Cancellation functionality
- Error handling (invalid API keys, network errors)
- Token usage tracking

**Test Strategy:**
- Unit tests for all core functions
- Integration tests (skipped if no API key)
- Error case validation
- Timeout handling (30s for individual, 60s for batch)

### 4. Example Component: `hooks/examples/AgentPipelineExample.tsx`

**Location:** `/hooks/examples/AgentPipelineExample.tsx`

**Purpose:** Complete working example of the agent pipeline

**Features:**
- Full pipeline implementation (Generate → Pass 1 → Execute → Pass 2)
- Interactive UI with configuration controls
- Real-time status display
- Query results table with scoring visualization
- Top queries display for next round learning
- Threshold controls for Pass 1 and Pass 2
- Token usage tracking
- Error display
- Pipeline cancellation

**Use Cases:**
- Reference implementation for developers
- Testing and debugging the pipeline
- Demo for stakeholders
- Learning material for new team members

### 5. Export Update: `hooks/index.ts`

**Location:** `/hooks/index.ts`

**Change:** Added export for `useOpenRouterLLM`

```typescript
export { useOpenRouterLLM } from "./useOpenRouterLLM";
```

## Configuration

### Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
```

### OpenRouter Models

**Recommended:**
- `anthropic/claude-3-haiku` - Fast, cheap, good for production
- `anthropic/claude-3-sonnet` - More intelligent, better for complex reasoning
- `anthropic/claude-3-opus` - Most powerful (use sparingly, expensive)

**Cost Optimization:**
- Haiku: ~$0.25 per million tokens (input) / ~$1.25 (output)
- Sonnet: ~$3.00 per million tokens (input) / ~$15.00 (output)
- Opus: ~$15.00 per million tokens (input) / ~$75.00 (output)

## Integration Points

### Existing Pipeline Components

The hook integrates seamlessly with existing agent infrastructure:

1. **Prompts** (`lib/agent/prompts.ts`):
   - `buildQueryGenerationPrompt()` - Used by `generateQueries()`
   - `buildPass1ScoringPrompt()` - Used by `scoreQueryPass1()`
   - `buildPass2ScoringPrompt()` - Used by `scoreResultsPass2()`

2. **Scoring** (`lib/agent/scoring.ts`):
   - `parseGeneratedQueries()` - Parses LLM query generation responses
   - `parsePass1Response()` - Parses Pass 1 scoring responses
   - `parsePass2Response()` - Parses Pass 2 scoring responses
   - `calculateCompositeScore()` - Combines Pass 1 and Pass 2 scores

3. **Types** (`lib/agent/types.ts`):
   - `Pass1ScoreResult` - Pass 1 scoring structure
   - `Pass2ScoreResult` - Pass 2 scoring structure
   - `QueryContext` - Lightweight query metadata for prompts
   - `SearchPersona` - Persona definition structure
   - `SampleResult` - Result format for Pass 2

4. **API** (`lib/api.ts`):
   - `UnifiedResult` - Search result structure
   - `searchRaw()` - Execute LinkedIn searches

### Backend Integration

The hook calls the OpenRouter API directly (client-side) but results feed into:

- **Search Execution:** `searchRaw()` from `lib/api.ts`
- **Result Storage:** Convex mutations for storing scored queries
- **Session Management:** Tracks agent session state in Convex

## Usage Patterns

### Pattern 1: Simple Query Generation

```typescript
const { generateQueries } = useOpenRouterLLM();

const queries = await generateQueries(
  'Senior Engineering Leaders in Fintech',
  'site:linkedin.com/in/ "CTO" fintech',
  undefined,
  10
);
```

### Pattern 2: Full Pipeline with Learning

```typescript
const llm = useOpenRouterLLM();

// Round 1: Initial generation
const round1Queries = await llm.generateQueries(persona, seedQuery);

// Score with Pass 1
const pass1Results = await llm.batchScorePass1(
  round1Queries.map(q => q.query),
  persona,
  masterPrompt
);

// Execute top queries
const topQueries = filterByThreshold(round1Queries, pass1Results, 70);
const searchResults = await executeSearches(topQueries);

// Score with Pass 2
const pass2Results = await llm.batchScorePass2(searchResults, persona);

// Calculate composite scores
const scoredQueries = calculateComposite(pass1Results, pass2Results);

// Round 2: Learn from top performers
const topPerformers = selectTop(scoredQueries, 5);
const round2Queries = await llm.generateQueries(
  persona,
  seedQuery,
  topPerformers,  // Pass for learning
  15              // More queries this round
);
```

### Pattern 3: Batch Processing with Concurrency

```typescript
const llm = useOpenRouterLLM();

// Score 100 queries with concurrency = 5
const results = await llm.batchScorePass1(
  allQueries,
  persona,
  masterPrompt,
  5  // Process 5 at a time
);

// Check for partial failures
if (llm.error) {
  console.warn('Some queries failed:', llm.error);
}

// Process successful results
const successful = Array.from(results.entries());
```

## Performance Considerations

### Concurrency

**Default:** 3 parallel requests

**Tuning:**
- Conservative (avoid rate limits): 1-3
- Balanced: 3-5
- Aggressive (with rate limit handling): 5-10

**Example:**
```typescript
await batchScorePass1(queries, persona, masterPrompt, 5);
```

### Token Usage

**Typical Costs:**
- Query generation (10 queries): ~2,000 tokens
- Pass 1 scoring (1 query): ~500 tokens
- Pass 2 scoring (1 query, 10 results): ~800 tokens

**Optimization:**
- Use Haiku for production
- Cache results when possible
- Reduce sample size for Pass 2
- Increase Pass 1 threshold to filter more aggressively

### Retry Strategy

**Configuration:**
- Max retries: 3
- Initial delay: 1 second
- Backoff: Exponential (1s, 2s, 4s)

**Non-retriable:**
- Cancellation (AbortError)
- Invalid API key (401)

## Error Handling

### API Errors

```typescript
try {
  const queries = await generateQueries(persona, seedQuery);
} catch (err) {
  if (err.message.includes('API key')) {
    // Handle auth error
  } else if (err.message.includes('rate limit')) {
    // Handle rate limit
  } else {
    // Generic error
  }
}
```

### Batch Errors

Batch operations continue on individual failures:

```typescript
const results = await batchScorePass1(queries, persona, masterPrompt);

// Check error state
if (llm.error) {
  console.warn('Partial failure:', llm.error);
}

// Process successful results
const successful = Array.from(results.values());
```

### Cancellation

```typescript
const promise = generateQueries(persona, seedQuery);

// Cancel if needed
llm.cancel();

// Promise will reject
await promise.catch(err => {
  console.log('Cancelled:', err.message);
});
```

## Testing

### Run Tests

```bash
# All tests
npm test hooks/__tests__/useOpenRouterLLM.test.tsx

# With API integration (requires key)
NEXT_PUBLIC_OPENROUTER_API_KEY=sk-... npm test
```

### Test Strategy

1. **Unit Tests:** Hook behavior without API calls
2. **Integration Tests:** Real API calls (conditionally skipped)
3. **Error Tests:** Invalid inputs and network errors

## Next Steps

### Recommended Enhancements

1. **Caching Layer:**
   - Cache LLM responses for duplicate queries
   - Reduce redundant API calls
   - Use IndexedDB or Convex storage

2. **Rate Limiting:**
   - Add client-side rate limit tracking
   - Queue requests when approaching limits
   - Implement backoff strategies

3. **Streaming:**
   - Support streaming responses for real-time feedback
   - Update UI as queries are generated
   - Show partial results during batch operations

4. **Analytics:**
   - Track query performance metrics
   - Monitor token costs per session
   - Identify high-performing personas/seed queries

5. **Advanced Scoring:**
   - Custom scoring weights per persona
   - Multi-model ensemble scoring
   - A/B testing different prompt templates

## Migration Guide

### From Existing Agent Code

If you have existing agent code, migrate to the hook:

**Before:**
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  // manual API call
});
const data = await response.json();
const queries = JSON.parse(data.choices[0].message.content);
```

**After:**
```typescript
const { generateQueries } = useOpenRouterLLM();
const queries = await generateQueries(persona, seedQuery);
```

### Benefits

- Automatic retry logic
- Type safety
- Error handling
- Token tracking
- Cancellation support
- Batch operations
- Consistent API

## Support

### Documentation

- **Hook API:** `useOpenRouterLLM.md`
- **Examples:** `examples/AgentPipelineExample.tsx`
- **Tests:** `__tests__/useOpenRouterLLM.test.tsx`

### Common Issues

1. **"API key not configured"**
   - Check `.env.local` has `NEXT_PUBLIC_OPENROUTER_API_KEY`

2. **Rate limit errors**
   - Reduce concurrency
   - Add delays between batches

3. **Parsing failures**
   - Check console for raw LLM responses
   - Try different model (Sonnet > Haiku)

4. **High token costs**
   - Use Haiku instead of Sonnet/Opus
   - Reduce sample sizes
   - Cache results

## Version History

### v1.0.0 (2026-01-04)

**Initial Release:**
- Core hook implementation
- Batch operations with concurrency
- Retry logic with exponential backoff
- Cancellation support
- Token tracking
- Comprehensive documentation
- Test suite
- Example component

**Features:**
- Query generation
- Pass 1 scoring
- Pass 2 scoring
- Error handling
- Type safety

**Dependencies:**
- React 18+
- TypeScript 5+
- OpenRouter API
- Existing agent infrastructure (prompts, scoring, types)

---

**Created:** 2026-01-04
**Author:** Claude (Opus 4.5)
**Status:** Production Ready
