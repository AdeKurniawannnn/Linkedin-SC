/**
 * Tests for lib/agent/prompts.ts
 *
 * Tests prompt template building for query generation and scoring
 */

import { describe, it, expect } from 'vitest';
import {
  buildQueryGenerationPrompt,
  buildPass1ScoringPrompt,
  buildPass2ScoringPrompt,
} from '@/lib/agent/prompts';
import type { SearchPersona, QueryContext, SampleResult } from '@/lib/agent/types';

describe('buildQueryGenerationPrompt', () => {
  const basePersona: SearchPersona = {
    jobTitles: ['CTO', 'VP Engineering'],
    seniorityLevels: ['C-Level', 'VP'],
    industries: ['Fintech', 'SaaS'],
  };

  it('should include target persona information', () => {
    const prompt = buildQueryGenerationPrompt(basePersona, 'site:linkedin.com/in/ CTO');

    expect(prompt).toContain('CTO, VP Engineering');
    expect(prompt).toContain('C-Level, VP');
    expect(prompt).toContain('Fintech, SaaS');
  });

  it('should include optional persona fields when provided', () => {
    const personaWithOptionals: SearchPersona = {
      ...basePersona,
      companyTypes: ['Startup', 'Enterprise'],
      locations: ['San Francisco', 'New York'],
      keywords: ['AI', 'Machine Learning'],
    };

    const prompt = buildQueryGenerationPrompt(personaWithOptionals, 'seed query');

    expect(prompt).toContain('Company Types: Startup, Enterprise');
    expect(prompt).toContain('Locations: San Francisco, New York');
    expect(prompt).toContain('Keywords: AI, Machine Learning');
  });

  it('should not include optional fields when not provided', () => {
    const prompt = buildQueryGenerationPrompt(basePersona, 'seed query');

    expect(prompt).not.toContain('Company Types:');
    expect(prompt).not.toContain('Locations:');
    expect(prompt).not.toContain('Keywords:');
  });

  it('should include seed query', () => {
    const seedQuery = 'site:linkedin.com/in/ "Chief Technology Officer" fintech';
    const prompt = buildQueryGenerationPrompt(basePersona, seedQuery);

    expect(prompt).toContain('Seed Query Example');
    expect(prompt).toContain(seedQuery);
  });

  it('should use default budget of 10 queries when not specified', () => {
    const prompt = buildQueryGenerationPrompt(basePersona, 'seed query');

    expect(prompt).toContain('Generate 10 diverse LinkedIn search queries');
    expect(prompt).toContain('Generate exactly 10 unique queries');
  });

  it('should use custom budget when provided', () => {
    const prompt = buildQueryGenerationPrompt(
      basePersona,
      'seed query',
      undefined,
      { maxQueries: 25 }
    );

    expect(prompt).toContain('Generate 25 diverse LinkedIn search queries');
    expect(prompt).toContain('Generate exactly 25 unique queries');
  });

  it('should include previous queries context when provided', () => {
    const previousQueries: QueryContext[] = [
      {
        query: 'site:linkedin.com/in/ "CTO" blockchain',
        compositeScore: 85,
        pass1Score: 80,
        pass2Score: 88,
      },
      {
        query: 'site:linkedin.com/in/ "VP Engineering" startup',
        compositeScore: 78,
        pass1Score: 75,
        pass2Score: 80,
      },
    ];

    const prompt = buildQueryGenerationPrompt(basePersona, 'seed query', previousQueries);

    expect(prompt).toContain('Top Performing Queries from Previous Iterations');
    expect(prompt).toContain('site:linkedin.com/in/ "CTO" blockchain');
    expect(prompt).toContain('Composite Score: 85.00');
    expect(prompt).toContain('Pass 1 (Pre-execution): 80.00');
    expect(prompt).toContain('Pass 2 (Post-execution): 88.00');
    expect(prompt).toContain('site:linkedin.com/in/ "VP Engineering" startup');
  });

  it('should handle undefined scores in previous queries gracefully', () => {
    const previousQueries: QueryContext[] = [
      {
        query: 'test query',
        compositeScore: undefined,
        pass1Score: undefined,
        pass2Score: undefined,
      },
    ];

    const prompt = buildQueryGenerationPrompt(basePersona, 'seed query', previousQueries);

    expect(prompt).toContain('Composite Score: N/A');
    expect(prompt).toContain('Pass 1 (Pre-execution): N/A');
    expect(prompt).toContain('Pass 2 (Post-execution): N/A');
  });

  it('should not include previous queries section when empty', () => {
    const prompt = buildQueryGenerationPrompt(basePersona, 'seed query', []);

    expect(prompt).not.toContain('Top Performing Queries from Previous Iterations');
  });

  it('should include JSON output format instructions', () => {
    const prompt = buildQueryGenerationPrompt(basePersona, 'seed query');

    expect(prompt).toContain('Output Format');
    expect(prompt).toContain('```json');
    expect(prompt).toContain('"query"');
    expect(prompt).toContain('"reasoning"');
    expect(prompt).toContain('Return ONLY the JSON array');
  });

  it('should include query generation instructions', () => {
    const prompt = buildQueryGenerationPrompt(basePersona, 'seed query');

    expect(prompt).toContain('site:linkedin.com/in/');
    expect(prompt).toContain('Boolean operators');
    expect(prompt).toContain('Vary specificity');
    expect(prompt).toContain('Creative approaches');
  });
});

describe('buildPass1ScoringPrompt', () => {
  const basePersona: SearchPersona = {
    jobTitles: ['CTO', 'VP Engineering'],
    seniorityLevels: ['C-Level', 'VP'],
    industries: ['Fintech', 'SaaS'],
  };

  it('should include query to evaluate', () => {
    const query = 'site:linkedin.com/in/ "CTO" fintech blockchain';
    const prompt = buildPass1ScoringPrompt(query, basePersona, 'Find tech leaders');

    expect(prompt).toContain('Query to Evaluate');
    expect(prompt).toContain(query);
  });

  it('should include target persona information', () => {
    const prompt = buildPass1ScoringPrompt('test query', basePersona, 'master prompt');

    expect(prompt).toContain('Target Persona');
    expect(prompt).toContain('CTO, VP Engineering');
    expect(prompt).toContain('C-Level, VP');
    expect(prompt).toContain('Fintech, SaaS');
  });

  it('should include optional persona fields when provided', () => {
    const personaWithOptionals: SearchPersona = {
      ...basePersona,
      companyTypes: ['Startup'],
      locations: ['Bay Area'],
    };

    const prompt = buildPass1ScoringPrompt('test query', personaWithOptionals, 'master prompt');

    expect(prompt).toContain('Company Types: Startup');
    expect(prompt).toContain('Locations: Bay Area');
  });

  it('should include master context', () => {
    const masterPrompt = 'We are looking for senior tech leaders in fintech companies';
    const prompt = buildPass1ScoringPrompt('test query', basePersona, masterPrompt);

    expect(prompt).toContain('Master Context');
    expect(prompt).toContain(masterPrompt);
  });

  it('should include scoring criteria with point breakdowns', () => {
    const prompt = buildPass1ScoringPrompt('test query', basePersona, 'master');

    // Expected Yield (0-40)
    expect(prompt).toContain('Expected Yield (0-40 points)');
    expect(prompt).toContain('Boolean operator effectiveness');
    expect(prompt).toContain('Query breadth');
    expect(prompt).toContain('Technical quality');

    // Persona Relevance (0-35)
    expect(prompt).toContain('Persona Relevance (0-35 points)');
    expect(prompt).toContain('Seniority match');
    expect(prompt).toContain('Job function alignment');
    expect(prompt).toContain('Industry focus');

    // Query Uniqueness (0-25)
    expect(prompt).toContain('Query Uniqueness (0-25 points)');
    expect(prompt).toContain('Novel angle');
    expect(prompt).toContain('Keyword diversity');
    expect(prompt).toContain('Strategic exclusions');
  });

  it('should include JSON output format', () => {
    const prompt = buildPass1ScoringPrompt('test query', basePersona, 'master');

    expect(prompt).toContain('Output Format');
    expect(prompt).toContain('```json');
    expect(prompt).toContain('"score"');
    expect(prompt).toContain('"breakdown"');
    expect(prompt).toContain('"expectedYield"');
    expect(prompt).toContain('"personaRelevance"');
    expect(prompt).toContain('"queryUniqueness"');
    expect(prompt).toContain('"reasoning"');
    expect(prompt).toContain('Return ONLY the JSON object');
  });

  it('should instruct conservative scoring', () => {
    const prompt = buildPass1ScoringPrompt('test query', basePersona, 'master');

    expect(prompt).toContain('Score conservatively');
    expect(prompt).toContain('honest, critical evaluation');
  });
});

describe('buildPass2ScoringPrompt', () => {
  const basePersona: SearchPersona = {
    jobTitles: ['CTO', 'VP Engineering'],
    seniorityLevels: ['C-Level', 'VP'],
    industries: ['Fintech', 'SaaS'],
  };

  const sampleResults: SampleResult[] = [
    {
      title: 'John Smith - CTO at TechCorp',
      description: 'Experienced technology leader with 15 years in fintech...',
      type: 'profile',
    },
    {
      title: 'Jane Doe - VP of Engineering at StartupX',
      description: 'Building world-class engineering teams in SaaS...',
      type: 'profile',
    },
    {
      title: 'Tech Jobs at LinkedIn',
      description: 'Find your next technology role...',
      type: 'jobs',
    },
  ];

  it('should include executed query', () => {
    const query = 'site:linkedin.com/in/ "CTO" fintech';
    const prompt = buildPass2ScoringPrompt(query, sampleResults, basePersona);

    expect(prompt).toContain('Query Executed');
    expect(prompt).toContain(query);
  });

  it('should include target persona', () => {
    const prompt = buildPass2ScoringPrompt('test query', sampleResults, basePersona);

    expect(prompt).toContain('Target Persona');
    expect(prompt).toContain('CTO, VP Engineering');
    expect(prompt).toContain('C-Level, VP');
    expect(prompt).toContain('Fintech, SaaS');
  });

  it('should include SERP results with numbering and types', () => {
    const prompt = buildPass2ScoringPrompt('test query', sampleResults, basePersona);

    expect(prompt).toContain('Actual SERP Results (Sample of 3)');
    expect(prompt).toContain('1. [profile] John Smith - CTO at TechCorp');
    expect(prompt).toContain('2. [profile] Jane Doe - VP of Engineering at StartupX');
    expect(prompt).toContain('3. [jobs] Tech Jobs at LinkedIn');
  });

  it('should include result descriptions', () => {
    const prompt = buildPass2ScoringPrompt('test query', sampleResults, basePersona);

    expect(prompt).toContain('Experienced technology leader with 15 years in fintech');
    expect(prompt).toContain('Building world-class engineering teams in SaaS');
  });

  it('should include scoring criteria with point breakdowns', () => {
    const prompt = buildPass2ScoringPrompt('test query', sampleResults, basePersona);

    // Result Relevance (0-50)
    expect(prompt).toContain('Result Relevance (0-50 points)');
    expect(prompt).toContain('Profile match count');
    expect(prompt).toContain('Title/description alignment');

    // Quality Signal (0-30)
    expect(prompt).toContain('Quality Signal (0-30 points)');
    expect(prompt).toContain('Seniority indicators');
    expect(prompt).toContain('Company quality');

    // Diversity (0-20)
    expect(prompt).toContain('Diversity (0-20 points)');
    expect(prompt).toContain('Company diversity');
    expect(prompt).toContain('Role diversity');
  });

  it('should include JSON output format with topMatches', () => {
    const prompt = buildPass2ScoringPrompt('test query', sampleResults, basePersona);

    expect(prompt).toContain('Output Format');
    expect(prompt).toContain('```json');
    expect(prompt).toContain('"score"');
    expect(prompt).toContain('"relevantCount"');
    expect(prompt).toContain('"breakdown"');
    expect(prompt).toContain('"resultRelevance"');
    expect(prompt).toContain('"qualitySignal"');
    expect(prompt).toContain('"diversity"');
    expect(prompt).toContain('"reasoning"');
    expect(prompt).toContain('"topMatches"');
    expect(prompt).toContain('1-based indices');
  });

  it('should handle empty results array', () => {
    const prompt = buildPass2ScoringPrompt('test query', [], basePersona);

    expect(prompt).toContain('Actual SERP Results (Sample of 0)');
  });

  it('should include optional persona fields when provided', () => {
    const personaWithOptionals: SearchPersona = {
      ...basePersona,
      companyTypes: ['Startup', 'Scale-up'],
      locations: ['San Francisco'],
    };

    const prompt = buildPass2ScoringPrompt('test query', sampleResults, personaWithOptionals);

    expect(prompt).toContain('Company Types: Startup, Scale-up');
    expect(prompt).toContain('Locations: San Francisco');
  });

  it('should not include optional fields when empty', () => {
    const prompt = buildPass2ScoringPrompt('test query', sampleResults, basePersona);

    expect(prompt).not.toContain('Company Types:');
    expect(prompt).not.toContain('Locations:');
  });

  it('should instruct honest evaluation', () => {
    const prompt = buildPass2ScoringPrompt('test query', sampleResults, basePersona);

    expect(prompt).toContain('honest evaluation');
    expect(prompt).toContain('Score based on actual result quality');
  });
});
