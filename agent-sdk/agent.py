"""GLM Query Agent using Agno Framework.

This module provides a LinkedIn query generation agent powered by Agno framework
with GLM 4.7 model via OpenRouter API.
"""

import asyncio
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    from agno.agent import Agent
    from agno.models.openai import OpenAIChat
except ImportError:
    raise ImportError(
        "Agno framework is required. Install with: pip install agno"
    )

try:
    from .prompts import build_prompt
except ImportError:
    try:
        from prompts import build_prompt
    except ImportError:
        from _deprecated.prompts import build_prompt


class GLMQueryError(Exception):
    """Base exception for GLM query errors."""
    pass


class GLMTimeoutError(GLMQueryError):
    """Raised when GLM API call times out."""
    pass


class GLMValidationError(GLMQueryError):
    """Raised when response doesn't match schema."""
    pass


class GLMAuthError(GLMQueryError):
    """Raised when authentication fails."""
    pass


@dataclass
class QueryResult:
    """Result of query generation."""
    input: str
    queries: Dict[str, str]
    meta: Optional[Dict[str, str]] = None


class GLMQueryAgent:
    """Agent for generating LinkedIn query alternatives using GLM 4.7 via Agno Framework."""

    DEFAULT_MODEL = "glm-4.7"
    DEFAULT_BASE_URL = "https://api.z.ai/api/anthropic"

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
        "emerging_market"
    }

    def __init__(
        self,
        timeout: int = 120,
        model: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        """Initialize the GLM Query Agent with Agno Framework.

        Args:
            timeout: Timeout for GLM API call in seconds (default: 120)
            model: Model name (default: glm-4.7, or GLM_MODEL env var)
            base_url: API base URL (default: https://api.z.ai/api/anthropic, or GLM_BASE_URL env var)
        """
        self.timeout = timeout
        self.model = model or os.getenv("GLM_MODEL", self.DEFAULT_MODEL)
        self.base_url = base_url or os.getenv("GLM_BASE_URL", self.DEFAULT_BASE_URL)
        self.schema_path = Path(__file__).parent / "schemas" / "query_variants.json"
        
        self._agent = None
        self._model = None

    def _setup_env(self) -> None:
        """Configure environment for GLM API.

        Raises:
            GLMAuthError: If ANTHROPIC_AUTH_TOKEN is not set
        """
        if "ANTHROPIC_AUTH_TOKEN" not in os.environ:
            raise GLMAuthError(
                "ANTHROPIC_AUTH_TOKEN must be set. "
                "Export it with: export ANTHROPIC_AUTH_TOKEN='your-token.suffix'"
            )

    def _get_agent(self) -> Agent:
        """Get or create the Agno Agent with GLM model.

        Returns:
            Configured Agno Agent instance
        """
        if self._agent is not None:
            return self._agent

        self._setup_env()

        # Create OpenAI-compatible model pointing to GLM endpoint
        self._model = OpenAIChat(
            id=self.model,
            api_key=os.environ.get("ANTHROPIC_AUTH_TOKEN"),
            base_url=self.base_url,
            timeout=self.timeout,
        )

        # Create agent with the model
        self._agent = Agent(
            model=self._model,
            name="GLMQueryGenerator",
            description="LinkedIn query generation agent powered by GLM 4.7",
        )

        return self._agent

    def _load_schema(self) -> dict:
        """Load JSON schema for structured output.

        Returns:
            JSON schema as dictionary

        Raises:
            GLMValidationError: If schema file is not found
        """
        if not self.schema_path.exists():
            raise GLMValidationError(
                f"Schema file not found at {self.schema_path}. "
                "Ensure the package is properly installed."
            )
        with open(self.schema_path) as f:
            return json.load(f)

    def _extract_json(self, text: str) -> dict:
        """Extract JSON from agent response, handling markdown code blocks.

        Args:
            text: Raw response text from agent

        Returns:
            Parsed JSON as dictionary

        Raises:
            GLMValidationError: If JSON cannot be extracted
        """
        if not text:
            raise GLMValidationError("Empty response from agent")

        # Try direct JSON parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting from markdown code blocks
        json_match = re.search(
            r"```(?:json)?\s*(\{.*?\})\s*```",
            text,
            re.DOTALL
        )
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try finding JSON object in text
        json_match = re.search(r"\{[\s\S]*\}", text)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass

        raise GLMValidationError(
            f"Could not extract JSON from response: {text[:500]}"
        )

    async def generate_variants(
        self,
        input_text: str,
        count: int = 3,
        focus: Optional[str] = None,
        debug: bool = False
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
            GLMAuthError: If authentication fails
            GLMTimeoutError: If API call times out
            GLMValidationError: If response doesn't match schema
            GLMQueryError: For other errors
        """
        if not input_text or not input_text.strip():
            raise ValueError("Input text cannot be empty")

        if not 1 <= count <= 30:
            raise ValueError("Count must be between 1 and 30")

        if focus and focus not in self.VALID_FOCUS_TYPES:
            raise ValueError(
                f"Focus must be one of: {', '.join(sorted(self.VALID_FOCUS_TYPES))}"
            )

        try:
            agent = self._get_agent()
            prompt = build_prompt(input_text, count=count, focus=focus)

            # Run agent synchronously wrapped in async context
            response = await asyncio.to_thread(agent.run, prompt)

            # Extract response text
            if hasattr(response, "content"):
                response_text = response.content
            elif hasattr(response, "message"):
                response_text = response.message
            else:
                response_text = str(response)

            # Parse JSON from response
            data = self._extract_json(response_text)

            # Validate response structure
            if "queries" not in data:
                raise GLMValidationError("Response missing 'queries' field")

            queries = data.get("queries", {})
            if not queries:
                raise GLMValidationError("No queries generated")

            # Build result
            meta = None
            if debug:
                meta = {
                    "timestamp": datetime.now().isoformat(),
                    "model": self.model,
                    "framework": "agno"
                }

            return QueryResult(
                input=input_text,
                queries=queries,
                meta=meta
            )

        except asyncio.TimeoutError as e:
            raise GLMTimeoutError(f"GLM API call timed out after {self.timeout}s") from e
        except ValueError:
            raise
        except GLMValidationError:
            raise
        except Exception as e:
            if "401" in str(e) or "unauthorized" in str(e).lower():
                raise GLMAuthError(f"Authentication failed: {e}") from e
            raise GLMQueryError(f"Agent error: {e}") from e

    def generate_variants_sync(
        self,
        input_text: str,
        count: int = 3,
        focus: Optional[str] = None,
        debug: bool = False
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
        return asyncio.run(
            self.generate_variants(input_text, count=count, focus=focus, debug=debug)
        )
