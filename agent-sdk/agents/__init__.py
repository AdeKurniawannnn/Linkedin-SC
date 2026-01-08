"""Multi-agent query generation team.

This package contains specialist agents for the query generation workflow:
- QueryBrainstormer: Generates initial query variants
- QueryScorer: Scores queries based on multiple criteria
- QueryOptimizer: Optimizes queries based on scores
"""

from .brainstormer import create_brainstormer_agent, BRAINSTORMER_INSTRUCTIONS
from .scorer import create_scorer_agent, SCORER_INSTRUCTIONS
from .optimizer import create_optimizer_agent, OPTIMIZER_INSTRUCTIONS

__all__ = [
    "create_brainstormer_agent",
    "create_scorer_agent",
    "create_optimizer_agent",
    "BRAINSTORMER_INSTRUCTIONS",
    "SCORER_INSTRUCTIONS",
    "OPTIMIZER_INSTRUCTIONS",
]
