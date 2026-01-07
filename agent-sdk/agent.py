"""LinkedIn Query Agent using Agno Framework.

This module provides a LinkedIn query generation agent powered by GLM-4.7
through the Agno framework. It generates optimized search query variants
from natural language inputs for B2B lead generation.

The agent uses GLM-4.7 via Z.ai's OpenAI-compatible API:
- Default model: GLM-4.7
- API endpoint: https://api.z.ai/api/coding/paas/v4
- API key: ANTHROPIC_AUTH_TOKEN

Get your API key at: https://docs.z.ai/

Example:
    >>> from agent import QueryAgent
    >>> agent = QueryAgent()
    >>> result = agent.generate_variants_sync("CEO Jakarta fintech", count=10)
    >>> for query_type, queries in result.queries.items():
    ...     print(f"{query_type}: {queries}")
"""

import os
from datetime import datetime
from typing import Dict, List, Literal, Optional, Union

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

# Load environment variables
load_dotenv()

try:
    from .prompts import build_prompt
except ImportError:
    from prompts import build_prompt


# Type definitions
FocusType = Literal[
    "broad",
    "narrow",
    "balanced",
    "industry_focused",
    "seniority_focused",
    "location_focused",
    "ultra_broad",
    "ultra_narrow",
    "decision_maker",
    "emerging_market",
]


class QueryResult(BaseModel):
    """Structured output schema for LinkedIn query generation.

    This Pydantic model replaces the JSON schema file and provides
    automatic validation of agent responses.

    Attributes:
        input: The original natural language input
        queries: Generated LinkedIn search queries organized by strategy type
        meta: Optional metadata including timestamp and model info
    """

    input: str = Field(..., description="Original natural language input")
    queries: Dict[str, Union[str, List[str]]] = Field(
        ..., description="Generated LinkedIn search queries by type"
    )
    meta: Optional[Dict[str, str]] = Field(
        default=None, description="Optional metadata (timestamp, model)"
    )

    @field_validator("queries")
    @classmethod
    def validate_queries(cls, v):
        """Ensure at least one non-empty query is generated."""
        if not v:
            raise ValueError("No queries generated")

        # Check for at least one non-empty value
        has_content = False
        for value in v.values():
            if isinstance(value, list):
                if any(q.strip() for q in value if isinstance(q, str)):
                    has_content = True
                    break
            elif isinstance(value, str) and value.strip():
                has_content = True
                break

        if not has_content:
            raise ValueError("No valid queries generated (all empty)")

        return v


# Configuration defaults
# Use GLM-4.7 via Z.ai's OpenAI-compatible endpoint
DEFAULT_MODEL = "GLM-4.7"
DEFAULT_BASE_URL = "https://api.z.ai/api/coding/paas/v4"


def create_model(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> OpenAIChat:
    """Create OpenAIChat model configured for GLM-4.7 via Z.ai.

    Uses Z.ai's OpenAI-compatible endpoint for GLM models.

    Args:
        model: Model ID (default: GLM-4.7)
        base_url: API base URL (default: https://api.z.ai/api/coding/paas/v4)
        timeout: Request timeout in seconds

    Returns:
        Configured OpenAIChat instance

    Raises:
        ValueError: If ANTHROPIC_AUTH_TOKEN is not configured
    """
    api_key = os.getenv("ANTHROPIC_AUTH_TOKEN")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_AUTH_TOKEN must be set for Z.ai GLM models. "
            "Get your key at https://docs.z.ai/ "
            "Export with: export ANTHROPIC_AUTH_TOKEN='your-key'"
        )

    return OpenAIChat(
        id=model or DEFAULT_MODEL,
        base_url=base_url or DEFAULT_BASE_URL,
        api_key=api_key,
        timeout=timeout,
    )


# Agent registry: memoized by (model, base_url) to avoid recreating agents
# Note: Never create agents in loops - this causes significant performance overhead
_agent_registry: Dict[tuple, Agent] = {}


def get_agent(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> Agent:
    """Get or create an agent instance with memoization.

    Agents are cached by (model, base_url) combination to avoid
    recreating them unnecessarily (Agno best practice).

    Args:
        model: Model ID (default: GLM-4.7)
        base_url: API base URL (default: https://api.z.ai/api/coding/paas/v4)
        timeout: Request timeout in seconds (only used on first creation)

    Returns:
        Cached or newly created Agno Agent instance
    """
    resolved_model = model or DEFAULT_MODEL
    resolved_base_url = base_url or DEFAULT_BASE_URL
    cache_key = (resolved_model, resolved_base_url)

    if cache_key not in _agent_registry:
        _agent_registry[cache_key] = Agent(
            name="LinkedIn Query Generator",
            id=f"linkedin-query-agent-{hash(cache_key) % 10000}",
            model=create_model(model=resolved_model, base_url=resolved_base_url, timeout=timeout),
            markdown=False,
        )
    return _agent_registry[cache_key]


class QueryAgent:
    """LinkedIn query generation agent using Agno framework.

    This class provides a backward-compatible interface for library usage,
    wrapping the Agno agent with validation and metadata handling.

    Attributes:
        VALID_FOCUS_TYPES: Set of valid focus type strings

    Example:
        >>> agent = QueryAgent()
        >>> result = await agent.generate_variants("CEO Jakarta fintech", count=10)
        >>> print(result.queries)
    """

    VALID_FOCUS_TYPES = {
        "broad",
        "narrow",
        "balanced",
        "industry_focused",
        "seniority_focused",
        "location_focused",
        "ultra_broad",
        "ultra_narrow",
        "decision_maker",
        "emerging_market",
    }

    def __init__(
        self,
        timeout: int = 120,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        """Initialize the Query Agent.

        Args:
            timeout: Timeout for API call in seconds (default: 120)
            model: Model name (default: GLM-4.7)
            base_url: API base URL (default: https://api.z.ai/api/coding/paas/v4)
        """
        self.timeout = timeout
        self.model = model or DEFAULT_MODEL
        self.base_url = base_url or DEFAULT_BASE_URL

        # Use memoized agent (avoids recreating agents in loops)
        self._agent = get_agent(model=model, base_url=base_url, timeout=timeout)

    async def generate_variants(
        self,
        input_text: str,
        count: int = 3,
        focus: Optional[str] = None,
        debug: bool = False,
    ) -> QueryResult:
        """Generate query variants from natural language input.

        Args:
            input_text: Natural language input (e.g., "CEO Jakarta fintech")
            count: Number of query variants to generate (1-30, default: 3)
            focus: Optional focus type (broad, narrow, balanced, etc.)
            debug: If True, include metadata (timestamp, model) in output

        Returns:
            QueryResult with input, queries dict, and optional meta

        Raises:
            ValueError: If input_text is empty or parameters are invalid
        """
        # Validate inputs
        if not input_text or not input_text.strip():
            raise ValueError("Input text cannot be empty")

        if not 1 <= count <= 30:
            raise ValueError("Count must be between 1 and 30")

        if focus and focus not in self.VALID_FOCUS_TYPES:
            raise ValueError(
                f"Focus must be one of: {', '.join(sorted(self.VALID_FOCUS_TYPES))}"
            )

        # Build dynamic prompt with parameters
        prompt = build_prompt(input_text, count=count, focus=focus)

        # Run agent (async)
        try:
            response = await self._agent.arun(prompt)
        except Exception as e:
            # Handle GLM-specific errors
            error_msg = str(e).lower()
            if "unsupported" in error_msg or "format" in error_msg:
                raise ValueError(
                    f"GLM API returned incompatible response. "
                    f"Ensure Z.ai endpoint supports OpenAI format: {e}"
                ) from e
            raise

        # Parse result - handle both Pydantic model and dict responses
        result = response.content if hasattr(response, 'content') else response

        # Handle None response from API
        if result is None:
            raise ValueError(
                "Agent returned None response. "
                "This may indicate an API authentication issue or invalid endpoint. "
                f"Check your ANTHROPIC_AUTH_TOKEN setting."
            )

        if isinstance(result, QueryResult):
            queries = result.queries
        elif isinstance(result, dict):
            if "queries" not in result:
                raise ValueError(
                    f"Agent response missing 'queries' field. Got: {list(result.keys())}"
                )
            queries = result["queries"]
        elif isinstance(result, str):
            # Try to parse the string as JSON or extract JSON from it
            import json
            import re

            # First, try direct JSON parse
            try:
                parsed = json.loads(result)
                if isinstance(parsed, dict) and "queries" in parsed:
                    queries = parsed["queries"]
                elif isinstance(parsed, dict):
                    raise ValueError(
                        f"String response parsed as JSON but missing 'queries'. Got: {list(parsed.keys())}"
                    )
                else:
                    raise ValueError(
                        f"String response parsed as non-dict JSON: {type(parsed).__name__}"
                    )
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', result, re.DOTALL)
                if json_match:
                    try:
                        parsed = json.loads(json_match.group(1))
                        if isinstance(parsed, dict) and "queries" in parsed:
                            queries = parsed["queries"]
                        else:
                            raise ValueError(
                                f"Extracted JSON missing 'queries' field. Got: {list(parsed.keys()) if isinstance(parsed, dict) else type(parsed).__name__}"
                            )
                    except json.JSONDecodeError as e:
                        raise ValueError(
                            f"String response is not valid JSON. Response preview: {result[:500]}"
                        ) from e
                else:
                    raise ValueError(
                        f"String response is not JSON and contains no JSON blocks. Response preview: {result[:500]}"
                    )
        else:
            raise ValueError(
                f"Unexpected agent response type: {type(result).__name__}. "
                f"Expected QueryResult, dict, or JSON string."
            )

        # Add metadata if debug mode
        meta = None
        if debug:
            meta = {
                "timestamp": datetime.now().isoformat(),
                "model": self.model,
            }

        return QueryResult(input=input_text, queries=queries, meta=meta)

    def generate_variants_sync(
        self,
        input_text: str,
        count: int = 3,
        focus: Optional[str] = None,
        debug: bool = False,
    ) -> QueryResult:
        """Synchronous wrapper for generate_variants.

        Args:
            input_text: Natural language input
            count: Number of query variants to generate (1-30, default: 3)
            focus: Optional focus type
            debug: If True, include metadata in output

        Returns:
            QueryResult with input, queries dict, and optional meta
        """
        import asyncio

        return asyncio.run(
            self.generate_variants(input_text, count=count, focus=focus, debug=debug)
        )


# AgentOS server configuration
def create_agent_os():
    """Create the AgentOS server instance.

    Returns:
        Configured AgentOS instance with the query agent
    """
    from agno.os import AgentOS  # Lazy import to avoid startup overhead
    return AgentOS(
        id="linkedin-query-api",
        description="LinkedIn Query Generation API - Generates optimized search query variants",
        agents=[get_agent()],  # Uses default model/base_url from env
    )


# Lazy initialization for AgentOS (only created when needed)
_agent_os: Optional[object] = None


def get_agent_os():
    """Get or create the AgentOS instance."""
    global _agent_os
    if _agent_os is None:
        _agent_os = create_agent_os()
    return _agent_os


# FastAPI app via AgentOS (lazy loaded)
_app = None


def get_app():
    """Get the FastAPI app from AgentOS."""
    global _app
    if _app is None:
        _app = get_agent_os().get_app()
    return _app


# For uvicorn: python -m uvicorn agent:app --reload
# Use __getattr__ for lazy loading to avoid module-level side effects
def __getattr__(name):
    """Lazy load app only when accessed."""
    if name == "app":
        return get_app()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


if __name__ == "__main__":
    """CLI for LinkedIn Query Agent.

    Usage:
        python agent.py "CEO Jakarta fintech"
        python agent.py "CTO Singapore AI" --count 5 --focus seniority_focused
        python agent.py --serve --port 8001
    """
    import argparse
    import json
    import sys

    parser = argparse.ArgumentParser(
        description="LinkedIn Query Agent - Generate optimized search queries",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python agent.py "CEO Jakarta fintech"
  python agent.py "CTO Singapore AI" --count 5
  python agent.py "VP Sales London SaaS" --focus seniority_focused
  python agent.py --serve --port 8001
        """,
    )
    parser.add_argument("query", nargs="?", help="Natural language query")
    parser.add_argument("-c", "--count", type=int, default=3, help="Number of variants (1-30)")
    parser.add_argument("-f", "--focus", choices=list(QueryAgent.VALID_FOCUS_TYPES), help="Focus type")
    parser.add_argument("-d", "--debug", action="store_true", help="Include metadata")
    parser.add_argument("-o", "--output", help="Output file (default: stdout)")
    parser.add_argument("--serve", action="store_true", help="Run AgentOS server")
    parser.add_argument("--port", type=int, default=8001, help="Server port")

    args = parser.parse_args()

    if args.serve:
        print(f"Starting AgentOS server on port {args.port}...")
        agent_os = get_agent_os()
        agent_os.serve(app="agent:app", port=args.port, reload=True)
    elif args.query:
        agent = QueryAgent()
        try:
            result = agent.generate_variants_sync(
                args.query, count=args.count, focus=args.focus, debug=args.debug
            )
            output = json.dumps(result.model_dump(), indent=2)
            if args.output:
                with open(args.output, "w") as f:
                    f.write(output)
                print(f"Saved to {args.output}", file=sys.stderr)
            else:
                print(output)
        except ValueError as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        parser.print_help()
        sys.exit(1)
