/**
 * Scoring utilities for Agentic Query Builder
 */

import type {
  Pass1ScoreResult,
  Pass2ScoreResult,
  GeneratedQuery,
  QueryContext,
  ScoreWeights,
} from './types';

/**
 * Default weights for composite score calculation
 */
const DEFAULT_WEIGHTS: ScoreWeights = {
  pass1: 0.3, // Pre-execution prediction
  pass2: 0.7, // Post-execution reality
};

/**
 * Calculate composite score from Pass 1 and Pass 2 scores
 *
 * @param pass1Score - Pre-execution evaluation score (0-100)
 * @param pass2Score - Post-execution evaluation score (0-100)
 * @param weights - Optional custom weights (default: pass1=0.3, pass2=0.7)
 * @returns Weighted average composite score (0-100)
 */
export function calculateCompositeScore(
  pass1Score: number,
  pass2Score: number,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  // Validate and clamp inputs (don't mutate parameters)
  let clampedPass1 = pass1Score;
  let clampedPass2 = pass2Score;

  if (pass1Score < 0 || pass1Score > 100) {
    console.warn(`Invalid pass1Score: ${pass1Score}. Clamping to 0-100 range.`);
    clampedPass1 = Math.max(0, Math.min(100, pass1Score));
  }
  if (pass2Score < 0 || pass2Score > 100) {
    console.warn(`Invalid pass2Score: ${pass2Score}. Clamping to 0-100 range.`);
    clampedPass2 = Math.max(0, Math.min(100, pass2Score));
  }

  // Validate weights sum to 1.0 (create new object, don't mutate)
  let normalizedWeights = weights;
  const weightSum = weights.pass1 + weights.pass2;
  if (Math.abs(weightSum - 1.0) > 0.001) {
    console.warn(`Weights sum to ${weightSum}, not 1.0. Normalizing weights.`);
    normalizedWeights = {
      pass1: weights.pass1 / weightSum,
      pass2: weights.pass2 / weightSum,
    };
  }

  return clampedPass1 * normalizedWeights.pass1 + clampedPass2 * normalizedWeights.pass2;
}

/**
 * Safely parse JSON with fallback for malformed responses
 * Handles LLM responses with unescaped quotes in string values
 *
 * @param jsonText - Raw JSON string (after markdown extraction)
 * @returns Parsed object or null on failure
 */
function safeJsonParse(jsonText: string): unknown | null {
  // First attempt: direct parse
  try {
    return JSON.parse(jsonText);
  } catch {
    // Continue to fallback attempts
  }

  // Second attempt: fix common quote issues in string values
  try {
    // Process line by line to fix unescaped quotes
    const lines = jsonText.split('\n');
    const fixedLines = lines.map(line => {
      // Match lines with string values (key: "value" pattern)
      const stringValueMatch = line.match(/^(\s*"[^"]+"\s*:\s*")(.*)(",?\s*)$/);
      if (stringValueMatch) {
        const [, prefix, value, suffix] = stringValueMatch;
        // Escape unescaped quotes (not preceded by backslash)
        const fixedValue = value.replace(/(?<!\\)"/g, '\\"');
        return prefix + fixedValue + suffix;
      }
      return line;
    });
    return JSON.parse(fixedLines.join('\n'));
  } catch {
    // Continue to next fallback
  }

  // Third attempt: more aggressive fix for quotes in parentheses
  try {
    let fixed = jsonText;
    // Fix pattern: ("word" -> (\"word\"
    fixed = fixed.replace(/\("([^"\\]*)"/g, '(\\"$1\\"');
    // Fix pattern: "word") -> \"word\")
    fixed = fixed.replace(/"([^"\\]*)"\)/g, '\\"$1\\")');
    return JSON.parse(fixed);
  } catch {
    return null;
  }
}

/**
 * Parse Pass 1 scoring response from LLM
 *
 * @param llmResponse - Raw LLM response string
 * @returns Parsed Pass1ScoreResult or default low score on error
 */
export function parsePass1Response(llmResponse: string): Pass1ScoreResult {
  try {
    // Extract JSON from markdown code blocks if present
    let jsonText = llmResponse.trim();

    // Remove markdown code blocks
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Parse JSON with fallback handling
    const rawParsed = safeJsonParse(jsonText);
    if (!rawParsed || typeof rawParsed !== 'object') {
      throw new Error('Failed to parse JSON after all attempts');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = rawParsed as any;

    // Validate structure
    if (
      typeof parsed.score !== 'number' ||
      !parsed.breakdown ||
      typeof parsed.breakdown.expectedYield !== 'number' ||
      typeof parsed.breakdown.personaRelevance !== 'number' ||
      typeof parsed.breakdown.queryUniqueness !== 'number' ||
      typeof parsed.reasoning !== 'string'
    ) {
      throw new Error('Invalid Pass1ScoreResult structure');
    }

    // Validate score ranges
    const breakdown = parsed.breakdown;
    if (
      breakdown.expectedYield < 0 || breakdown.expectedYield > 40 ||
      breakdown.personaRelevance < 0 || breakdown.personaRelevance > 35 ||
      breakdown.queryUniqueness < 0 || breakdown.queryUniqueness > 25
    ) {
      console.warn('Pass 1 breakdown scores out of expected ranges');
    }

    if (parsed.score < 0 || parsed.score > 100) {
      console.warn(`Pass 1 score out of range: ${parsed.score}`);
      parsed.score = Math.max(0, Math.min(100, parsed.score));
    }

    return parsed as Pass1ScoreResult;
  } catch (error) {
    console.error('Failed to parse Pass 1 response:', error);
    console.error('Raw response:', llmResponse);

    // Return default low score on parse failure
    return {
      score: 20,
      breakdown: {
        expectedYield: 8,
        personaRelevance: 7,
        queryUniqueness: 5,
      },
      reasoning: 'Failed to parse LLM response. Default low score assigned.',
    };
  }
}

/**
 * Parse Pass 2 scoring response from LLM
 *
 * @param llmResponse - Raw LLM response string
 * @returns Parsed Pass2ScoreResult or default low score on error
 */
export function parsePass2Response(llmResponse: string): Pass2ScoreResult {
  try {
    // Extract JSON from markdown code blocks if present
    let jsonText = llmResponse.trim();

    // Remove markdown code blocks
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // Parse JSON with fallback handling
    const rawParsed = safeJsonParse(jsonText);
    if (!rawParsed || typeof rawParsed !== 'object') {
      throw new Error('Failed to parse JSON after all attempts');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = rawParsed as any;

    // Validate structure
    if (
      typeof parsed.score !== 'number' ||
      typeof parsed.relevantCount !== 'number' ||
      !parsed.breakdown ||
      typeof parsed.breakdown.resultRelevance !== 'number' ||
      typeof parsed.breakdown.qualitySignal !== 'number' ||
      typeof parsed.breakdown.diversity !== 'number' ||
      typeof parsed.reasoning !== 'string' ||
      !Array.isArray(parsed.topMatches)
    ) {
      throw new Error('Invalid Pass2ScoreResult structure');
    }

    // Validate score ranges
    const breakdown = parsed.breakdown;
    if (
      breakdown.resultRelevance < 0 || breakdown.resultRelevance > 50 ||
      breakdown.qualitySignal < 0 || breakdown.qualitySignal > 30 ||
      breakdown.diversity < 0 || breakdown.diversity > 20
    ) {
      console.warn('Pass 2 breakdown scores out of expected ranges');
    }

    if (parsed.score < 0 || parsed.score > 100) {
      console.warn(`Pass 2 score out of range: ${parsed.score}`);
      parsed.score = Math.max(0, Math.min(100, parsed.score));
    }

    return parsed as Pass2ScoreResult;
  } catch (error) {
    console.error('Failed to parse Pass 2 response:', error);
    console.error('Raw response:', llmResponse);

    // Return default low score on parse failure
    return {
      score: 15,
      relevantCount: 0,
      breakdown: {
        resultRelevance: 5,
        qualitySignal: 5,
        diversity: 5,
      },
      reasoning: 'Failed to parse LLM response. Default low score assigned.',
      topMatches: [],
    };
  }
}

/**
 * Attempt to fix malformed JSON with unescaped quotes in string values
 * This handles LLM responses that contain queries like:
 * "query": "site:linkedin.com/in/ ("Chief Technology Officer" OR "VP")"
 *
 * @param jsonText - Potentially malformed JSON string
 * @returns Fixed JSON string
 */
function fixMalformedJsonQuotes(jsonText: string): string {
  // Strategy: Parse line by line and fix quote issues within JSON string values
  // This regex matches the pattern: "key": "value with ("nested" quotes)"
  // We need to escape the inner quotes that break JSON

  // First, try to fix the most common pattern: unescaped quotes after ( and before )
  // Pattern: ("word" becomes (\"word\"
  let fixed = jsonText;

  // Replace unescaped quotes within parentheses in string values
  // Match pattern: "query": "...("Word")..." and escape the inner quotes
  fixed = fixed.replace(
    /("query"\s*:\s*")([^"]*?)(\(")/g,
    (match, prefix, content, paren) => {
      return prefix + content + '(\\"';
    }
  );

  // Fix closing pattern: ")" within strings
  fixed = fixed.replace(
    /("\))([^"]*?")/g,
    (match, closeParen, suffix) => {
      return '\\")"' + suffix.slice(1);
    }
  );

  // More comprehensive fix: process each line and fix quotes in query/reasoning values
  const lines = fixed.split('\n');
  const fixedLines = lines.map(line => {
    // Check if this line has a JSON string value
    const keyValueMatch = line.match(/^(\s*"(?:query|reasoning)"\s*:\s*")(.*)(",?\s*)$/);
    if (keyValueMatch) {
      const [, prefix, value, suffix] = keyValueMatch;
      // Escape unescaped quotes in the value (but not already escaped ones)
      // This regex finds quotes that aren't preceded by a backslash
      const fixedValue = value.replace(/(?<!\\)"/g, '\\"');
      return prefix + fixedValue + suffix;
    }
    return line;
  });

  return fixedLines.join('\n');
}

/**
 * Extract queries using regex when JSON parsing fails completely
 * This is a last-resort fallback for severely malformed JSON
 *
 * @param text - Raw text that failed JSON parsing
 * @returns Array of extracted query objects
 */
function extractQueriesWithRegex(text: string): Array<{ query: string; reasoning: string }> {
  const queries: Array<{ query: string; reasoning: string }> = [];
  const seenQueries = new Set<string>();

  // Pattern to match query and reasoning pairs
  // Handles: "query": "...", "reasoning": "..."
  // Uses a more permissive pattern that captures content between key markers
  const queryPattern = /"query"\s*:\s*"([^"]*(?:"[^"]*)*?)"\s*,\s*"reasoning"\s*:\s*"([^"]*(?:"[^"]*)*?)"/g;

  // Alternative pattern: match each object block
  const objectPattern = /\{\s*"query"\s*:\s*"([\s\S]*?)"\s*,\s*"reasoning"\s*:\s*"([\s\S]*?)"\s*\}/g;

  let match: RegExpExecArray | null;

  // Try object pattern first (more reliable for complete objects)
  while ((match = objectPattern.exec(text)) !== null) {
    const query = match[1]
      .replace(/\\"/g, '"')  // Unescape quotes
      .replace(/\\n/g, ' ')  // Replace newlines with spaces
      .trim();
    const reasoning = match[2]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, ' ')
      .trim();

    if (query && reasoning) {
      const normalizedQuery = query.toLowerCase();
      if (!seenQueries.has(normalizedQuery)) {
        seenQueries.add(normalizedQuery);
        queries.push({ query, reasoning });
      }
    }
  }

  // If we got results, return them
  if (queries.length > 0) {
    console.log(`Regex extraction recovered ${queries.length} queries`);
    return queries;
  }

  // Try alternative simpler extraction: split by }, {
  const blocks = text.split(/\},?\s*\{/);
  for (const block of blocks) {
    const queryMatch = block.match(/"query"\s*:\s*"([^}]+?)(?:",|"\s*,)/);
    const reasoningMatch = block.match(/"reasoning"\s*:\s*"([^}]+?)(?:"|"\s*})/);

    if (queryMatch && reasoningMatch) {
      const query = queryMatch[1].replace(/\\"/g, '"').trim();
      const reasoning = reasoningMatch[1].replace(/\\"/g, '"').trim();

      if (query && reasoning) {
        const normalizedQuery = query.toLowerCase();
        if (!seenQueries.has(normalizedQuery)) {
          seenQueries.add(normalizedQuery);
          queries.push({ query, reasoning });
        }
      }
    }
  }

  console.log(`Fallback extraction recovered ${queries.length} queries`);
  return queries;
}

/**
 * Parse generated queries from LLM response
 *
 * @param llmResponse - Raw LLM response string
 * @returns Array of parsed GeneratedQuery objects (empty array on error)
 */
export function parseGeneratedQueries(llmResponse: string): Array<{ query: string; reasoning: string }> {
  try {
    // Extract JSON from markdown code blocks if present
    let jsonText = llmResponse.trim();

    // Remove markdown code blocks
    const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
    }

    // First attempt: try direct parse
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      // Second attempt: try to fix malformed JSON with unescaped quotes
      console.warn('Initial JSON parse failed, attempting to fix malformed quotes...');
      const fixedJson = fixMalformedJsonQuotes(jsonText);
      try {
        parsed = JSON.parse(fixedJson);
      } catch {
        // Third attempt: extract queries using regex pattern matching
        console.warn('Fixed JSON parse failed, falling back to regex extraction...');
        return extractQueriesWithRegex(jsonText);
      }
    }

    // Validate it's an array
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Filter and validate entries
    const validQueries: Array<{ query: string; reasoning: string }> = [];
    const seenQueries = new Set<string>();

    for (const item of parsed) {
      // Validate structure
      if (
        typeof item.query !== 'string' ||
        typeof item.reasoning !== 'string' ||
        !item.query.trim() ||
        !item.reasoning.trim()
      ) {
        console.warn('Skipping invalid query entry:', item);
        continue;
      }

      const normalizedQuery = item.query.trim().toLowerCase();

      // Deduplicate
      if (seenQueries.has(normalizedQuery)) {
        console.warn('Skipping duplicate query:', item.query);
        continue;
      }

      seenQueries.add(normalizedQuery);
      validQueries.push({
        query: item.query.trim(),
        reasoning: item.reasoning.trim(),
      });
    }

    return validQueries;
  } catch (error) {
    console.error('Failed to parse generated queries:', error);
    console.error('Raw response:', llmResponse);
    return [];
  }
}

/**
 * Select top N queries for context in next iteration
 *
 * @param queries - Array of queries with composite scores
 * @param limit - Maximum number of queries to return
 * @returns Top N queries sorted by composite score descending
 */
export function selectTopQueriesForContext(
  queries: GeneratedQuery[],
  limit: number
): QueryContext[] {
  // Filter queries that have all required scores
  const scoredQueries = queries.filter(
    q =>
      q.compositeScore !== undefined &&
      q.pass1Score !== undefined &&
      q.pass2Score !== undefined
  );

  // Sort by composite score descending
  const sorted = [...scoredQueries].sort(
    (a, b) => (b.compositeScore || 0) - (a.compositeScore || 0)
  );

  // Take top N
  const topN = sorted.slice(0, limit);

  // Map to QueryContext
  return topN.map(q => ({
    query: q.query,
    compositeScore: q.compositeScore,
    pass1Score: q.pass1Score,
    pass2Score: q.pass2Score,
  }));
}
