# Agentic Query Builder - Quick Reference

## Import

```typescript
import {
  // Prompt builders
  buildQueryGenerationPrompt,
  buildPass1ScoringPrompt,
  buildPass2ScoringPrompt,

  // Parsers
  parseGeneratedQueries,
  parsePass1Response,
  parsePass2Response,

  // Utilities
  calculateCompositeScore,
  selectTopQueriesForContext,

  // Types
  type SearchPersona,
  type Pass1ScoreResult,
  type Pass2ScoreResult,
  type GeneratedQuery,
  type QueryContext,
} from '@/lib/agent';
```

## Core Functions

### buildQueryGenerationPrompt(persona, seedQuery, previousQueries?, budget?)

**Returns:** System prompt string for LLM

**Example:**
```typescript
const prompt = buildQueryGenerationPrompt(
  { jobTitles: ['CTO'], seniorityLevels: ['C-Level'], industries: ['Fintech'] },
  'site:linkedin.com/in/ "CTO" fintech',
  previousTopQueries, // optional
  { maxQueries: 10 }  // optional
);
```

---

### buildPass1ScoringPrompt(query, persona, masterPrompt)

**Returns:** System prompt string for LLM

**Example:**
```typescript
const prompt = buildPass1ScoringPrompt(
  'site:linkedin.com/in/ "CTO" fintech blockchain',
  persona,
  'Find senior fintech leaders'
);
```

---

### buildPass2ScoringPrompt(query, results, persona)

**Returns:** System prompt string for LLM

**Example:**
```typescript
const prompt = buildPass2ScoringPrompt(
  'site:linkedin.com/in/ "CTO" fintech blockchain',
  sampleResults.slice(0, 10),
  persona
);
```

---

### parseGeneratedQueries(llmResponse)

**Returns:** `Array<{ query: string, reasoning: string }>`

**Example:**
```typescript
const queries = parseGeneratedQueries(llmJsonResponse);
// [{ query: '...', reasoning: '...' }, ...]
```

---

### parsePass1Response(llmResponse)

**Returns:** `Pass1ScoreResult`

**Example:**
```typescript
const result = parsePass1Response(llmJsonResponse);
// { score: 82, breakdown: {...}, reasoning: '...' }
```

---

### parsePass2Response(llmResponse)

**Returns:** `Pass2ScoreResult`

**Example:**
```typescript
const result = parsePass2Response(llmJsonResponse);
// { score: 76, relevantCount: 7, breakdown: {...}, reasoning: '...', topMatches: [...] }
```

---

### calculateCompositeScore(pass1Score, pass2Score, weights?)

**Returns:** `number` (0-100)

**Example:**
```typescript
const score = calculateCompositeScore(82, 76);
// 77.8 (default weights: 30% Pass 1, 70% Pass 2)

const customScore = calculateCompositeScore(82, 76, { pass1: 0.4, pass2: 0.6 });
// 74.4
```

---

### selectTopQueriesForContext(queries, limit)

**Returns:** `QueryContext[]`

**Example:**
```typescript
const topQueries = selectTopQueriesForContext(allQueries, 5);
// [{ query: '...', compositeScore: 85.9, pass1Score: 88, pass2Score: 85 }, ...]
```

## Scoring Criteria

### Pass 1 (Pre-execution) - Total: 100 points

| Criteria | Points | Description |
|----------|--------|-------------|
| Expected Yield | 0-40 | Boolean operators (10), Breadth (15), Technical quality (15) |
| Persona Relevance | 0-35 | Seniority (12), Job function (12), Industry (11) |
| Query Uniqueness | 0-25 | Novel angle (10), Keyword diversity (8), Exclusions (7) |

### Pass 2 (Post-execution) - Total: 100 points

| Criteria | Points | Description |
|----------|--------|-------------|
| Result Relevance | 0-50 | Profile matches (30), Title/description alignment (20) |
| Quality Signal | 0-30 | Seniority indicators (15), Company quality (15) |
| Diversity | 0-20 | Company diversity (10), Role diversity (10) |

## Type Definitions

### SearchPersona

```typescript
interface SearchPersona {
  jobTitles: string[];
  seniorityLevels: string[];
  industries: string[];
  companyTypes?: string[];
  locations?: string[];
  keywords?: string[];
}
```

### Pass1ScoreResult

```typescript
interface Pass1ScoreResult {
  score: number;
  breakdown: {
    expectedYield: number;
    personaRelevance: number;
    queryUniqueness: number;
  };
  reasoning: string;
}
```

### Pass2ScoreResult

```typescript
interface Pass2ScoreResult {
  score: number;
  relevantCount: number;
  breakdown: {
    resultRelevance: number;
    qualitySignal: number;
    diversity: number;
  };
  reasoning: string;
  topMatches: number[];
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

## Workflow Pattern

```typescript
// 1. Generate queries
const genPrompt = buildQueryGenerationPrompt(persona, seedQuery);
const genResponse = await callLLM(genPrompt);
const queries = parseGeneratedQueries(genResponse);

// 2. Pass 1 scoring
for (const q of queries) {
  const p1Prompt = buildPass1ScoringPrompt(q.query, persona, masterContext);
  const p1Response = await callLLM(p1Prompt);
  const p1Result = parsePass1Response(p1Response);

  if (p1Result.score >= 60) {
    // Query passed Pass 1
  }
}

// 3. Execute & Pass 2 scoring
const results = await executeQuery(query);
const p2Prompt = buildPass2ScoringPrompt(query, results.slice(0, 10), persona);
const p2Response = await callLLM(p2Prompt);
const p2Result = parsePass2Response(p2Response);

if (p2Result.score >= 60) {
  // Query passed Pass 2
}

// 4. Calculate composite score
const compositeScore = calculateCompositeScore(p1Result.score, p2Result.score);

// 5. Select top queries for next round
const topQueries = selectTopQueriesForContext(allQueries, 5);
```

## Thresholds

| Phase | Recommended Threshold |
|-------|----------------------|
| Pass 1 | 60+ (good quality prediction) |
| Pass 2 | 60+ (good result quality) |
| Composite | 70+ (high confidence) |

## Error Handling

All parse functions fail gracefully:

```typescript
// Malformed JSON → returns default low score
const result = parsePass1Response('not json');
// { score: 20, breakdown: {...}, reasoning: 'Failed to parse...' }

// Invalid structure → returns empty array
const queries = parseGeneratedQueries('{ "invalid": true }');
// []

// No throws, always safe to use
```

## Performance Tips

1. **Parallelize Pass 1 scoring** - No dependencies, score all at once
2. **Batch LLM calls** - Group multiple queries in one request if API supports
3. **Cache prompts** - Same persona + query = same prompt
4. **Stream results** - Don't wait for all, process as they complete
5. **Limit sample size** - Pass 2 only needs top 10-20 results, not all

## Common Pitfalls

❌ **Don't** send full result arrays to LLM (use sample of 10)
❌ **Don't** parse JSON manually (use provided parse functions)
❌ **Don't** skip error handling (LLMs return malformed JSON sometimes)
❌ **Don't** use equal weights (prediction < reality, use 30/70)

✅ **Do** validate thresholds are reasonable (60+ is good)
✅ **Do** provide previous top queries for learning
✅ **Do** filter aggressively at each stage
✅ **Do** log all scores for analysis
