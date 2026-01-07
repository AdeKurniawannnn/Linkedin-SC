"""LinkedIn Query Agent using Agno Framework.

This module provides a LinkedIn query generation agent powered by GLM 4.7
through the Agno framework. It generates optimized search query variants
from natural language inputs for B2B lead generation.

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
from agno.os import AgentOS
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
DEFAULT_MODEL = "glm-4.7"
DEFAULT_BASE_URL = "https://api.z.ai/api/anthropic"


def create_model(
    model: Optional[str] = None,
    base_url: Optional[str] = None,
    timeout: int = 120,
) -> OpenAIChat:
    """Create OpenAIChat model configured for GLM 4.7 via Z.ai.

    Uses OpenAIChat with custom base_url since Z.ai provides an
    OpenAI-compatible API endpoint.

    Args:
        model: Model ID (default: glm-4.7 or GLM_MODEL env var)
        base_url: API base URL (default: Z.ai endpoint or GLM_BASE_URL env var)
        timeout: Request timeout in seconds

    Returns:
        Configured OpenAIChat instance

    Raises:
        ValueError: If ANTHROPIC_AUTH_TOKEN is not set
    """
    api_key = os.getenv("ANTHROPIC_AUTH_TOKEN")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_AUTH_TOKEN must be set. "
            "Export it with: export ANTHROPIC_AUTH_TOKEN='your-token.suffix'"
        )

    return OpenAIChat(
        id=model or os.getenv("GLM_MODEL", DEFAULT_MODEL),
        base_url=base_url or os.getenv("GLM_BASE_URL", DEFAULT_BASE_URL),
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
        model: Model ID (default from env or DEFAULT_MODEL)
        base_url: API base URL (default from env or DEFAULT_BASE_URL)
        timeout: Request timeout in seconds (only used on first creation)

    Returns:
        Cached or newly created Agno Agent instance
    """
    resolved_model = model or os.getenv("GLM_MODEL", DEFAULT_MODEL)
    resolved_base_url = base_url or os.getenv("GLM_BASE_URL", DEFAULT_BASE_URL)
    cache_key = (resolved_model, resolved_base_url)

    if cache_key not in _agent_registry:
        _agent_registry[cache_key] = Agent(
            name="LinkedIn Query Generator",
            id=f"linkedin-query-agent-{hash(cache_key) % 10000}",
            model=create_model(model=resolved_model, base_url=resolved_base_url, timeout=timeout),
            description="Generates optimized LinkedIn search query variants from natural language inputs",
            output_schema=QueryResult,
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
            model: Model name (default: glm-4.7, or GLM_MODEL env var)
            base_url: API base URL (default: Z.ai endpoint, or GLM_BASE_URL env var)
        """
        self.timeout = timeout
        self.model = model or os.getenv("GLM_MODEL", DEFAULT_MODEL)
        self.base_url = base_url or os.getenv("GLM_BASE_URL", DEFAULT_BASE_URL)

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
        # TODO: Document expected exceptions for callers. Currently all errors are
        # converted to ValueError or re-raised as-is. Consider introducing typed
        # exceptions (e.g., QueryTimeoutError, QueryAuthError) for better error handling.
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
        result = response.content
        if isinstance(result, QueryResult):
            queries = result.queries
        elif isinstance(result, dict):
            if "queries" not in result:
                raise ValueError(
                    f"Agent response missing 'queries' field. Got: {list(result.keys())}"
                )
            queries = result["queries"]
        else:
            raise ValueError(
                f"Unexpected agent response type: {type(result).__name__}. "
                f"Expected QueryResult or dict."
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


# AgentOS server configuration (replaces FastAPI)
# TODO: Make database path configurable via env var (e.g., QUERY_AGENT_DB_PATH).
# Current hardcoded "tmp/query_agent.db" path may not exist and isn't absolute.
# For production, use: Path(__file__).parent / "data" / "query_agent.db" or env var.
def create_agent_os() -> AgentOS:
    """Create the AgentOS server instance.

    Returns:
        Configured AgentOS instance with the query agent
    """
    return AgentOS(
        id="linkedin-query-api",
        description="LinkedIn Query Generation API - Generates optimized search query variants",
        agents=[get_agent()],  # Uses default model/base_url from env
    )


# Lazy initialization for AgentOS (only created when needed)
_agent_os: Optional[AgentOS] = None


def get_agent_os() -> AgentOS:
    """Get or create the AgentOS instance."""
    global _agent_os
    if _agent_os is None:
        _agent_os = create_agent_os()
    return _agent_os


# FastAPI app via AgentOS (lazy loaded)
def get_app():
    """Get the FastAPI app from AgentOS."""
    return get_agent_os().get_app()


# For uvicorn: python -m uvicorn agent:app --reload
# Initialize app immediately (required for uvicorn)
app = get_app()


if __name__ == "__main__":
    """Run the AgentOS server.

    Access configuration at: http://localhost:8000/config
    API endpoints at: http://localhost:8000/agents/linkedin-query-agent/runs
    """
    agent_os = get_agent_os()
    agent_os.serve(app="agent:app", port=8000, reload=True)
