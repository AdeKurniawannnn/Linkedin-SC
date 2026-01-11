"""Single-pass LinkedIn query generator using Agno Framework.

Generates N query variants from natural language input in a single
LLM call, applying intelligent expansion (location, seniority, industry)
without iterative optimization or query type categorization.
"""

import asyncio
import json
import os
import re
from datetime import datetime
from typing import Optional

from agno.agent import Agent
from agno.models.openai import OpenAIChat
from dotenv import load_dotenv

from expansion_prompt import build_expansion_prompt
from simple_schemas import SimpleQueryResult

load_dotenv()

DEFAULT_MODEL = os.getenv("GLM_MODEL", "GLM-4.7")
DEFAULT_BASE_URL = os.getenv("GLM_BASE_URL", "https://api.z.ai/api/coding/paas/v4")
# Note: The /api/anthropic endpoint does not work; use /api/coding/paas/v4


class QueryGeneratorError(Exception):
    """Base exception for QueryGenerator errors."""
    pass


class QueryAuthError(QueryGeneratorError):
    """Authentication error."""
    pass


class QueryValidationError(QueryGeneratorError):
    """Validation error."""
    pass


class QueryTimeoutError(QueryGeneratorError):
    """Timeout error."""
    pass


def extract_json_from_response(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    # Try direct JSON parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code block
    json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try finding JSON object in text
    json_match = re.search(r"\{[\s\S]*\}", text)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

    raise QueryGeneratorError(f"Could not extract JSON from response: {text[:200]}...")


class QueryGenerator:
    """Single-pass LinkedIn query generator.

    Generates N optimized LinkedIn search queries from natural language
    input using intelligent expansion principles.

    Example:
        >>> gen = QueryGenerator()
        >>> result = await gen.generate("CEO Jakarta fintech", count=5)
        >>> print(result.queries)
        ['site:linkedin.com/in ...', ...]
    """

    def __init__(
        self,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 120,
    ):
        """Initialize the query generator.

        Args:
            model: Model ID (default: GLM-4.7 from env)
            base_url: API base URL (default: Z.ai endpoint from env)
            timeout: Request timeout in seconds
        """
        self.model = model or DEFAULT_MODEL
        self.base_url = base_url or DEFAULT_BASE_URL
        self.timeout = timeout
        self._agent: Optional[Agent] = None

    def _get_agent(self) -> Agent:
        """Get or create the Agno Agent."""
        if self._agent is not None:
            return self._agent

        api_key = os.getenv("ANTHROPIC_AUTH_TOKEN")
        if not api_key:
            raise QueryAuthError(
                "ANTHROPIC_AUTH_TOKEN environment variable must be set. "
                "Get your API key from https://z.ai"
            )

        self._agent = Agent(
            name="Query Generator",
            model=OpenAIChat(
                id=self.model,
                base_url=self.base_url,
                api_key=api_key,
                timeout=self.timeout,
            ),
            markdown=False,
        )
        return self._agent

    async def generate(
        self,
        input_text: str,
        count: int = 10,
        debug: bool = False,
    ) -> SimpleQueryResult:
        """Generate N query variants.

        Args:
            input_text: Natural language input (e.g., "CEO Jakarta fintech")
            count: Number of queries to generate (1-30)
            debug: Include metadata in result

        Returns:
            SimpleQueryResult with list of queries

        Raises:
            QueryValidationError: If input is invalid
            QueryAuthError: If API key is missing
            QueryGeneratorError: If generation fails
        """
        # Validate input
        if not input_text or not input_text.strip():
            raise QueryValidationError("Input text cannot be empty")
        if not 1 <= count <= 30:
            raise QueryValidationError("Count must be between 1 and 30")

        # Build prompt
        prompt = build_expansion_prompt(input_text.strip(), count)

        # Get agent and run
        agent = self._get_agent()

        try:
            # Use sync run wrapped in to_thread for proper async handling
            response = await asyncio.to_thread(agent.run, prompt)

            # Extract response text - handle different response formats
            if hasattr(response, "content") and response.content:
                result_text = response.content
            elif hasattr(response, "message") and response.message:
                result_text = response.message
            elif hasattr(response, "messages") and response.messages:
                # Get last message content
                last_msg = response.messages[-1]
                if hasattr(last_msg, "content"):
                    result_text = last_msg.content
                else:
                    result_text = str(last_msg)
            else:
                result_text = str(response)

            if not result_text:
                raise QueryGeneratorError("Empty response from model")

        except Exception as e:
            if "timeout" in str(e).lower():
                raise QueryTimeoutError(f"Request timed out: {e}")
            raise QueryGeneratorError(f"Generation failed: {e}")

        # Parse response
        data = extract_json_from_response(result_text)
        queries = data.get("queries", [])

        if not queries:
            raise QueryGeneratorError("No queries generated")

        # Ensure we have exactly the requested count
        queries = queries[:count]

        # Build result
        meta = None
        if debug:
            meta = {
                "timestamp": datetime.now().isoformat(),
                "model": self.model,
                "count_requested": str(count),
                "count_returned": str(len(queries)),
            }

        return SimpleQueryResult(
            input=input_text.strip(),
            queries=queries,
            meta=meta,
        )

    def generate_sync(
        self,
        input_text: str,
        count: int = 10,
        debug: bool = False,
    ) -> SimpleQueryResult:
        """Synchronous wrapper for generate().

        Args:
            input_text: Natural language input
            count: Number of queries to generate
            debug: Include metadata

        Returns:
            SimpleQueryResult with list of queries
        """
        return asyncio.run(self.generate(input_text, count, debug))
