# Agentic Query Builder - Examples

Sample inputs and outputs for all prompt templates and scoring functions.

## Query Generation Prompt

### Input

```typescript
const persona = {
  jobTitles: ['Chief Technology Officer', 'VP Engineering', 'Head of Engineering'],
  seniorityLevels: ['C-Level', 'VP', 'Director'],
  industries: ['Fintech', 'SaaS', 'Enterprise Software'],
  companyTypes: ['Startup', 'Series A-D', 'Growth Stage'],
  locations: ['San Francisco', 'New York', 'Remote'],
};

const seedQuery = 'site:linkedin.com/in/ "CTO" fintech blockchain';

const prompt = buildQueryGenerationPrompt(persona, seedQuery);
```

### Output Prompt (Abbreviated)

```
You are an expert at crafting LinkedIn SERP queries to find specific professional personas.

## Target Persona
- Job Titles: Chief Technology Officer, VP Engineering, Head of Engineering
- Seniority Levels: C-Level, VP, Director
- Industries: Fintech, SaaS, Enterprise Software
- Company Types: Startup, Series A-D, Growth Stage
- Locations: San Francisco, New York, Remote

## Seed Query Example
"site:linkedin.com/in/ "CTO" fintech blockchain"

## Instructions
Generate 10 diverse LinkedIn search queries using the following techniques:

1. Use site:linkedin.com/in/ for targeting LinkedIn profiles
2. Boolean operators: AND, OR, "-" (exclude), quotes
3. Vary specificity: broad, narrow, medium
4. Creative approaches: skills, education, company names, transitions

## Output Format
Return a JSON array with this exact structure:

```json
[
  {
    "query": "site:linkedin.com/in/ (\"Chief Technology Officer\" OR \"VP Engineering\") fintech blockchain",
    "reasoning": "Targets senior technical leaders in fintech with blockchain expertise"
  },
  ...
]
```
```

### Sample LLM Response

```json
[
  {
    "query": "site:linkedin.com/in/ (\"CTO\" OR \"Chief Technology Officer\") (fintech OR \"financial technology\") blockchain -recruiter",
    "reasoning": "Targets CTOs in fintech with blockchain expertise, excludes recruiters"
  },
  {
    "query": "site:linkedin.com/in/ \"VP Engineering\" (startup OR \"series A\") (\"San Francisco\" OR \"New York\") -hiring",
    "reasoning": "Focuses on VPs at early-stage startups in key tech hubs, excludes hiring posts"
  },
  {
    "query": "site:linkedin.com/in/ \"Head of Engineering\" SaaS (AWS OR Azure OR GCP) remote",
    "reasoning": "Targets engineering leaders in SaaS with cloud platform experience, open to remote"
  },
  {
    "query": "site:linkedin.com/in/ (CTO OR \"VP Engineering\") (\"Y Combinator\" OR \"Sequoia\" OR \"a16z\") -job",
    "reasoning": "Finds leaders at top VC-backed companies, excludes job listings"
  },
  {
    "query": "site:linkedin.com/in/ \"Director of Engineering\" (fintech OR payments) (\"machine learning\" OR AI)",
    "reasoning": "Targets Directors in fintech with ML/AI background"
  },
  {
    "query": "site:linkedin.com/in/ \"Chief Technology Officer\" (\"Series B\" OR \"Series C\") enterprise SaaS",
    "reasoning": "Focuses on CTOs at growth-stage enterprise SaaS companies"
  },
  {
    "query": "site:linkedin.com/in/ (\"VP Engineering\" OR \"Head of Engineering\") (Stripe OR Plaid OR Brex OR Ramp)",
    "reasoning": "Targets senior leaders at successful fintech companies"
  },
  {
    "query": "site:linkedin.com/in/ CTO (\"formerly at\" OR \"ex-\") (Google OR Facebook OR Amazon OR Microsoft)",
    "reasoning": "Finds CTOs with FAANG background, indicating strong technical pedigree"
  },
  {
    "query": "site:linkedin.com/in/ \"VP Engineering\" (Kubernetes OR microservices OR distributed systems) startup",
    "reasoning": "Targets VPs with modern infrastructure expertise at startups"
  },
  {
    "query": "site:linkedin.com/in/ (\"Head of Engineering\" OR \"Engineering Director\") (\"Stanford\" OR \"MIT\" OR \"Berkeley\") fintech",
    "reasoning": "Combines elite education background with fintech and leadership roles"
  }
]
```

### Parsed Result

```typescript
const queries = parseGeneratedQueries(llmResponse);
// [
//   {
//     query: 'site:linkedin.com/in/ ("CTO" OR "Chief Technology Officer") ...',
//     reasoning: 'Targets CTOs in fintech with blockchain expertise, excludes recruiters'
//   },
//   { query: '...', reasoning: '...' },
//   ...
// ]
```

---

## Pass 1 Scoring Prompt

### Input

```typescript
const query = 'site:linkedin.com/in/ "VP Engineering" (startup OR "series A") -recruiter';
const persona = { /* same as above */ };
const masterPrompt = 'Find senior technical leaders in early-stage fintech companies';

const prompt = buildPass1ScoringPrompt(query, persona, masterPrompt);
```

### Output Prompt (Abbreviated)

```
You are an expert at evaluating LinkedIn search query quality BEFORE execution.

## Query to Evaluate
"site:linkedin.com/in/ "VP Engineering" (startup OR "series A") -recruiter"

## Target Persona
- Job Titles: Chief Technology Officer, VP Engineering, Head of Engineering
- Seniority Levels: C-Level, VP, Director
- Industries: Fintech, SaaS, Enterprise Software

## Master Context
Find senior technical leaders in early-stage fintech companies

## Scoring Criteria (Total: 100 points)

### 1. Expected Yield (0-40 points)
- Boolean operator effectiveness (10 points)
- Query breadth (15 points)
- Technical quality (15 points)

### 2. Persona Relevance (0-35 points)
- Seniority match (12 points)
- Job function alignment (12 points)
- Industry focus (11 points)

### 3. Query Uniqueness (0-25 points)
- Novel angle (10 points)
- Keyword diversity (8 points)
- Strategic exclusions (7 points)

## Output Format
Return JSON: { score, breakdown: {...}, reasoning }
```

### Sample LLM Response

```json
{
  "score": 78,
  "breakdown": {
    "expectedYield": 32,
    "personaRelevance": 30,
    "queryUniqueness": 16
  },
  "reasoning": "Strong Boolean operators targeting VP-level roles at early-stage companies. Excellent use of '-recruiter' to exclude noise. Seniority match is perfect for persona. Slightly generic on industry targeting (no fintech-specific terms), and the approach is somewhat conventional. Expected to yield 20-50 quality results."
}
```

### Parsed Result

```typescript
const result = parsePass1Response(llmResponse);
// {
//   score: 78,
//   breakdown: {
//     expectedYield: 32,
//     personaRelevance: 30,
//     queryUniqueness: 16
//   },
//   reasoning: 'Strong Boolean operators targeting VP-level roles...'
// }

if (result.score >= 60) {
  console.log('Query passed Pass 1! Proceeding to execution.');
}
```

---

## Pass 2 Scoring Prompt

### Input

```typescript
const query = 'site:linkedin.com/in/ "VP Engineering" (startup OR "series A") -recruiter';
const sampleResults = [
  {
    title: 'Sarah Chen - VP Engineering at TechFlow (Series A)',
    description: 'Leading engineering team of 15 at fintech startup. Previously at Stripe...',
    type: 'profile'
  },
  {
    title: 'Michael Torres - VP of Engineering | SaaS Startup',
    description: '10+ years building scalable systems. Currently at early-stage B2B SaaS...',
    type: 'profile'
  },
  {
    title: 'TechFlow - Careers',
    description: 'Join our engineering team! We are hiring...',
    type: 'company'
  },
  // ... 7 more results
];

const prompt = buildPass2ScoringPrompt(query, sampleResults, persona);
```

### Output Prompt (Abbreviated)

```
You are an expert at evaluating LinkedIn SERP results quality.

## Query Executed
"site:linkedin.com/in/ "VP Engineering" (startup OR "series A") -recruiter"

## Target Persona
- Job Titles: Chief Technology Officer, VP Engineering, Head of Engineering
- Seniority Levels: C-Level, VP, Director
- Industries: Fintech, SaaS, Enterprise Software

## Actual SERP Results (Sample of 10)

1. [profile] Sarah Chen - VP Engineering at TechFlow (Series A)
   Leading engineering team of 15 at fintech startup. Previously at Stripe...

2. [profile] Michael Torres - VP of Engineering | SaaS Startup
   10+ years building scalable systems. Currently at early-stage B2B SaaS...

3. [company] TechFlow - Careers
   Join our engineering team! We are hiring...

...

## Scoring Criteria (Total: 100 points)

### 1. Result Relevance (0-50 points)
- Profile match count (30 points)
- Title/description alignment (20 points)

### 2. Quality Signal (0-30 points)
- Seniority indicators (15 points)
- Company quality (15 points)

### 3. Diversity (0-20 points)
- Company diversity (10 points)
- Role diversity (10 points)

## Output Format
Return JSON: { score, relevantCount, breakdown: {...}, reasoning, topMatches: [...] }
```

### Sample LLM Response

```json
{
  "score": 72,
  "relevantCount": 7,
  "breakdown": {
    "resultRelevance": 38,
    "qualitySignal": 22,
    "diversity": 12
  },
  "reasoning": "7 out of 10 results match target persona with VP-level engineering roles. Strong seniority signals present. Good mix of fintech (2), SaaS (3), and enterprise (2) companies. Some noise from company pages and job listings (3 results). Top matches show clear VP titles with startup experience. Diversity could be improved - several results from similar company stages.",
  "topMatches": [1, 2, 4, 5, 7, 8, 10]
}
```

### Parsed Result

```typescript
const result = parsePass2Response(llmResponse);
// {
//   score: 72,
//   relevantCount: 7,
//   breakdown: {
//     resultRelevance: 38,
//     qualitySignal: 22,
//     diversity: 12
//   },
//   reasoning: '7 out of 10 results match target persona...',
//   topMatches: [1, 2, 4, 5, 7, 8, 10]
// }

if (result.score >= 60) {
  console.log('Query passed Pass 2! Executing full query.');
}
```

---

## Composite Score Calculation

### Input

```typescript
const pass1Score = 78;  // From Pass 1 evaluation
const pass2Score = 72;  // From Pass 2 evaluation

const compositeScore = calculateCompositeScore(pass1Score, pass2Score);
```

### Output

```typescript
// Using default weights: 30% Pass 1, 70% Pass 2
// compositeScore = (78 * 0.3) + (72 * 0.7) = 23.4 + 50.4 = 73.8

console.log(compositeScore); // 73.8
```

### Custom Weights

```typescript
const compositeScore = calculateCompositeScore(
  78,
  72,
  { pass1: 0.4, pass2: 0.6 } // 40% prediction, 60% reality
);

// compositeScore = (78 * 0.4) + (72 * 0.6) = 31.2 + 43.2 = 74.4
console.log(compositeScore); // 74.4
```

---

## Top Queries Selection

### Input

```typescript
const allQueries = [
  {
    query: 'site:linkedin.com/in/ "CTO" fintech blockchain',
    pass1Score: 82,
    pass2Score: 76,
    compositeScore: 77.8,
    // ... other fields
  },
  {
    query: 'site:linkedin.com/in/ "VP Engineering" startup',
    pass1Score: 78,
    pass2Score: 72,
    compositeScore: 73.8,
    // ... other fields
  },
  {
    query: 'site:linkedin.com/in/ "Head of Engineering" SaaS',
    pass1Score: 75,
    pass2Score: 80,
    compositeScore: 78.5,
    // ... other fields
  },
  {
    query: 'site:linkedin.com/in/ CTO (Y Combinator OR a16z)',
    pass1Score: 88,
    pass2Score: 85,
    compositeScore: 85.9,
    // ... other fields
  },
  {
    query: 'site:linkedin.com/in/ "Director of Engineering" ML',
    pass1Score: 70,
    pass2Score: 68,
    compositeScore: 68.6,
    // ... other fields
  },
];

const topQueries = selectTopQueriesForContext(allQueries, 3);
```

### Output

```typescript
// Sorted by composite score descending, top 3 selected
[
  {
    query: 'site:linkedin.com/in/ CTO (Y Combinator OR a16z)',
    compositeScore: 85.9,
    pass1Score: 88,
    pass2Score: 85
  },
  {
    query: 'site:linkedin.com/in/ "Head of Engineering" SaaS',
    compositeScore: 78.5,
    pass1Score: 75,
    pass2Score: 80
  },
  {
    query: 'site:linkedin.com/in/ "CTO" fintech blockchain',
    compositeScore: 77.8,
    pass1Score: 82,
    pass2Score: 76
  }
]
```

### Usage in Next Iteration

```typescript
// Feed top performers back to LLM for learning
const nextGenPrompt = buildQueryGenerationPrompt(
  persona,
  seedQuery,
  topQueries,  // LLM will see these high-scoring examples
  { maxQueries: 10 }
);

// LLM will receive context like:
// "## Top Performing Queries from Previous Iterations
//  1. "site:linkedin.com/in/ CTO (Y Combinator OR a16z)"
//     - Composite Score: 85.90
//     - Pass 1: 88.00
//     - Pass 2: 85.00
//  ..."
```

---

## Error Handling Examples

### Malformed Pass 1 Response

```typescript
const malformedJSON = 'This is not JSON { score: "invalid" }';

const result = parsePass1Response(malformedJSON);

// Returns default low score instead of throwing
// {
//   score: 20,
//   breakdown: {
//     expectedYield: 8,
//     personaRelevance: 7,
//     queryUniqueness: 5
//   },
//   reasoning: 'Failed to parse LLM response. Default low score assigned.'
// }

console.error('Parse failed, but function returned gracefully');
```

### Invalid Query Generation Response

```typescript
const badResponse = '{ "queries": "not an array" }';

const queries = parseGeneratedQueries(badResponse);

// Returns empty array instead of throwing
console.log(queries); // []
console.log('No valid queries parsed, continuing with fallback');
```

### Score Out of Range

```typescript
const responseWithBadScores = JSON.stringify({
  score: 150,  // Invalid: > 100
  breakdown: {
    expectedYield: 50,  // Invalid: > 40
    personaRelevance: 30,
    queryUniqueness: 20
  },
  reasoning: 'Test'
});

const result = parsePass1Response(responseWithBadScores);

// Score is clamped to valid range
console.log(result.score); // 100 (clamped from 150)
// Console warning: "Pass 1 score out of range: 150"
// Console warning: "Pass 1 breakdown scores out of expected ranges"
```

---

## Full Workflow Example

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
  type SearchPersona,
} from '@/lib/agent';

async function agenticQueryRound(
  persona: SearchPersona,
  seedQuery: string,
  previousTopQueries: any[] = []
) {
  console.log('=== Round Start ===');

  // Step 1: Generate queries
  const genPrompt = buildQueryGenerationPrompt(persona, seedQuery, previousTopQueries);
  const genResponse = await callLLM(genPrompt);
  const queries = parseGeneratedQueries(genResponse);
  console.log(`Generated ${queries.length} queries`);

  // Step 2: Pass 1 scoring (parallel)
  const pass1Results = await Promise.all(
    queries.map(async (q) => {
      const p1Prompt = buildPass1ScoringPrompt(q.query, persona, 'Master context');
      const p1Response = await callLLM(p1Prompt);
      const p1Result = parsePass1Response(p1Response);
      return { ...q, pass1: p1Result };
    })
  );

  // Filter: Only proceed with queries scoring >= 60 in Pass 1
  const pass1Passed = pass1Results.filter(q => q.pass1.score >= 60);
  console.log(`Pass 1: ${pass1Passed.length}/${queries.length} queries passed`);

  // Step 3: Execute queries and Pass 2 scoring
  const pass2Results = await Promise.all(
    pass1Passed.map(async (q) => {
      const searchResults = await executeLinkedInQuery(q.query);
      const sampleResults = searchResults.slice(0, 10);

      const p2Prompt = buildPass2ScoringPrompt(q.query, sampleResults, persona);
      const p2Response = await callLLM(p2Prompt);
      const p2Result = parsePass2Response(p2Response);

      const compositeScore = calculateCompositeScore(q.pass1.score, p2Result.score);

      return {
        ...q,
        pass2: p2Result,
        compositeScore,
        results: searchResults
      };
    })
  );

  // Filter: Only keep queries scoring >= 60 in Pass 2
  const pass2Passed = pass2Results.filter(q => q.pass2.score >= 60);
  console.log(`Pass 2: ${pass2Passed.length}/${pass1Passed.length} queries passed`);

  // Step 4: Select top queries for next round
  const topQueries = selectTopQueriesForContext(pass2Passed, 5);
  console.log(`Top 5 queries for next round:`, topQueries);

  return {
    allResults: pass2Passed,
    topQueries,
    stats: {
      generated: queries.length,
      pass1Passed: pass1Passed.length,
      pass2Passed: pass2Passed.length,
    }
  };
}

// Run multiple rounds
const persona = { /* ... */ };
const seedQuery = 'site:linkedin.com/in/ "CTO" fintech';

let topQueries = [];
for (let round = 1; round <= 3; round++) {
  console.log(`\n### Round ${round} ###`);
  const result = await agenticQueryRound(persona, seedQuery, topQueries);
  topQueries = result.topQueries;
}
```

### Expected Console Output

```
=== Round Start ===
Generated 10 queries
Pass 1: 7/10 queries passed
Pass 2: 5/7 queries passed
Top 5 queries for next round: [...]

### Round 2 ###
=== Round Start ===
Generated 10 queries
Pass 1: 8/10 queries passed
Pass 2: 6/8 queries passed
Top 5 queries for next round: [...]

### Round 3 ###
=== Round Start ===
Generated 10 queries
Pass 1: 9/10 queries passed
Pass 2: 7/9 queries passed
Top 5 queries for next round: [...]
```
