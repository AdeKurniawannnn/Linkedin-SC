"""GLM Query Agent using Claude Agent SDK.

This package provides a LinkedIn query generation agent powered by GLM 4.7
through the Claude Agent SDK.

Example:
    >>> from agent_sdk import GLMQueryAgent
    >>> agent = GLMQueryAgent()
    >>> result = agent.generate_variants_sync("CEO Jakarta fintech")
    >>> for variant in result.variants:
    ...     print(f"{variant.strategy_type}: {variant.query}")
"""

from .agent import (
    GLMQueryAgent,
    GLMQueryError,
    GLMTimeoutError,
    GLMValidationError,
    GLMAuthError,
    QueryVariant,
    QueryResult
)

__version__ = "1.0.0"
__all__ = [
    "GLMQueryAgent",
    "GLMQueryError",
    "GLMTimeoutError",
    "GLMValidationError",
    "GLMAuthError",
    "QueryVariant",
    "QueryResult"
]
