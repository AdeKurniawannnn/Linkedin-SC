# LinkedIn Query Generator

LinkedIn lead generation query builder using Agno Framework with support for multiple LLM providers.

## Overview

This library generates **1-30 optimized LinkedIn search query variants** from natural language inputs in a single LLM call, applying intelligent expansion (location, seniority, industry) without iterative optimization or query type categorization.

**Built with:** [Agno Framework](https://github.com/agno-agi/agno) + Support for [GLM 4.7](https://z.ai), [OpenRouter](https://openrouter.ai), and other LLM providers

## Installation

```bash
uv pip install agno python-dotenv pydantic
```

Or with pip:
```bash
pip install agno python-dotenv pydantic
```

## Configuration

### GLM Provider (Default)

Set environment variables (or use `.env` file):

```bash
export ANTHROPIC_AUTH_TOKEN="your-glm-token.suffix"
export GLM_BASE_URL="https://api.z.ai/api/coding/paas/v4"  # Optional (default)
export GLM_MODEL="glm-4.7"  # Optional (default)
export DEFAULT_PROVIDER="glm"  # Optional (default)
```

### OpenRouter Provider

To use OpenRouter instead:

```bash
export OPENROUTER_API_KEY="sk-or-..."
export OPENROUTER_MODEL="google/gemini-3-flash-preview"  # Optional (default)
export DEFAULT_PROVIDER="openrouter"
```

## Usage

### Basic Example

```python
from generator import QueryGenerator

gen = QueryGenerator()  # Uses default GLM provider

# Generate 10 query variants
result = gen.generate_sync("CEO Jakarta fintech", count=10)

for i, query in enumerate(result.queries, 1):
    print(f"{i}. {query}")
```

### Async Example with Options

```python
import asyncio
from generator import QueryGenerator, Provider

async def main():
    # Use OpenRouter provider instead
    gen = QueryGenerator(provider=Provider.OPENROUTER, timeout=180)

    # Generate 10 variants with debug metadata
    result = await gen.generate(
        "CTO Singapore AI startup",
        count=10,
        debug=True
    )

    print(f"Input: {result.input}")
    print(f"Generated {len(result.queries)} queries:")
    for i, query in enumerate(result.queries, 1):
        print(f"  {i}. {query}")

    if result.meta:
        print(f"\nMetadata:")
        print(f"  Provider: {result.meta['provider']}")
        print(f"  Model: {result.meta['model']}")
        print(f"  Generated at: {result.meta['timestamp']}")

asyncio.run(main())
```

### Generate Many Variants

```python
# Generate up to 30 query variants
gen = QueryGenerator()
result = gen.generate_sync(
    "CFO London fintech",
    count=30,
    debug=True
)

# Returns a flat list of 30 optimized queries
for i, query in enumerate(result.queries, 1):
    print(f"{i}. {query}")
```

## API Reference

### `QueryGenerator`

#### Constructor

```python
QueryGenerator(provider=None, model=None, timeout=120)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `provider` | Provider | `glm` (from env) | LLM provider (glm or openrouter) |
| `model` | str | Provider default | Model ID (from env or provider config) |
| `timeout` | int | 120 | API call timeout in seconds |

#### Methods

**`generate(input_text, count=10, debug=False)`** (async)

Generates N query variants from natural language input.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `input_text` | str | *required* | Natural language input (e.g., "CEO Jakarta fintech") |
| `count` | int | 10 | Number of queries to generate (1-30) |
| `debug` | bool | False | Include metadata (timestamp, model, provider) |

Returns: `SimpleQueryResult` with list of queries

Raises: `QueryValidationError`, `QueryAuthError`, `QueryTimeoutError`, `QueryGeneratorError`

**`generate_sync(input_text, count=10, debug=False)`** - Synchronous wrapper

### Data Classes

**`SimpleQueryResult`**
```python
class SimpleQueryResult(BaseModel):
    input: str                      # Original natural language input
    queries: List[str]              # List of generated query variants
    meta: Optional[Dict[str, str]]  # Metadata (if debug=True)
```

### Enums

**`Provider`**
```python
class Provider(str, Enum):
    GLM = "glm"                     # Z.ai GLM 4.7 provider
    OPENROUTER = "openrouter"      # OpenRouter multi-model provider
```

### Exceptions

| Exception | Description |
|-----------|-------------|
| `QueryGeneratorError` | Base exception |
| `QueryAuthError` | Authentication failed (missing/invalid API key) |
| `QueryTimeoutError` | API call timed out |
| `QueryValidationError` | Input validation failed (empty/invalid count) |

## Query Generation Strategy

The QueryGenerator uses intelligent expansion principles to create diverse LinkedIn search queries without explicit type categorization:

- **Location Expansion**: Region-aware variants (San Francisco → Bay Area, SF, Silicon Valley)
- **Seniority Expansion**: Multi-language title coverage (CEO, CTO, CFO, etc. in EN, DE, FR, ID, ES)
- **Industry Expansion**: Sector-specific keyword variations (fintech, SaaS, AI/ML, etc.)
- **Combination Variants**: Mix location + seniority + industry for comprehensive coverage

All queries are optimized for LinkedIn's site:linkedin.com/in search syntax.

## Response Format

Returns a flat list of query variants optimized for LinkedIn search:

```json
{
  "input": "CEO Jakarta fintech",
  "queries": [
    "site:linkedin.com/in (Jakarta OR \"Greater Jakarta\" OR DKI) (CEO OR CTO OR COO) (fintech OR payment OR finance)",
    "site:linkedin.com/in Jakarta \"Direktur Utama\" OR \"Chief Executive\" (fintech OR fintech startup)",
    "site:linkedin.com/in (Jabodetabek OR \"Greater Jakarta\") CEO (fintech OR FinTech OR financial technology)",
    "site:linkedin.com/in Jakarta (Executive OR Leadership) (fintech OR blockchain OR cryptocurrency)",
    "site:linkedin.com/in \"Jakarta\" (fintech OR startup) CEO"
  ],
  "meta": {
    "timestamp": "2025-01-12T10:30:45.123456",
    "provider": "glm",
    "model": "glm-4.7",
    "count_requested": "5",
    "count_returned": "5"
  }
}
```

## Testing

Run the example test:

```bash
cd agent-sdk
uv run test_example.py
```

Or run the comprehensive test suite:

```bash
uv run test_generator.py
```

Expected output:
```
Query Generator Test
==================================================

Input: CEO Jakarta fintech
Count: 10
Debug: True

Generating query variants...

Generated 10 queries:

1. site:linkedin.com/in (Jakarta OR "Greater Jakarta") (CEO OR CTO) fintech
2. site:linkedin.com/in Jakarta "Chief Executive" (fintech OR financial)
3. site:linkedin.com/in (Jabodetabek OR "DKI Jakarta") CEO (fintech OR FinTech)
...

Test completed successfully!
```

## Architecture

```
agent-sdk/
├── __init__.py              # Package exports
├── generator.py             # Core QueryGenerator class with Agno integration
├── expansion_prompt.py      # Prompt builder for query expansion
├── simple_schemas.py        # SimpleQueryResult Pydantic model
├── test_example.py          # Basic usage example
├── test_generator.py        # Comprehensive test suite
└── README.md
```

### Data Flow

1. User calls `QueryGenerator.generate(input_text, count)`
2. Input validation (empty check, count bounds)
3. Prompt building with expansion strategy via `build_expansion_prompt()`
4. LLM call via Agno Agent with selected provider
5. JSON extraction from LLM response
6. Result wrapping in `SimpleQueryResult` with optional metadata

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

### GLM Provider
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_AUTH_TOKEN` | Yes (for GLM) | - | GLM API token from Z.ai |
| `GLM_BASE_URL` | No | `https://api.z.ai/api/coding/paas/v4` | GLM API endpoint |
| `GLM_MODEL` | No | `glm-4.7` | GLM model ID |

### OpenRouter Provider
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | Yes (for OpenRouter) | - | OpenRouter API key |
| `OPENROUTER_MODEL` | No | `google/gemini-3-flash-preview` | OpenRouter model ID |

### Global
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEFAULT_PROVIDER` | No | `glm` | Default provider to use (glm or openrouter) |

## Resources

- [Agno Framework GitHub](https://github.com/agno-agi/agno)
- [GLM 4.7 Documentation](https://z.ai)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [LinkedIn URL Patterns](https://github.com/dennyleonardo/Linkedin-SC/blob/main/LinkedinSC/LINKEDIN_URL_PATTERNS.md)

## License

Same as parent project.
