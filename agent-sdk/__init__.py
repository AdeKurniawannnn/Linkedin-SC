"""LinkedIn Query Generation SDK using Agno Framework.

This package provides two approaches for generating LinkedIn search queries:

1. **Single Agent** (agent.py) - Simple, backward-compatible interface
   >>> from agent_sdk import QueryAgent
   >>> agent = QueryAgent()
   >>> result = agent.generate_variants_sync("CEO Jakarta fintech", count=10)

2. **Multi-Agent Team** (team.py) - Advanced iterative optimization
   >>> from agent_sdk import QueryTeam
   >>> team = QueryTeam()
   >>> result = team.generate_sync("CEO Jakarta fintech", max_generations=3)

Both use GLM-4.7 via Z.ai's OpenAI-compatible API.
"""

from .agent import (
    QueryAgent,
    QueryResult,
    get_agent,
    get_agent_os,
    get_app,
)

from .team import QueryTeam, QueryGenerationResult

from .schemas import (
    GeneratedQueries,
    ScoredQueries,
    ScoredQuery,
    QueryScore,
    OptimizedQueries,
    GenerationSummary,
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

__version__ = "4.0.0"
__all__ = [
    # Single Agent (simple interface)
    "QueryAgent",
    "QueryResult",
    "get_agent",
    "get_agent_os",
    "get_app",
    # Multi-Agent Team (advanced interface)
    "QueryTeam",
    "QueryGenerationResult",
    # Schemas
    "GeneratedQueries",
    "ScoredQueries",
    "ScoredQuery",
    "QueryScore",
    "OptimizedQueries",
    "GenerationSummary",
    # Backward compatibility
    "GLMQueryAgent",
    "GLMQueryError",
    "GLMTimeoutError",
    "GLMValidationError",
    "GLMAuthError",
]
