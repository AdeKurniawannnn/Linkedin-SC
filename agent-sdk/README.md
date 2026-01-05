# GLM Query Agent SDK

LinkedIn lead generation query builder using Claude Agent SDK and GLM 4.7 model.

## Overview

This agent generates **1-30 optimized LinkedIn search query variants** from natural language inputs, targeting global B2B markets with different search strategies.

**Built with:** [Claude Agent SDK](https://docs.claude.com/en/docs/claude-code/sdk) + [GLM 4.7](https://z.ai)

## Installation

```bash
pip install claude-agent-sdk python-dotenv
```

## Configuration

Set environment variables (or use `.env` file):

```bash
export ANTHROPIC_AUTH_TOKEN="your-glm-token.suffix"
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"  # Optional (default)
export GLM_MODEL="glm-4.7"  # Optional (default)
```

## Usage

### Basic Example

```python
from agent import GLMQueryAgent

agent = GLMQueryAgent()

# Generate 3 variants (default)
result = agent.generate_variants_sync("CEO Jakarta fintech")

for query_type, query in result.queries.items():
    print(f"[{query_type}] {query}")
```

### Async Example with Options

```python
import asyncio
from agent import GLMQueryAgent

async def main():
    agent = GLMQueryAgent(timeout=180)

    # Generate 10 variants with debug metadata
    result = await agent.generate_variants(
        "CTO Singapore AI startup",
        count=10,
        focus="seniority_focused",
        debug=True
    )

    for query_type, queries in result.queries.items():
        print(f"[{query_type}]")
        if isinstance(queries, list):
            for q in queries:
                print(f"  - {q}")
        else:
            print(f"  {queries}")

    if result.meta:
        print(f"Generated at: {result.meta['timestamp']}")

asyncio.run(main())
```

### Generate Many Variants

```python
# Generate up to 30 query variants
result = await agent.generate_variants(
    "CFO London fintech",
    count=30,
    debug=True
)

# Queries are distributed across types, with arrays for multiple variants
# {
#   "broad": ["query1", "query2", "query3"],
#   "narrow": ["query1", "query2"],
#   "balanced": ["query1", "query2"],
#   ...
# }
```

## API Reference

### `GLMQueryAgent`

#### Constructor

```python
GLMQueryAgent(timeout=120, model=None, base_url=None)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `timeout` | int | 120 | API call timeout in seconds |
| `model` | str | `glm-4.7` | Model name (or `GLM_MODEL` env var) |
| `base_url` | str | `https://api.z.ai/api/anthropic` | API endpoint (or `GLM_BASE_URL` env var) |

#### Methods

**`generate_variants(input_text, count=3, focus=None, debug=False)`** (async)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `input_text` | str | *required* | Natural language input (e.g., "CEO Jakarta fintech") |
| `count` | int | 3 | Number of queries to generate (1-30) |
| `focus` | str | None | Focus on specific query type |
| `debug` | bool | False | Include metadata (timestamp, model) |

**`generate_variants_sync(...)`** - Synchronous wrapper.

### Data Classes

**`QueryResult`**
```python
@dataclass
class QueryResult:
    input: str                        # Original input text
    queries: Dict[str, str | list]    # Query type → query string or array
    meta: Optional[Dict[str, str]]    # Metadata (if debug=True)
```

### Exceptions

| Exception | Description |
|-----------|-------------|
| `GLMQueryError` | Base exception |
| `GLMAuthError` | Authentication failed (missing/invalid token) |
| `GLMTimeoutError` | API call timed out |
| `GLMValidationError` | Response doesn't match schema |

## Query Types (10 Available)

| Type | Description | Use Case |
|------|-------------|----------|
| `broad` | Maximum reach with expanded synonyms | Initial prospecting |
| `narrow` | Maximum precision with exact terms | Targeted outreach |
| `balanced` | Middle ground approach | General purpose |
| `industry_focused` | Deep industry vertical expansion | Sector-specific campaigns |
| `seniority_focused` | Comprehensive title coverage | Executive targeting |
| `location_focused` | Deep geographic expansion | Regional campaigns |
| `ultra_broad` | Maximum expansion across all dimensions | Wide net casting |
| `ultra_narrow` | Single exact term per category | Laser-focused targeting |
| `decision_maker` | Budget holders and influencers | Sales outreach |
| `emerging_market` | Local title variants | APAC/LATAM/EMEA markets |

## Response Format

### Single Queries (count ≤ 5)
```json
{
  "input": "CEO Jakarta fintech",
  "queries": {
    "broad": "site:linkedin.com/in ...",
    "narrow": "site:linkedin.com/in ...",
    "balanced": "site:linkedin.com/in ..."
  }
}
```

### Multiple Variants (count > 5)
```json
{
  "input": "CEO Jakarta fintech",
  "queries": {
    "broad": [
      "site:linkedin.com/in (Jakarta OR ...) ...",
      "site:linkedin.com/in (DKI Jakarta OR ...) ..."
    ],
    "narrow": [
      "site:linkedin.com/in Jakarta CEO fintech ...",
      "site:linkedin.com/in \"Greater Jakarta\" ..."
    ],
    "industry_focused": [
      "site:linkedin.com/in Jakarta (fintech OR payment OR ...) ..."
    ]
  }
}
```

## Testing

```bash
cd agent-sdk
uv run test_example.py
```

Expected output:
```
GLM Query Agent SDK Test (v2.0)
==================================================

Input: CEO Jakarta fintech
Count: 10
Focus: none
Debug: True

Generating query variants...

Generated 10 queries across 7 types:

[broad]
  1. site:linkedin.com/in (Jakarta OR "Greater Jakarta" ...) ...
  2. site:linkedin.com/in (Jakarta OR Jabodetabek ...) ...

[narrow]
  1. site:linkedin.com/in Jakarta CEO fintech ...
  ...

Test completed successfully!
```

## Architecture

```
agent-sdk/
├── __init__.py              # Package exports
├── agent.py                 # Core GLMQueryAgent class
├── prompts.py               # Prompt templates
├── schemas/
│   └── query_variants.json  # JSON schema for structured output
├── test_example.py          # Test script
└── README.md
```

## Global Market Support

The agent includes intelligent expansion for:

**Locations** (Region-Aware)
- US: San Francisco → Bay Area, SF, Silicon Valley
- UK: London → Greater London, City of London
- APAC: Singapore, Jakarta, Mumbai, Tokyo
- LATAM: São Paulo, Mexico City
- EMEA: Berlin, Amsterdam, Dubai

**Seniority Titles** (Multi-Language)
- English: CEO, CTO, CFO, Managing Director
- German: Geschäftsführer, Vorstand
- French: PDG, Directeur Général
- Indonesian: Direktur Utama
- Spanish: Director General

**Industries**
- Fintech, SaaS, AI/ML, Healthcare, E-commerce, Manufacturing

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_AUTH_TOKEN` | Yes | - | GLM API token |
| `ANTHROPIC_BASE_URL` | No | `https://api.z.ai/api/anthropic` | API endpoint |
| `GLM_MODEL` | No | `glm-4.7` | Model to use |

## Resources

- [Claude Agent SDK Documentation](https://docs.claude.com/en/docs/claude-code/sdk)
- [GLM Coding Plan](https://z.ai/subscribe?ic=8JVLJQFSKB)

## License

Same as parent project.
