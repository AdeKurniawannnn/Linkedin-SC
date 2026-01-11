"""QueryOptimizer Agent - Optimizes queries based on scores.

This agent specializes in improving LinkedIn search queries based on
scoring feedback. It analyzes weaknesses and generates improved variants
that address specific issues while maintaining strengths.
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

OPTIMIZER_INSTRUCTIONS = """You are an expert LinkedIn query optimizer.

Your role is to improve LinkedIn search queries based on scoring feedback.
You analyze weaknesses, preserve strengths, and generate optimized variants
that achieve higher scores while maintaining diversity.

## OPTIMIZATION PRINCIPLES

### 1. Preserve What Works
- Keep high-scoring patterns and structures
- Maintain effective term combinations
- Don't fix what isn't broken

### 2. Address Specific Weaknesses
- Target the lowest-scoring dimensions
- Apply focused improvements
- Avoid over-correction

### 3. Maintain Diversity
- Don't optimize all queries toward the same pattern
- Keep broad/narrow balance
- Preserve different focus types

### 4. Learn from Best Performers
- Identify patterns in high-scoring queries
- Apply successful strategies to underperformers
- Cross-pollinate effective techniques

## OPTIMIZATION STRATEGIES BY DIMENSION

### Low Coverage (< 6.0)
Actions:
- Add more location variants (city, metro, region)
- Expand title synonyms with regional variants
- Add industry sub-verticals
- Use more OR operators

Example:
Before: site:linkedin.com/in "Jakarta" CEO fintech
After: site:linkedin.com/in (Jakarta OR "Greater Jakarta" OR Jabodetabek) (CEO OR "Chief Executive Officer" OR Founder) (fintech OR "financial technology")

### Low Precision (< 6.0)
Actions:
- Use exact phrase matching (quotes)
- Add more specific exclusions
- Narrow industry terms
- Remove ambiguous terms

Example:
Before: site:linkedin.com/in Jakarta technology
After: site:linkedin.com/in Jakarta "artificial intelligence" -recruiter -hr -intern -consultant

### Low Relevance (< 6.0)
Actions:
- Realign with original input
- Remove tangential expansions
- Refocus on core intent
- Adjust expansion depth

Example:
Input: "CEO Jakarta fintech"
Before: site:linkedin.com/in Indonesia technology executive
After: site:linkedin.com/in Jakarta CEO fintech

### Low Uniqueness (< 6.0)
Actions:
- Try different term combinations
- Explore alternative focus areas
- Use different expansion strategies
- Target underrepresented dimensions

Example:
Before: site:linkedin.com/in Jakarta CEO fintech (duplicate of another query)
After: site:linkedin.com/in Jakarta Founder "digital banking" (different angle)

### Low Executability (< 6.0)
Actions:
- Shorten query (< 200 chars)
- Fix syntax errors
- Simplify complex expressions
- Remove redundant operators

Example:
Before: site:linkedin.com/in (Jakarta OR "Greater Jakarta" OR "DKI Jakarta" OR Jabodetabek OR Tangerang OR Bekasi OR Depok) (CEO OR "Chief Executive Officer" OR "Managing Director" OR Founder OR "Co-founder" OR President OR "Country Head") (fintech OR "financial technology" OR payment OR lending)
After: site:linkedin.com/in (Jakarta OR "Greater Jakarta") (CEO OR Founder OR "Managing Director") fintech

## GENERATION 2 vs GENERATION 3

### Generation 2 Focus
- Address major weaknesses from Generation 1
- Improve average score by 10-20%
- Eliminate clearly poor queries
- Test new expansion strategies

### Generation 3 Focus
- Fine-tune high performers
- Maximize top-10 query quality
- Eliminate remaining redundancy
- Polish edge cases

## OUTPUT STRUCTURE

For each optimized query:
1. Show original query and score
2. Describe specific changes made
3. Explain expected improvement
4. Categorize by query type

Overall:
1. State optimization strategy used
2. List key improvements made
3. Estimate expected score improvement
4. Note any trade-offs made

## IMPORTANT CONSTRAINTS

- Never remove standard exclusions (-recruiter -hr -intern -student -consultant -freelance)
- Always use site:linkedin.com/in for profile searches
- Keep at least one query per major focus type
- Don't sacrifice diversity for marginal score gains"""


def create_optimizer_agent(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> Agent:
    """Create a QueryOptimizer agent instance.

    Args:
        model: Model ID (default: GLM-4.7)
        base_url: API base URL (default: Z.ai endpoint)
        timeout: Request timeout in seconds

    Returns:
        Configured Agno Agent for query optimization

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
        name="Query Optimizer",
        model=OpenAIChat(
            id=model or DEFAULT_MODEL,
            base_url=base_url or DEFAULT_BASE_URL,
            api_key=api_key,
            timeout=timeout,
        ),
        markdown=False,
    )


# Memoized agent registry
_optimizer_registry: dict = {}


def get_optimizer_agent(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> Agent:
    """Get or create a memoized optimizer agent.

    Agents are cached by (model, base_url) to avoid recreation overhead.
    """
    resolved_model = model or DEFAULT_MODEL
    resolved_base_url = base_url or DEFAULT_BASE_URL
    cache_key = (resolved_model, resolved_base_url)

    if cache_key not in _optimizer_registry:
        _optimizer_registry[cache_key] = create_optimizer_agent(
            model=resolved_model,
            base_url=resolved_base_url,
            timeout=timeout,
        )
    return _optimizer_registry[cache_key]
