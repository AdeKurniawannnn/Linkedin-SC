"""LinkedIn Query Agent using Agno Framework.

This package provides a LinkedIn query generation agent powered by GLM 4.7
through the Agno framework.

Example:
    >>> from agent_sdk import QueryAgent
    >>> agent = QueryAgent()
    >>> result = agent.generate_variants_sync("CEO Jakarta fintech")
    >>> for query_type, query in result.queries.items():
    ...     print(f"{query_type}: {query}")
"""

from .agent import (
    QueryAgent,
    QueryResult,
    get_agent,
    get_agent_os,
    get_app,
)


# Backward compatibility exception classes
class GLMQueryError(Exception):
    """Base exception for GLM query errors."""
    pass


class GLMTimeoutError(GLMQueryError):
    """Raised when GLM query times out."""
    pass


class GLMValidationError(GLMQueryError):
    """Raised when GLM query validation fails."""
    pass


class GLMAuthError(GLMQueryError):
    """Raised when GLM authentication fails."""
    pass


# Backward compatibility aliases
GLMQueryAgent = QueryAgent

__version__ = "3.0.0"
__all__ = [
    "QueryAgent",
    "QueryResult",
    "get_agent",
    "get_agent_os",
    "get_app",
    # Backward compatibility
    "GLMQueryAgent",
    "GLMQueryError",
    "GLMTimeoutError",
    "GLMValidationError",
    "GLMAuthError",
]
