"""GLM Query Agent using Claude Agent SDK."""

import asyncio
import json
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from claude_agent_sdk import (
    query,
    ClaudeAgentOptions,
    ResultMessage,
    ClaudeSDKError,
    ProcessError
)

# Load environment variables from .env file
load_dotenv()

try:
    from .prompts import build_prompt
except ImportError:
    from prompts import build_prompt


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
    """Agent for generating LinkedIn query alternatives using GLM 4.7 via Claude Agent SDK."""

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
        """Initialize the GLM Query Agent.

        Args:
            timeout: Timeout for GLM API call in seconds (default: 120)
            model: Model name (default: glm-4.7, or GLM_MODEL env var)
            base_url: API base URL (default: https://api.z.ai/api/anthropic, or GLM_BASE_URL env var)
        """
        self.timeout = timeout
        self.model = model or os.getenv("GLM_MODEL", self.DEFAULT_MODEL)
        self.base_url = base_url or os.getenv("GLM_BASE_URL", self.DEFAULT_BASE_URL)
        self.schema_path = Path(__file__).parent / "schemas" / "query_variants.json"

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
        os.environ["ANTHROPIC_BASE_URL"] = self.base_url

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
            focus: Optional focus type (broad, narrow, balanced, industry_focused, seniority_focused, location_focused, ultra_broad, ultra_narrow, decision_maker, emerging_market)
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
            raise ValueError(f"Focus must be one of: {', '.join(self.VALID_FOCUS_TYPES)}")

        self._setup_env()
        prompt = build_prompt(input_text, count=count, focus=focus)
        schema = self._load_schema()

        options = ClaudeAgentOptions(
            model=self.model,
            output_format={
                "type": "json_schema",
                "schema": schema
            }
        )

        response = None

        try:
            async for message in query(prompt=prompt, options=options):
                if isinstance(message, ResultMessage):
                    if message.is_error:
                        raise GLMQueryError(f"Agent error: {message.result}")
                    if hasattr(message, 'structured_output') and message.structured_output:
                        response = message.structured_output
                        break

        except ProcessError as e:
            if "401" in str(e) or "unauthorized" in str(e).lower():
                raise GLMAuthError(f"Authentication failed: {e}")
            raise GLMQueryError(f"SDK error: {e}")
        except asyncio.TimeoutError:
            raise GLMTimeoutError(f"GLM API call timed out after {self.timeout}s")
        except ClaudeSDKError as e:
            raise GLMQueryError(f"SDK error: {e}")

        if not response:
            raise GLMValidationError("No structured output received from agent")

        return self._parse_response(input_text, response, debug)

    def _parse_response(
        self,
        input_text: str,
        response: Dict[str, Any],
        debug: bool
    ) -> QueryResult:
        """Parse GLM response into QueryResult.

        Args:
            input_text: Original input text
            response: Raw JSON response from GLM
            debug: Whether to include metadata

        Returns:
            Parsed QueryResult

        Raises:
            GLMValidationError: If response structure is invalid
        """
        if "queries" not in response:
            raise GLMValidationError("Response missing 'queries' field")

        queries = response.get("queries", {})
        if not queries:
            raise GLMValidationError("No queries generated")

        meta = None
        if debug:
            meta = {
                "timestamp": datetime.now().isoformat(),
                "model": self.model
            }

        return QueryResult(
            input=input_text,
            queries=queries,
            meta=meta
        )

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
