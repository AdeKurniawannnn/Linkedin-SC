/**
 * Prompt template functions for Agentic Query Builder
 */

import type { SearchPersona, QueryContext, SampleResult, QueryBudget } from './types';

/**
 * Build prompt for generating LinkedIn search queries
 *
 * @param persona - Target persona definition
 * @param seedQuery - Initial example query
 * @param previousQueries - Top-performing queries from previous iterations (optional)
 * @param budget - Query generation budget (optional)
 * @returns System prompt for LLM query generation
 */
export function buildQueryGenerationPrompt(
  persona: SearchPersona,
  seedQuery: string,
  previousQueries?: QueryContext[],
  budget?: QueryBudget
): string {
  const maxQueries = budget?.maxQueries || 10;

  let prompt = `You are an expert at crafting LinkedIn SERP queries to find specific professional personas.

## Target Persona
- Job Titles: ${persona.jobTitles.join(', ')}
- Seniority Levels: ${persona.seniorityLevels.join(', ')}
- Industries: ${persona.industries.join(', ')}`;

  if (persona.companyTypes && persona.companyTypes.length > 0) {
    prompt += `\n- Company Types: ${persona.companyTypes.join(', ')}`;
  }

  if (persona.locations && persona.locations.length > 0) {
    prompt += `\n- Locations: ${persona.locations.join(', ')}`;
  }

  if (persona.keywords && persona.keywords.length > 0) {
    prompt += `\n- Keywords: ${persona.keywords.join(', ')}`;
  }

  prompt += `\n\n## Seed Query Example
"${seedQuery}"

## Instructions
Generate ${maxQueries} diverse LinkedIn search queries using the following techniques:

1. **Use site:linkedin.com/in/** for targeting LinkedIn profiles
2. **Boolean operators**:
   - AND (implicit or explicit) to combine terms
   - OR to provide alternatives
   - "-" (minus) to exclude terms
   - Quotes for exact phrases
3. **Vary specificity**:
   - Some queries broad (catch more results)
   - Some queries narrow (high precision)
   - Some queries medium (balanced)
4. **Creative approaches**:
   - Target skills and certifications
   - Target education and degrees
   - Target company names and industries
   - Target job transitions and career patterns
   - Combine seniority with technical terms
   - Use location-specific queries`;

  if (previousQueries && previousQueries.length > 0) {
    prompt += `\n\n## Top Performing Queries from Previous Iterations
These queries scored well. Learn from them but generate NEW variations:

`;
    previousQueries.forEach((ctx, idx) => {
      prompt += `${idx + 1}. "${ctx.query}"
   - Composite Score: ${ctx.compositeScore?.toFixed(2) ?? 'N/A'}
   - Pass 1 (Pre-execution): ${ctx.pass1Score?.toFixed(2) ?? 'N/A'}
   - Pass 2 (Post-execution): ${ctx.pass2Score?.toFixed(2) ?? 'N/A'}

`;
    });

    prompt += `Generate queries that improve on these patterns while exploring new approaches.`;
  }

  prompt += `\n\n## Output Format
Return a JSON array with this exact structure:

\`\`\`json
[
  {
    "query": "site:linkedin.com/in/ (\"Chief Technology Officer\" OR \"VP Engineering\") fintech blockchain",
    "reasoning": "Targets senior technical leaders in fintech with blockchain expertise"
  },
  {
    "query": "site:linkedin.com/in/ \"Head of Data Science\" (startup OR \"series A\") -recruiter",
    "reasoning": "Focuses on data science leaders in early-stage companies, excluding recruiters"
  }
]
\`\`\`

Generate exactly ${maxQueries} unique queries. Each must:
- Use site:linkedin.com/in/
- Align with the target persona
- Employ varied Boolean operator strategies
- Explore different angles and specificity levels
- Include brief reasoning explaining the approach

Return ONLY the JSON array, no additional text.`;

  return prompt;
}

/**
 * Build prompt for Pass 1 scoring (pre-execution evaluation)
 *
 * @param query - Query to evaluate
 * @param persona - Target persona
 * @param masterPrompt - Original master prompt/context
 * @returns System prompt for Pass 1 scoring
 */
export function buildPass1ScoringPrompt(
  query: string,
  persona: SearchPersona,
  masterPrompt: string
): string {
  return `You are an expert at evaluating LinkedIn search query quality BEFORE execution.

## Query to Evaluate
"${query}"

## Target Persona
- Job Titles: ${persona.jobTitles.join(', ')}
- Seniority Levels: ${persona.seniorityLevels.join(', ')}
- Industries: ${persona.industries.join(', ')}
${persona.companyTypes?.length ? `- Company Types: ${persona.companyTypes.join(', ')}` : ''}
${persona.locations?.length ? `- Locations: ${persona.locations.join(', ')}` : ''}

## Master Context
${masterPrompt}

## Scoring Criteria (Total: 100 points)

### 1. Expected Yield (0-40 points)
Evaluate the query's potential to return quality results:
- Boolean operator effectiveness (10 points)
  - Strong use of AND/OR/-/quotes for precision
- Query breadth (15 points)
  - Not too broad (millions of results)
  - Not too narrow (zero results)
  - Goldilocks zone for discovery
- Technical quality (15 points)
  - Proper syntax
  - Logical operator combinations
  - No contradictions

### 2. Persona Relevance (0-35 points)
How well does this query target the persona?
- Seniority match (12 points)
  - Query targets appropriate seniority levels
- Job function alignment (12 points)
  - Query captures relevant roles/titles
- Industry focus (11 points)
  - Query incorporates industry-specific terms

### 3. Query Uniqueness (0-25 points)
Creativity and non-obvious approaches:
- Novel angle (10 points)
  - Uses creative keyword combinations
  - Explores uncommon search paths
- Keyword diversity (8 points)
  - Varies from typical searches
  - Incorporates synonyms or related terms
- Strategic exclusions (7 points)
  - Thoughtful use of "-" operator to filter noise

## Output Format
Return a JSON object with this exact structure:

\`\`\`json
{
  "score": 82,
  "breakdown": {
    "expectedYield": 35,
    "personaRelevance": 30,
    "queryUniqueness": 17
  },
  "reasoning": "Strong use of Boolean operators targeting senior fintech leaders. Excludes recruiters effectively. Slightly narrow on industry terms but good seniority alignment."
}
\`\`\`

Provide honest, critical evaluation. Score conservatively. Return ONLY the JSON object, no additional text.`;
}

/**
 * Build prompt for Pass 2 scoring (post-execution evaluation)
 *
 * @param query - Query that was executed
 * @param results - Sample of actual SERP results (typically top 10)
 * @param persona - Target persona
 * @returns System prompt for Pass 2 scoring
 */
export function buildPass2ScoringPrompt(
  query: string,
  results: SampleResult[],
  persona: SearchPersona
): string {
  const resultsText = results.map((r, idx) =>
    `${idx + 1}. [${r.type}] ${r.title}\n   ${r.description}`
  ).join('\n\n');

  return `You are an expert at evaluating LinkedIn SERP results quality.

## Query Executed
"${query}"

## Target Persona
- Job Titles: ${persona.jobTitles.join(', ')}
- Seniority Levels: ${persona.seniorityLevels.join(', ')}
- Industries: ${persona.industries.join(', ')}
${persona.companyTypes?.length ? `- Company Types: ${persona.companyTypes.join(', ')}` : ''}
${persona.locations?.length ? `- Locations: ${persona.locations.join(', ')}` : ''}

## Actual SERP Results (Sample of ${results.length})

${resultsText}

## Scoring Criteria (Total: 100 points)

### 1. Result Relevance (0-50 points)
How many results match the target persona?
- Profile match count (30 points)
  - Count results that are [profile] type AND match persona
  - 0 matches = 0 points
  - 1-2 matches = 10 points
  - 3-5 matches = 20 points
  - 6-8 matches = 25 points
  - 9-10 matches = 30 points
- Title/description alignment (20 points)
  - Job titles match target roles
  - Descriptions indicate relevant experience

### 2. Quality Signal (0-30 points)
Indicators of high-quality leads:
- Seniority indicators (15 points)
  - Leadership titles (VP, Director, Head, Chief, etc.)
  - Management experience mentioned
- Company quality (15 points)
  - Recognizable companies
  - Target industries represented
  - Appropriate company size/type

### 3. Diversity (0-20 points)
Variety in the result set:
- Company diversity (10 points)
  - Multiple different companies represented
  - Not dominated by single employer
- Role diversity (10 points)
  - Variety of relevant job functions
  - Different career paths represented

## Output Format
Return a JSON object with this exact structure:

\`\`\`json
{
  "score": 76,
  "relevantCount": 7,
  "breakdown": {
    "resultRelevance": 38,
    "qualitySignal": 24,
    "diversity": 14
  },
  "reasoning": "7 out of 10 results match persona. Strong seniority signals with multiple C-level and VP titles. Good company diversity across fintech and enterprise. Some noise from recruiters.",
  "topMatches": [1, 2, 4, 5, 7, 8, 10]
}
\`\`\`

The "topMatches" array should contain the 1-based indices of results that best match the persona.

Provide honest evaluation. Score based on actual result quality. Return ONLY the JSON object, no additional text.`;
}
