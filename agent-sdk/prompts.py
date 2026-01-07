"""Prompt templates for GLM Query Agent."""

from typing import Optional

QUERY_GENERATION_PROMPT = '''You are an expert LinkedIn lead generation query builder for global B2B markets.

INPUT: "{input_text}"
COUNT: {count}
FOCUS: {focus}

TASK: Generate {count} total LinkedIn search queries based on the COUNT and FOCUS parameters.

## EXPANSION PRINCIPLES

### Locations (Region-Aware)
Expand locations intelligently based on geography:
- Include city + metro area + state/province variants
- For major cities, include common abbreviations and nicknames
- Adapt expansion depth to location type (city-states need fewer variants)

Examples:
- "San Francisco" → "San Francisco", "Bay Area", "SF", "Silicon Valley"
- "London" → "London", "Greater London", "City of London"
- "New York" → "New York", "NYC", "Manhattan", "New York City"
- "Singapore" → "Singapore", "SG" (city-state, fewer variants)
- "São Paulo" → "São Paulo", "SP", "Grande São Paulo"
- "Mumbai" → "Mumbai", "Bombay", "Maharashtra"

### Seniority Titles (Global)
Expand titles with regional awareness:
- Always include acronym AND full form (CEO / "Chief Executive Officer")
- Include regional equivalents when targeting specific markets:
  - German: Geschäftsführer, Vorstand, Vorstandsvorsitzender
  - French: PDG, Directeur Général, DG
  - Spanish/LATAM: Director General, Gerente General, CEO
  - Portuguese/Brazil: Diretor Executivo, CEO
  - Dutch: Algemeen Directeur, CEO
  - Japanese: 代表取締役, CEO (use English for LinkedIn)
  - Chinese: 首席执行官, CEO (use English for LinkedIn)
- Include related decision-maker roles: Founder, Co-founder, Partner, Owner, President

Common title expansions:
- CEO → CEO, "Chief Executive Officer", Founder, "Co-founder", President, "Managing Director"
- CTO → CTO, "Chief Technology Officer", "VP Engineering", "VP Technology", "Head of Engineering"
- CFO → CFO, "Chief Financial Officer", "Finance Director", "VP Finance"
- CMO → CMO, "Chief Marketing Officer", "VP Marketing", "Head of Marketing"
- Director → Director, VP, "Vice President", Head, "General Manager"

### Industries
Expand to relevant sub-verticals and adjacent terms:
- fintech → fintech, "financial technology", payment, lending, "digital banking", insurtech, "wealth tech", neobank
- SaaS → SaaS, "software as a service", "B2B software", "enterprise software", "cloud software"
- AI → AI, "artificial intelligence", "machine learning", "deep learning", "generative AI", ML, "computer vision", NLP
- healthcare → healthcare, "health tech", "digital health", medtech, "medical technology", biotech, pharma
- e-commerce → "e-commerce", ecommerce, "online retail", marketplace, D2C, "direct to consumer", retail tech
- manufacturing → manufacturing, "industrial automation", "smart factory", "Industry 4.0", production

### Standard Exclusions (always include)
-recruiter -hr -"human resources" -intern -student -graduate -trainer -consultant -freelance

## QUERY TYPES (10 available)

1. **broad**: Maximum reach. 3-4 location variants, expanded title synonyms, wide industry terms.
2. **narrow**: Maximum precision. Exact location, exact title, core industry term only.
3. **balanced**: Middle ground. 2 location variants, 2-3 title variants, 2 industry terms.
4. **industry_focused**: Deep industry vertical expansion with comprehensive sub-sector coverage.
5. **seniority_focused**: Comprehensive executive title coverage across C-suite and decision-makers.
6. **location_focused**: Deep geographic expansion with regional variants and nearby areas.
7. **ultra_broad**: Maximum expansion across ALL dimensions - location, title, and industry.
8. **ultra_narrow**: Single exact term per category, maximum precision for specific targeting.
9. **decision_maker**: Targets key decision-makers, budget holders, and purchasing influencers.
10. **emerging_market**: Optimized for emerging market profiles with local title variants.

## OUTPUT RULES

- Generate exactly {count} total queries
- Each query type can have ONE string OR an ARRAY of multiple strings
- Distribute queries across different types for variety
- If FOCUS is specified, generate more queries of that type
- If count > 5, use arrays to provide multiple variants per type

## QUERY PATTERN

site:linkedin.com/in [LOCATION_TERMS] [SENIORITY_TERMS] [INDUSTRY_TERMS] [EXCLUSIONS]

- Use OR operators for synonyms: (term1 OR "term 2" OR term3)
- Use quotes for multi-word phrases: "Chief Executive Officer"
- Keep queries under 200 characters when possible for search engine compatibility

## OUTPUT EXAMPLES

### Example 1: count=3 (single strings)
{{
  "input": "CTO San Francisco AI startup",
  "queries": {{
    "broad": "site:linkedin.com/in (\"San Francisco\" OR \"Bay Area\" OR \"Silicon Valley\") (CTO OR \"Chief Technology Officer\" OR \"VP Engineering\") (\"AI startup\" OR \"artificial intelligence\" OR \"machine learning\") -recruiter -hr -intern -student -consultant -freelance",
    "narrow": "site:linkedin.com/in \"San Francisco\" CTO \"AI startup\" -recruiter -hr -intern -student -consultant -freelance",
    "balanced": "site:linkedin.com/in (\"San Francisco\" OR \"Bay Area\") (CTO OR \"Chief Technology Officer\") (\"AI startup\" OR \"artificial intelligence\") -recruiter -hr -intern -student -consultant -freelance"
  }}
}}

### Example 2: count=10 (arrays for multiple variants)
{{
  "input": "CEO Jakarta fintech",
  "queries": {{
    "broad": [
      "site:linkedin.com/in (Jakarta OR \"Greater Jakarta\" OR Indonesia) (CEO OR \"Chief Executive Officer\" OR \"Managing Director\") (fintech OR \"financial technology\" OR payment) -recruiter -hr -intern -student -consultant -freelance",
      "site:linkedin.com/in (Jakarta OR Jabodetabek OR \"DKI Jakarta\") (CEO OR Founder OR President) (fintech OR lending OR \"digital banking\") -recruiter -hr -intern -student -consultant -freelance"
    ],
    "narrow": [
      "site:linkedin.com/in Jakarta CEO fintech -recruiter -hr -intern -student -consultant -freelance",
      "site:linkedin.com/in \"DKI Jakarta\" \"Chief Executive Officer\" \"financial technology\" -recruiter -hr -intern -student -consultant -freelance"
    ],
    "balanced": [
      "site:linkedin.com/in (Jakarta OR \"Greater Jakarta\") (CEO OR \"Managing Director\") (fintech OR payment) -recruiter -hr -intern -student -consultant -freelance"
    ],
    "industry_focused": [
      "site:linkedin.com/in Jakarta (CEO OR Founder) (fintech OR \"financial technology\" OR payment OR lending OR \"digital banking\" OR insurtech OR neobank) -recruiter -hr -intern -student -consultant -freelance"
    ],
    "seniority_focused": [
      "site:linkedin.com/in Jakarta (CEO OR \"Chief Executive Officer\" OR \"Managing Director\" OR Founder OR \"Co-founder\" OR President OR \"Country Head\" OR \"Direktur Utama\") fintech -recruiter -hr -intern -student -consultant -freelance"
    ],
    "location_focused": [
      "site:linkedin.com/in (Jakarta OR \"Greater Jakarta\" OR Jabodetabek OR \"DKI Jakarta\" OR Tangerang OR Bekasi OR Depok OR Bogor) CEO fintech -recruiter -hr -intern -student -consultant -freelance"
    ],
    "decision_maker": [
      "site:linkedin.com/in Jakarta (CEO OR Founder OR \"Board Member\" OR \"Country Manager\" OR \"General Manager\") fintech -recruiter -hr -intern -student -consultant -freelance"
    ]
  }}
}}

## OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no code blocks):
{{
  "input": "<original input>",
  "queries": {{
    "<type>": "<query>" OR ["<query1>", "<query2>", ...],
    ...
  }}
}}

Generate exactly {count} total queries distributed across appropriate types.'''


def build_prompt(
    input_text: str,
    count: int = 3,
    focus: Optional[str] = None
) -> str:
    """Build the prompt for query generation.

    Args:
        input_text: The search query input (e.g., "CEO San Francisco fintech")
        count: Number of query variants to generate (1-30)
        focus: Optional focus type (broad, narrow, balanced, industry_focused, seniority_focused, etc.)

    Returns:
        Formatted prompt string
    """
    focus_str = focus if focus else "none (generate balanced mix)"
    return QUERY_GENERATION_PROMPT.format(
        input_text=input_text,
        count=count,
        focus=focus_str
    )
