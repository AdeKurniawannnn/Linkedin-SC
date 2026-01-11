"""LinkedIn Query Generator using Agno Framework.

Single-pass query generation with intelligent expansion.

Example:
    >>> from agent_sdk import QueryGenerator
    >>> gen = QueryGenerator()
    >>> result = gen.generate_sync("CEO Jakarta fintech", count=5)
    >>> for query in result.queries:
    ...     print(query)
"""

from .generator import (
    QueryGenerator,
    QueryGeneratorError,
    QueryAuthError,
    QueryValidationError,
    QueryTimeoutError,
)
from .simple_schemas import SimpleQueryResult

# Backward compatibility (deprecated)
from .agent import (
    GLMQueryAgent,
    GLMQueryError,
    GLMTimeoutError,
    GLMValidationError,
    GLMAuthError,
    QueryResult,
)

__version__ = "3.0.0"
__all__ = [
    # New API
    "QueryGenerator",
    "SimpleQueryResult",
    "QueryGeneratorError",
    "QueryAuthError",
    "QueryValidationError",
    "QueryTimeoutError",
    # Deprecated (backward compat)
    "GLMQueryAgent",
    "GLMQueryError",
    "GLMTimeoutError",
    "GLMValidationError",
    "GLMAuthError",
    "QueryResult",
]
