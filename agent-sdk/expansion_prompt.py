"""Expansion prompt for single-pass query generation.

Preserves the valuable expansion principles from the original system:
- Location expansion (regional awareness)
- Seniority title expansion (global, multi-language)
- Industry expansion (sub-verticals)
- Standard exclusions
"""

EXPANSION_PROMPT = '''You are an expert LinkedIn lead generation query builder for global B2B markets.

INPUT: "{input_text}"
COUNT: {count}

TASK: Generate exactly {count} LinkedIn search query variants, each with different expansion strategies.

## EXPANSION PRINCIPLES

### Locations (Region-Aware)
Expand locations intelligently based on geography:
- Include city + metro area + state/province variants
- For major cities, include common abbreviations and nicknames
- Adapt expansion depth to location type (city-states need fewer variants)

Examples:
- "San Francisco" -> "San Francisco", "Bay Area", "SF", "Silicon Valley"
- "London" -> "London", "Greater London", "City of London"
- "New York" -> "New York", "NYC", "Manhattan", "New York City"
- "Singapore" -> "Singapore", "SG" (city-state, fewer variants)
- "Jakarta" -> "Jakarta", "Greater Jakarta", "Jabodetabek", "DKI Jakarta"
- "Mumbai" -> "Mumbai", "Bombay", "Maharashtra"

### Seniority Titles (Global)
Expand titles with regional awareness:
- Always include acronym AND full form (CEO / "Chief Executive Officer")
- Include regional equivalents when targeting specific markets:
  - German: Geschaeftsfuehrer, Vorstand
  - French: PDG, Directeur General
  - Spanish/LATAM: Director General, Gerente General
  - Indonesian: Direktur Utama
- Include related decision-maker roles: Founder, Co-founder, Partner, Owner, President, Managing Director

Common title expansions:
- CEO -> CEO, "Chief Executive Officer", Founder, "Co-founder", President, "Managing Director"
- CTO -> CTO, "Chief Technology Officer", "VP Engineering", "VP Technology", "Head of Engineering"
- CFO -> CFO, "Chief Financial Officer", "Finance Director", "VP Finance"
- CMO -> CMO, "Chief Marketing Officer", "VP Marketing", "Head of Marketing"
- Director -> Director, VP, "Vice President", Head, "General Manager"

### Industries
Expand to relevant sub-verticals and adjacent terms:
- fintech -> fintech, "financial technology", payment, lending, "digital banking", insurtech, neobank
- SaaS -> SaaS, "software as a service", "B2B software", "enterprise software", "cloud software"
- AI -> AI, "artificial intelligence", "machine learning", "deep learning", ML, "computer vision"
- healthcare -> healthcare, "health tech", "digital health", medtech, "medical technology", biotech
- e-commerce -> "e-commerce", ecommerce, "online retail", marketplace, D2C, "direct to consumer"

### Standard Exclusions (ALWAYS include in every query)
-recruiter -hr -"human resources" -intern -student -graduate -trainer -consultant -freelance

## QUERY PATTERN

site:linkedin.com/in [LOCATION_TERMS] [SENIORITY_TERMS] [INDUSTRY_TERMS] [EXCLUSIONS]

- Use OR operators for synonyms: (term1 OR "term 2" OR term3)
- Use quotes for multi-word phrases: "Chief Executive Officer"
- Keep queries under 200 characters when possible for search engine compatibility

## DIVERSITY REQUIREMENTS

Generate {count} DIVERSE queries with VARIED expansion depths:
- Some queries should be broader (more OR terms, more variants)
- Some queries should be narrower (fewer terms, more precise)
- Some queries should focus on location expansion
- Some queries should focus on title expansion
- Some queries should focus on industry expansion
- Avoid near-duplicate queries - each query should explore a different angle

## OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no code blocks, no explanations):
{{
  "input": "{input_text}",
  "queries": [
    "site:linkedin.com/in ...",
    "site:linkedin.com/in ...",
    ...
  ]
}}

Generate exactly {count} queries as a simple list of strings.'''


def build_expansion_prompt(input_text: str, count: int) -> str:
    """Build the expansion prompt for query generation.

    Args:
        input_text: The search query input (e.g., "CEO Jakarta fintech")
        count: Number of query variants to generate (1-30)

    Returns:
        Formatted prompt string
    """
    return EXPANSION_PROMPT.format(input_text=input_text, count=count)
