/**
 * Agent Configuration Defaults
 *
 * Default configuration values for the Agentic Query Builder system.
 * These values control pipeline behavior, scoring thresholds, and resource limits.
 */

/**
 * Default configuration for agent sessions
 */
export const AGENT_DEFAULTS = {
  /** Minimum Pass 1 score to proceed to Pass 2 (0-100) */
  pass1Threshold: 70,

  /** Minimum Pass 2 score to execute query (0-100) */
  pass2Threshold: 60,

  /** Number of queries to generate per round */
  queryBudgetPerRound: 10,

  /** Maximum parallel operations (scoring, validation, execution) */
  concurrencyLimit: 5,

  /** Maximum results to fetch per query execution */
  maxResultsPerQuery: 100,

  /** Number of sample results to fetch for Pass 2 validation */
  pass2SampleSize: 10,

  /** Maximum number of queries to send as context to LLM */
  contextQueryLimit: 20,

  /** Weights for composite score calculation */
  compositeScoreWeights: {
    pass1: 0.3,  // 30% weight for Pass 1 score
    pass2: 0.7,  // 70% weight for Pass 2 score (actual results matter more)
  },
} as const;

/**
 * Default master prompt for LLM scoring
 *
 * This prompt defines the scoring criteria for both Pass 1 and Pass 2.
 * It should be specific, measurable, and aligned with the target persona.
 */
export const DEFAULT_SCORING_MASTER_PROMPT = `
You are an expert LinkedIn search strategist specializing in targeted lead generation.

Your task is to evaluate LinkedIn search queries based on their potential to find high-quality leads matching the target persona.

# Scoring Criteria

## Pass 1 (Pre-Execution Scoring - 0-100 points)
Evaluate the query BEFORE execution based on:

1. **Expected Yield (0-100)**: How many relevant results do you expect?
   - 90-100: Likely to return 50+ highly relevant results
   - 70-89: Likely to return 20-50 relevant results
   - 50-69: Likely to return 10-20 relevant results
   - 30-49: Likely to return 5-10 relevant results
   - 0-29: Likely to return fewer than 5 relevant results

2. **Persona Relevance (0-100)**: How well does the query target the persona?
   - 90-100: Perfectly targets persona attributes (title, seniority, industry, location)
   - 70-89: Strongly targets most persona attributes
   - 50-69: Moderately targets some persona attributes
   - 30-49: Weakly targets persona attributes
   - 0-29: Barely or doesn't target persona attributes

3. **Query Uniqueness (0-100)**: How different is this from existing queries?
   - 90-100: Completely novel angle or combination
   - 70-89: Significant variation with new keywords or logic
   - 50-69: Moderate variation with some unique elements
   - 30-49: Minor variation from existing queries
   - 0-29: Very similar or duplicate of existing queries

**Pass 1 Total Score**: Average of the three criteria

## Pass 2 (Post-Execution Validation - 0-100 points)
Evaluate ACTUAL results after sampling:

1. **Result Relevance (0-100)**: How many results match the persona?
   - 90-100: 90%+ of sampled results are highly relevant
   - 70-89: 70-89% of sampled results are relevant
   - 50-69: 50-69% of sampled results are relevant
   - 30-49: 30-49% of sampled results are relevant
   - 0-29: Less than 30% of sampled results are relevant

2. **Quality Signals (0-100)**: Do results show decision-maker indicators?
   - 90-100: Strong signals (verified profiles, detailed experience, current roles)
   - 70-89: Good signals (most profiles are complete and current)
   - 50-69: Moderate signals (mix of complete and incomplete profiles)
   - 30-49: Weak signals (many incomplete or outdated profiles)
   - 0-29: Very weak signals (mostly low-quality or irrelevant profiles)

3. **Diversity (0-100)**: How diverse are the results?
   - 90-100: Highly diverse (different companies, roles, backgrounds)
   - 70-89: Good diversity (reasonable spread across companies/roles)
   - 50-69: Moderate diversity (some clustering but acceptable)
   - 30-49: Low diversity (significant clustering)
   - 0-29: Very low diversity (almost all from same company/role)

**Pass 2 Total Score**: Average of the three criteria

# Output Format

For Pass 1, provide:
{
  "score": <total_score>,
  "breakdown": {
    "expectedYield": <0-100>,
    "personaRelevance": <0-100>,
    "queryUniqueness": <0-100>
  },
  "reasoning": "<concise explanation of scores>"
}

For Pass 2, provide:
{
  "score": <total_score>,
  "relevantCount": <number_of_relevant_results>,
  "breakdown": {
    "resultRelevance": <0-100>,
    "qualitySignal": <0-100>,
    "diversity": <0-100>
  },
  "reasoning": "<concise explanation of scores>",
  "topMatches": [
    {
      "url": "<result_url>",
      "title": "<result_title>",
      "description": "<result_description>",
      "relevanceReason": "<why this result is relevant>"
    }
  ]
}

# Guidelines

- Be strict but fair in scoring
- Prioritize quality over quantity
- Consider the persona context carefully
- Penalize duplicate or near-duplicate queries
- Reward creative query construction
- Consider LinkedIn search mechanics (Boolean operators, exact matches, exclusions)
- Focus on decision-makers and relevant seniority levels
- Validate actual result quality in Pass 2, not just volume
`.trim();

/**
 * Default persona template for new sessions
 */
export const DEFAULT_PERSONA_TEMPLATE = `
Target Persona:
- Job Titles: [e.g., "CEO", "Founder", "VP Engineering"]
- Seniority: [e.g., "C-Level", "VP/Director", "Senior"]
- Industries: [e.g., "Technology", "SaaS", "Fintech"]
- Company Size: [e.g., "Startup (1-50)", "Scale-up (50-200)", "Enterprise (200+)"]
- Location: [e.g., "Indonesia", "Singapore", "Southeast Asia"]
- Additional Context: [e.g., "Active on LinkedIn", "Decision-makers", "B2B focused"]
`.trim();

/**
 * Default seed query template
 */
export const DEFAULT_SEED_QUERY_TEMPLATE = `site:linkedin.com/in/ Indonesia ("CEO" OR "Founder" OR "CTO")`;

/**
 * Pipeline stage descriptions for UI
 */
export const PIPELINE_STAGE_LABELS = {
  idle: "Ready to Start",
  generating: "Generating Queries",
  pass1: "Pass 1: Scoring Potential",
  pass2: "Pass 2: Validating Results",
  executing: "Executing Queries",
  complete: "Complete",
} as const;

/**
 * Query status labels for UI
 */
export const QUERY_STATUS_LABELS = {
  GENERATED: "Generated",
  PASS1_PENDING: "Awaiting Pass 1",
  PASS1_SCORED: "Pass 1 Scored",
  PASS1_REJECTED: "Rejected (Pass 1)",
  PASS2_PENDING: "Awaiting Pass 2",
  PASS2_VALIDATED: "Pass 2 Validated",
  PASS2_REJECTED: "Rejected (Pass 2)",
  EXECUTING: "Executing",
  DONE: "Complete",
  ERROR: "Error",
} as const;

/**
 * Session status labels for UI
 */
export const SESSION_STATUS_LABELS = {
  idle: "Ready to Start",
  generating: "Generating Queries",
  pass1_scoring: "Scoring Queries",
  pass2_validating: "Validating Results",
  executing: "Executing Queries",
  paused: "Paused",
  completed: "Completed",
  error: "Error",
} as const;

/**
 * Color scheme for status indicators
 */
export const STATUS_COLORS = {
  idle: "gray",
  generating: "blue",
  pass1_scoring: "yellow",
  pass2_validating: "orange",
  executing: "purple",
  paused: "gray",
  completed: "green",
  error: "red",
} as const;

/**
 * Helper to calculate composite score from Pass 1 and Pass 2 scores
 */
export function calculateCompositeScore(
  pass1Score: number,
  pass2Score: number,
  weights = AGENT_DEFAULTS.compositeScoreWeights
): number {
  return Math.round(
    pass1Score * weights.pass1 + pass2Score * weights.pass2
  );
}

/**
 * Helper to determine if query should proceed based on thresholds
 */
export function shouldProceedToPass2(pass1Score: number): boolean {
  return pass1Score >= AGENT_DEFAULTS.pass1Threshold;
}

/**
 * Helper to determine if query should execute based on thresholds
 */
export function shouldExecuteQuery(pass2Score: number): boolean {
  return pass2Score >= AGENT_DEFAULTS.pass2Threshold;
}

/**
 * Helper to format score as percentage string
 */
export function formatScore(score: number): string {
  return `${Math.round(score)}%`;
}

/**
 * Helper to get color for score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  if (score >= 40) return "orange";
  return "red";
}
