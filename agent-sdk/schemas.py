"""Pydantic schemas for multi-agent query generation team.

This module defines structured output schemas for the query generation workflow:
- GeneratedQueries: Output from QueryBrainstormer
- ScoredQuery: Individual query with scores
- ScoredQueries: Output from QueryScorer
- OptimizedQueries: Output from QueryOptimizer
- QueryGenerationResult: Final workflow output with all generations
"""

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


# Focus types supported by the system
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


class QueryScore(BaseModel):
    """Scoring for a single query across multiple dimensions."""

    coverage: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="How many relevant profiles it would capture (0-10, higher = broader reach)",
    )
    precision: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="How targeted to the specific intent (0-10, higher = more precise)",
    )
    relevance: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="How well it matches the original input (0-10)",
    )
    uniqueness: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="How different from other queries in the set (0-10)",
    )
    executability: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="Will it work well with Google SERP - length, operators, syntax (0-10)",
    )

    @property
    def total_score(self) -> float:
        """Calculate weighted total score."""
        weights = {
            "coverage": 0.20,
            "precision": 0.25,
            "relevance": 0.25,
            "uniqueness": 0.15,
            "executability": 0.15,
        }
        return (
            self.coverage * weights["coverage"]
            + self.precision * weights["precision"]
            + self.relevance * weights["relevance"]
            + self.uniqueness * weights["uniqueness"]
            + self.executability * weights["executability"]
        )


class ScoredQuery(BaseModel):
    """A single query with its type, content, and scores."""

    query_type: str = Field(..., description="The focus type (broad, narrow, etc.)")
    query: str = Field(..., description="The actual query string")
    scores: QueryScore = Field(..., description="Multi-dimensional scores")
    total_score: float = Field(..., ge=0.0, le=10.0, description="Weighted total score")
    strengths: List[str] = Field(default_factory=list, description="What this query does well")
    weaknesses: List[str] = Field(default_factory=list, description="Areas for improvement")


class GeneratedQueries(BaseModel):
    """Output from QueryBrainstormer - initial query variants."""

    input: str = Field(..., description="Original natural language input")
    queries: Dict[str, List[str]] = Field(
        ...,
        description="Generated queries by type (each type maps to list of variants)",
    )
    generation: int = Field(default=1, description="Generation number (1, 2, or 3)")
    rationale: Optional[str] = Field(
        default=None,
        description="Brief explanation of generation strategy",
    )

    @field_validator("queries")
    @classmethod
    def validate_queries(cls, v):
        """Ensure at least one query is generated."""
        if not v:
            raise ValueError("No queries generated")

        total_queries = sum(len(queries) for queries in v.values())
        if total_queries == 0:
            raise ValueError("No valid queries generated (all empty)")

        return v

    @property
    def total_count(self) -> int:
        """Total number of queries across all types."""
        return sum(len(queries) for queries in self.queries.values())

    def flatten(self) -> List[tuple]:
        """Return flat list of (type, query) tuples."""
        result = []
        for query_type, queries in self.queries.items():
            for query in queries:
                result.append((query_type, query))
        return result


class ScoredQueries(BaseModel):
    """Output from QueryScorer - queries with scores and analysis."""

    input: str = Field(..., description="Original natural language input")
    scored_queries: List[ScoredQuery] = Field(
        ...,
        description="All queries with their scores",
    )
    generation: int = Field(..., description="Which generation these scores are for")
    average_score: float = Field(..., description="Average total score across all queries")
    best_query: Optional[ScoredQuery] = Field(
        default=None,
        description="Highest scoring query",
    )
    worst_query: Optional[ScoredQuery] = Field(
        default=None,
        description="Lowest scoring query",
    )
    improvement_suggestions: List[str] = Field(
        default_factory=list,
        description="Suggestions for next generation",
    )

    @property
    def top_queries(self) -> List[ScoredQuery]:
        """Return top 5 queries by total score."""
        return sorted(self.scored_queries, key=lambda q: q.total_score, reverse=True)[:5]

    @property
    def bottom_queries(self) -> List[ScoredQuery]:
        """Return bottom 3 queries by total score."""
        return sorted(self.scored_queries, key=lambda q: q.total_score)[:3]


class OptimizationFeedback(BaseModel):
    """Feedback for a specific query optimization."""

    original_query: str = Field(..., description="The original query")
    original_score: float = Field(..., description="Original total score")
    optimized_query: str = Field(..., description="The optimized query")
    changes_made: List[str] = Field(
        default_factory=list,
        description="List of changes made",
    )
    expected_improvement: str = Field(
        default="",
        description="Expected score improvement and why",
    )


class OptimizedQueries(BaseModel):
    """Output from QueryOptimizer - improved queries based on scores."""

    input: str = Field(..., description="Original natural language input")
    queries: Dict[str, List[str]] = Field(
        ...,
        description="Optimized queries by type",
    )
    generation: int = Field(..., description="Generation number (2 or 3)")
    optimization_strategy: str = Field(
        ...,
        description="Overall optimization strategy used",
    )
    feedback: List[OptimizationFeedback] = Field(
        default_factory=list,
        description="Detailed feedback on key optimizations",
    )

    @property
    def total_count(self) -> int:
        """Total number of queries across all types."""
        return sum(len(queries) for queries in self.queries.values())


class GenerationSummary(BaseModel):
    """Summary of a single generation's performance."""

    generation: int = Field(..., description="Generation number")
    query_count: int = Field(..., description="Number of queries in this generation")
    average_score: float = Field(..., description="Average total score")
    best_score: float = Field(..., description="Highest score in this generation")
    worst_score: float = Field(..., description="Lowest score in this generation")
    top_queries: List[str] = Field(
        default_factory=list,
        description="Top 3 queries from this generation",
    )


class QueryGenerationResult(BaseModel):
    """Final output from the multi-agent query generation workflow.

    Contains all generations, scores, and final recommendations.
    """

    input: str = Field(..., description="Original natural language input")
    generations: List[GenerationSummary] = Field(
        default_factory=list,
        description="Summary of each generation",
    )
    final_queries: Dict[str, List[str]] = Field(
        ...,
        description="Best queries from all generations by type",
    )
    all_scored_queries: List[ScoredQuery] = Field(
        default_factory=list,
        description="All queries with scores from all generations",
    )
    recommended_queries: List[ScoredQuery] = Field(
        default_factory=list,
        description="Top recommended queries (score > 7.0)",
    )
    total_generations: int = Field(default=1, description="Number of generations completed")
    final_average_score: float = Field(
        default=0.0,
        description="Average score of final generation",
    )
    improvement_from_gen1: float = Field(
        default=0.0,
        description="Score improvement from generation 1 to final",
    )
    meta: Optional[Dict[str, str]] = Field(
        default=None,
        description="Optional metadata (timestamp, model, timing)",
    )

    @property
    def top_10_queries(self) -> List[ScoredQuery]:
        """Return top 10 queries by total score across all generations."""
        return sorted(
            self.all_scored_queries,
            key=lambda q: q.total_score,
            reverse=True,
        )[:10]

    def get_queries_by_type(self, query_type: str) -> List[ScoredQuery]:
        """Get all queries of a specific type."""
        return [q for q in self.all_scored_queries if q.query_type == query_type]
