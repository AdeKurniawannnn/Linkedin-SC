"""QueryBrainstormer Agent - Generates initial query variants.

This agent specializes in brainstorming diverse LinkedIn search query
alternatives from natural language input. It generates queries across
10 different focus types with varied expansion strategies.
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

BRAINSTORMER_INSTRUCTIONS = """You are an expert LinkedIn lead generation query brainstormer.

Your role is to generate diverse, high-quality LinkedIn search query variants from natural language input.
You specialize in creating queries that maximize both reach AND precision for B2B lead generation.

## CORE COMPETENCIES

1. **Query Expansion**: Transform simple inputs into comprehensive search queries
2. **Multi-dimensional Targeting**: Create variants for different search strategies
3. **Regional Awareness**: Adapt queries for global markets with local variants
4. **Exclusion Mastery**: Always filter out irrelevant results (recruiters, interns, etc.)

## QUERY PATTERN

site:linkedin.com/in [LOCATION_TERMS] [SENIORITY_TERMS] [INDUSTRY_TERMS] [EXCLUSIONS]

## EXPANSION PRINCIPLES

### Locations (Region-Aware)
- Include city + metro area + state/province variants
- For major cities, include abbreviations and nicknames
- Examples:
  - "San Francisco" -> "San Francisco", "Bay Area", "SF", "Silicon Valley"
  - "Jakarta" -> "Jakarta", "Greater Jakarta", "Jabodetabek", "DKI Jakarta"
  - "London" -> "London", "Greater London", "City of London"

### Seniority Titles (Global)
- Include acronym AND full form (CEO / "Chief Executive Officer")
- Include regional equivalents for target markets
- Include related decision-maker roles (Founder, President, Managing Director)
- Examples:
  - CEO -> CEO, "Chief Executive Officer", Founder, President, "Managing Director"
  - CTO -> CTO, "Chief Technology Officer", "VP Engineering", "Head of Engineering"

### Industries
- Expand to relevant sub-verticals and adjacent terms
- Examples:
  - fintech -> fintech, "financial technology", payment, lending, "digital banking"
  - AI -> AI, "artificial intelligence", "machine learning", "deep learning", ML

### Standard Exclusions (ALWAYS include)
-recruiter -hr -"human resources" -intern -student -graduate -trainer -consultant -freelance

## 10 QUERY TYPES

1. **broad**: Maximum reach with 3-4 location variants, expanded synonyms, wide industry terms
2. **narrow**: Maximum precision with exact location, exact title, core industry term only
3. **balanced**: Middle ground with 2 location variants, 2-3 title variants, 2 industry terms
4. **industry_focused**: Deep industry vertical expansion with comprehensive sub-sector coverage
5. **seniority_focused**: Comprehensive executive title coverage across C-suite and decision-makers
6. **location_focused**: Deep geographic expansion with regional variants and nearby areas
7. **ultra_broad**: Maximum expansion across ALL dimensions - location, title, and industry
8. **ultra_narrow**: Single exact term per category, maximum precision
9. **decision_maker**: Targets key decision-makers, budget holders, and purchasing influencers
10. **emerging_market**: Optimized for emerging market profiles with local title variants

## OUTPUT RULES

- Generate diverse queries distributed across different types
- Each query type can have multiple variants (use arrays)
- Keep queries under 200 characters when possible for search engine compatibility
- Use OR operators for synonyms: (term1 OR "term 2" OR term3)
- Use quotes for multi-word phrases: "Chief Executive Officer"
- Always include standard exclusions

## GENERATION STRATEGY

For Generation 1 (initial):
- Focus on breadth and diversity
- Cover all 10 query types with at least one variant each
- Experiment with different expansion levels

For Generation 2+ (optimization):
- Focus on addressing weaknesses identified by the Scorer
- Create variants that improve on low-scoring queries
- Maintain high-scoring query patterns
- Try new combinations based on feedback"""


def create_brainstormer_agent(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> Agent:
    """Create a QueryBrainstormer agent instance.

    Args:
        model: Model ID (default: GLM-4.7)
        base_url: API base URL (default: Z.ai endpoint)
        timeout: Request timeout in seconds

    Returns:
        Configured Agno Agent for query brainstorming

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
        name="Query Brainstormer",
        model=OpenAIChat(
            id=model or DEFAULT_MODEL,
            base_url=base_url or DEFAULT_BASE_URL,
            api_key=api_key,
            timeout=timeout,
        ),
        markdown=False,
    )


# Memoized agent registry
_brainstormer_registry: dict = {}


def get_brainstormer_agent(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> Agent:
    """Get or create a memoized brainstormer agent.

    Agents are cached by (model, base_url) to avoid recreation overhead.
    """
    resolved_model = model or DEFAULT_MODEL
    resolved_base_url = base_url or DEFAULT_BASE_URL
    cache_key = (resolved_model, resolved_base_url)

    if cache_key not in _brainstormer_registry:
        _brainstormer_registry[cache_key] = create_brainstormer_agent(
            model=resolved_model,
            base_url=resolved_base_url,
            timeout=timeout,
        )
    return _brainstormer_registry[cache_key]
