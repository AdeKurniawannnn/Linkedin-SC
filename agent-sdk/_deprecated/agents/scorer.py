"""QueryScorer Agent - Scores queries based on multiple criteria.

This agent specializes in evaluating LinkedIn search queries across
multiple dimensions: coverage, precision, relevance, uniqueness, and
executability. It provides detailed feedback for optimization.
"""

import os
from typing import Optional

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from dotenv import load_dotenv

load_dotenv()

# Default configuration for Z.ai GLM-4.7
DEFAULT_MODEL = os.getenv("GLM_MODEL", "GLM-4.7")
DEFAULT_BASE_URL = os.getenv("GLM_BASE_URL", "https://api.z.ai/api/coding/paas/v4")

SCORER_INSTRUCTIONS = """You are an expert LinkedIn query analyst and scorer.

Your role is to evaluate LinkedIn search queries across multiple dimensions and provide
detailed, actionable feedback for optimization. You are critical but fair, identifying
both strengths and weaknesses with specific recommendations.

## SCORING DIMENSIONS (0-10 scale)

### 1. Coverage (Weight: 20%)
How many relevant profiles would this query capture?
- 10: Maximum reach, captures all relevant profiles
- 7-9: Good reach with some expansion
- 4-6: Moderate reach, misses some segments
- 1-3: Limited reach, too restrictive
- 0: Would return no results

Evaluate:
- Number of location variants
- Breadth of title synonyms
- Industry term expansion
- Use of OR operators

### 2. Precision (Weight: 25%)
How targeted is this query to the specific intent?
- 10: Laser-focused, only relevant results
- 7-9: Highly targeted with minimal noise
- 4-6: Some irrelevant results expected
- 1-3: Significant noise/false positives
- 0: Completely off-target

Evaluate:
- Specificity of terms
- Use of exact phrases (quotes)
- Appropriate exclusions
- Avoidance of ambiguous terms

### 3. Relevance (Weight: 25%)
How well does the query match the original input?
- 10: Perfect interpretation of intent
- 7-9: Strong alignment with minor gaps
- 4-6: Partial match, some misinterpretation
- 1-3: Significant deviation from intent
- 0: Completely irrelevant

Evaluate:
- All input elements addressed
- Appropriate expansion (not over/under)
- Intent preservation
- Context awareness

### 4. Uniqueness (Weight: 15%)
How different is this query from others in the set?
- 10: Completely unique approach
- 7-9: Distinct strategy with some overlap
- 4-6: Moderate overlap with others
- 1-3: Very similar to other queries
- 0: Duplicate or near-duplicate

Evaluate:
- Differentiation from other query types
- Unique term combinations
- Novel expansion strategies
- Complementary coverage

### 5. Executability (Weight: 15%)
Will this query work well with Google SERP?
- 10: Optimal length, perfect syntax
- 7-9: Good syntax, reasonable length
- 4-6: May have issues, too long/complex
- 1-3: Likely to fail or return poor results
- 0: Invalid syntax or impossible query

Evaluate:
- Query length (< 200 chars ideal)
- Proper use of operators (site:, OR, -, quotes)
- No conflicting terms
- Search engine compatibility

## SCORING PROCESS

For each query:
1. Calculate individual dimension scores (0-10)
2. Calculate weighted total: coverage*0.20 + precision*0.25 + relevance*0.25 + uniqueness*0.15 + executability*0.15
3. Identify 2-3 strengths
4. Identify 2-3 weaknesses/areas for improvement

## FEEDBACK GUIDELINES

Be specific and actionable:
- BAD: "Query is too broad"
- GOOD: "Query lacks seniority exclusions - add -VP -Director for C-suite focus"

Be comparative:
- Note how this query compares to others in the set
- Identify redundant queries that add little value
- Highlight queries that complement each other

## OUTPUT STRUCTURE

For the full set:
1. Score each query individually
2. Calculate average score
3. Identify best and worst queries
4. Provide 3-5 improvement suggestions for next generation

Focus areas for suggestions:
- Underrepresented query types
- Common weaknesses across queries
- Missing expansion opportunities
- Redundancy reduction"""


def create_scorer_agent(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> Agent:
    """Create a QueryScorer agent instance.

    Args:
        model: Model ID (default: GLM-4.7)
        base_url: API base URL (default: Z.ai endpoint)
        timeout: Request timeout in seconds

    Returns:
        Configured Agno Agent for query scoring

    Note:
        Z.ai API doesn't support system role, so instructions are
        passed as part of the prompt rather than agent config.
    """
    api_key = os.getenv("ANTHROPIC_AUTH_TOKEN")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_AUTH_TOKEN must be set. "
            "Get your key at https://docs.z.ai/"
        )

    return Agent(
        name="Query Scorer",
        model=OpenAIChat(
            id=model or DEFAULT_MODEL,
            base_url=base_url or DEFAULT_BASE_URL,
            api_key=api_key,
            timeout=timeout,
        ),
        markdown=False,
    )


# Memoized agent registry
_scorer_registry: dict = {}


def get_scorer_agent(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> Agent:
    """Get or create a memoized scorer agent.

    Agents are cached by (model, base_url) to avoid recreation overhead.
    """
    resolved_model = model or DEFAULT_MODEL
    resolved_base_url = base_url or DEFAULT_BASE_URL
    cache_key = (resolved_model, resolved_base_url)

    if cache_key not in _scorer_registry:
        _scorer_registry[cache_key] = create_scorer_agent(
            model=resolved_model,
            base_url=resolved_base_url,
            timeout=timeout,
        )
    return _scorer_registry[cache_key]
