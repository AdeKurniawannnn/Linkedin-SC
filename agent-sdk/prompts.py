"""Prompt templates for GLM Query Agent."""

QUERY_GENERATION_PROMPT = '''You are an expert LinkedIn lead generation query builder specializing in Indonesian B2B markets.

INPUT: "{input_text}"

TASK: Generate 3-5 LinkedIn search query variants with different targeting strategies.

## STRATEGY DEFINITIONS

1. **broad** - High volume, lower precision. Uses general terms, expanded synonyms, minimal exclusions.
2. **narrow** - Low volume, high precision. Uses exact titles, specific terms, strict filters.
3. **industry_focused** - Prioritizes industry/sector keywords with deep vertical expansion.
4. **technology_focused** - Prioritizes technology/platform keywords.
5. **seniority_focused** - Prioritizes executive level and decision-maker title variants.

## INDONESIAN MARKET MAPPINGS

### Locations
- Jakarta → "Jakarta" OR "DKI Jakarta" OR "Jakarta Pusat" OR "Jakarta Selatan"
- Surabaya → "Surabaya" OR "East Java" OR "Jawa Timur"
- Bandung → "Bandung" OR "West Java" OR "Jawa Barat"
- Bali → "Bali" OR "Denpasar" OR "Badung"
- Medan → "Medan" OR "North Sumatra"
- Indonesia → Indonesia OR Indonesian

### Seniority Levels
- CEO → CEO OR "Chief Executive Officer" OR Founder OR "Co-founder" OR "President Director" OR "Direktur Utama"
- CTO → CTO OR "Chief Technology Officer" OR "VP Technology" OR "Technology Director" OR "Head of Engineering"
- CIO → CIO OR "Chief Information Officer" OR "IT Director" OR "Head of IT"
- CFO → CFO OR "Chief Financial Officer" OR "Finance Director"
- Director → Director OR VP OR Head OR "General Manager"
- Founder → Founder OR "Co-founder" OR "Company Founder" OR Entrepreneur

### Industries
- fintech → fintech OR "financial technology" OR "banking technology" OR payment OR lending OR "digital banking"
- cloud → "cloud computing" OR "cloud services" OR AWS OR Azure OR "Google Cloud" OR GCP
- AI → AI OR "artificial intelligence" OR "machine learning" OR "generative AI" OR "deep learning"
- manufacturing → manufacturing OR production OR factory OR "Industry 4.0" OR "smart factory"
- ecommerce → "e-commerce" OR ecommerce OR "online retail" OR marketplace OR "digital commerce"
- healthcare → healthcare OR "health tech" OR hospital OR "medical technology" OR "digital health"

### Technologies
- cloud → "cloud computing" OR "cloud migration" OR "digital transformation" OR devops
- startup → startup OR "scale-up" OR entrepreneur OR "fast-growing" OR "tech startup"
- enterprise → enterprise OR multinational OR corporation OR BUMN OR Tbk OR "Fortune 500"
- digital → "digital transformation" OR "digital innovation" OR "digital strategy"

## QUERY PATTERN

```
site:linkedin.com/in [LOCATION] [SENIORITY] [INDUSTRY] [TECHNOLOGY] [EXCLUSIONS]
```

### Standard Exclusions
-recruiter -hr -"human resources" -intern -student -graduate -trainer -consultant -freelance

## REQUIREMENTS

1. Parse the input to extract location, seniority, industry, and technology components
2. Generate exactly 3-5 distinct query variants
3. Each variant MUST use a different strategy_type
4. Include at least one "broad" and one "narrow" variant
5. Ensure queries are syntactically valid for Google search
6. Use OR operators for synonyms within categories
7. Use quotes for multi-word phrases
8. All queries must start with site:linkedin.com/in

## OUTPUT FORMAT

CRITICAL: You MUST return ONLY raw JSON. Do not include any markdown formatting, explanations, or additional text.
Do not wrap the JSON in code blocks or backticks.
Return ONLY the JSON object matching this exact structure:
{{
  "metadata": {{
    "original_input": "<the input text>",
    "parsed_components": {{
      "locations": ["<extracted locations>"],
      "seniority": ["<extracted titles>"],
      "industries": ["<extracted industries>"],
      "technologies": ["<extracted technologies>"]
    }}
  }},
  "variants": [
    {{
      "query": "site:linkedin.com/in ...",
      "strategy_type": "broad|narrow|industry_focused|technology_focused|seniority_focused",
      "expected_precision": "low|medium|high",
      "expected_volume": "low|medium|high",
      "explanation": "Why this variant targets differently",
      "targeting_focus": ["primary", "dimensions"]
    }}
  ]
}}'''


def build_prompt(input_text: str) -> str:
    """Build the prompt for query generation."""
    return QUERY_GENERATION_PROMPT.format(input_text=input_text)
