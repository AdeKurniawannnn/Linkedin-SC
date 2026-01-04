# GLM Query Agent SDK

LinkedIn lead generation query builder using Claude Agent SDK and GLM 4.7 model.

## Overview

This agent generates 3-5 optimized LinkedIn search query variants from natural language inputs, targeting Indonesian B2B markets with different search strategies (broad, narrow, industry-focused, technology-focused, seniority-focused).

**Built with:** [Claude Agent SDK](https://docs.claude.com/en/docs/claude-code/sdk) + [GLM 4.7](https://z.ai)

## Differences from `agent/`

| Aspect | `agent/` (Original) | `agent-sdk/` (This Version) |
|--------|---------------------|---------------------------|
| Backend | Subprocess → Claude CLI | Direct SDK `query()` calls |
| Interface | CLI + Library | Library only |
| Dependencies | `asyncio` (stdlib only) | `claude-agent-sdk` |
| Response Handling | Parse stdout JSON | Iterate message objects |
| Invocation | `python -m agent.cli` | `from agent_sdk import GLMQueryAgent` |

## Installation

```bash
pip install claude-agent-sdk
```

## Configuration

Set environment variables:

```bash
export ANTHROPIC_AUTH_TOKEN="your-glm-token.suffix"
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"  # Optional (default)
export GLM_MODEL="glm-4.7"  # Optional (default)
```

## Usage

### Basic Example

```python
from agent_sdk import GLMQueryAgent

# Initialize agent
agent = GLMQueryAgent()

# Generate variants (synchronous)
result = agent.generate_variants_sync("CEO Jakarta fintech")

# Display results
for variant in result.variants:
    print(f"[{variant.strategy_type}] {variant.query}")
```

### Async Example

```python
import asyncio
from agent_sdk import GLMQueryAgent

async def main():
    agent = GLMQueryAgent(timeout=180)
    result = await agent.generate_variants("CTO Surabaya cloud computing")

    for variant in result.variants:
        print(f"Strategy: {variant.strategy_type}")
        print(f"Query: {variant.query}")
        print(f"Explanation: {variant.explanation}")
        print()

asyncio.run(main())
```

### Custom Configuration

```python
agent = GLMQueryAgent(
    timeout=300,
    model="glm-4.7",
    base_url="https://api.z.ai/api/anthropic"
)
```

## API Reference

### `GLMQueryAgent`

#### Constructor

```python
GLMQueryAgent(timeout=120, model=None, base_url=None)
```

- `timeout` (int): API call timeout in seconds (default: 120)
- `model` (str): Model name (default: `glm-4.7` or `GLM_MODEL` env var)
- `base_url` (str): API base URL (default: `https://api.z.ai/api/anthropic` or `GLM_BASE_URL` env var)

#### Methods

**`generate_variants(input_text: str) -> QueryResult`** (async)

Generate query variants from natural language input.

**`generate_variants_sync(input_text: str) -> QueryResult`** (sync)

Synchronous wrapper for `generate_variants()`.

### Data Classes

**`QueryResult`**
- `metadata` (dict): Original input, parsed components, timestamp, model
- `variants` (list[QueryVariant]): Generated query variants
- `raw_response` (dict, optional): Raw API response

**`QueryVariant`**
- `query` (str): The LinkedIn search query
- `strategy_type` (str): `broad` | `narrow` | `industry_focused` | `technology_focused` | `seniority_focused`
- `expected_precision` (str): `low` | `medium` | `high`
- `expected_volume` (str): `low` | `medium` | `high`
- `explanation` (str): Why this variant targets differently
- `targeting_focus` (list[str]): Primary targeting dimensions

### Exceptions

- `GLMQueryError` - Base exception
- `GLMAuthError` - Authentication failed
- `GLMTimeoutError` - API call timed out
- `GLMValidationError` - Response doesn't match schema

## Testing

Run the test example:

```bash
cd agent-sdk
python test_example.py
```

Expected output:
```
GLM Query Agent SDK Test
==================================================

Input: CEO Jakarta fintech
Model: glm-4.7
Base URL: https://api.z.ai/api/anthropic

Generating query variants...

✓ Generated 5 variants:

1. [broad]
   Query: site:linkedin.com/in ...
   ...

✓ Saved results to test_output.json

Test completed successfully!
```

## Architecture

```
agent-sdk/
├── __init__.py          # Package exports
├── agent.py             # Core GLMQueryAgent class (SDK-based)
├── prompts.py           # Prompt templates
├── schemas/
│   └── query_variants.json  # JSON schema for structured output
├── test_example.py      # Test script
└── README.md            # This file
```

## Strategy Types

1. **broad** - High volume, lower precision. Expanded synonyms, minimal exclusions.
2. **narrow** - Low volume, high precision. Exact titles, specific terms, strict filters.
3. **industry_focused** - Prioritizes industry/sector keywords with deep vertical expansion.
4. **technology_focused** - Prioritizes technology/platform keywords.
5. **seniority_focused** - Prioritizes executive level and decision-maker title variants.

## Indonesian Market Mappings

The agent includes specialized mappings for:
- **Locations**: Jakarta, Surabaya, Bandung, Bali, Medan
- **Seniority**: CEO, CTO, CIO, CFO, Director, Founder (with Indonesian equivalents)
- **Industries**: fintech, cloud, AI, manufacturing, ecommerce, healthcare
- **Technologies**: cloud, startup, enterprise, digital transformation

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_AUTH_TOKEN` | *Required* | GLM API token (format: `token.suffix`) |
| `ANTHROPIC_BASE_URL` | `https://api.z.ai/api/anthropic` | GLM API endpoint |
| `GLM_MODEL` | `glm-4.7` | Model to use |

## Migration from `agent/`

The API is backward compatible. Replace imports:

```python
# Old (CLI-based)
from agent.glm_query_agent import GLMQueryAgent

# New (SDK-based)
from agent_sdk import GLMQueryAgent

# Usage remains the same
agent = GLMQueryAgent()
result = agent.generate_variants_sync("CEO Jakarta fintech")
```

## Resources

- [Claude Agent SDK Documentation](https://docs.claude.com/en/docs/claude-code/sdk)
- [GLM Coding Plan](https://z.ai/subscribe?ic=8JVLJQFSKB)
- [Original `agent/` implementation](../agent/)

## License

Same as parent project.
