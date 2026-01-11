"""Multi-Agent Query Generation Team using Agno Framework.

This module orchestrates the query generation workflow with three specialist agents:
1. QueryBrainstormer - Generates initial query variants
2. QueryScorer - Scores queries based on multiple criteria
3. QueryOptimizer - Optimizes queries based on scores

The workflow runs up to 3 generations with iterative optimization.

Example:
    >>> from team import QueryTeam
    >>> team = QueryTeam()
    >>> result = await team.generate("CEO Jakarta fintech", count=10, max_generations=3)
    >>> print(f"Final average score: {result.final_average_score}")
    >>> for q in result.top_10_queries:
    ...     print(f"{q.query_type}: {q.total_score:.1f} - {q.query[:50]}...")
"""

import asyncio
import json
import os
import re
from datetime import datetime
from typing import Dict, List, Literal, Optional

from dotenv import load_dotenv
from pydantic import BaseModel

# Support both package imports and direct execution
try:
    from .agents.brainstormer import get_brainstormer_agent
    from .agents.scorer import get_scorer_agent
    from .agents.optimizer import get_optimizer_agent
    from .schemas import (
        GeneratedQueries,
        GenerationSummary,
        OptimizationFeedback,
        OptimizedQueries,
        QueryGenerationResult,
        QueryScore,
        ScoredQueries,
        ScoredQuery,
    )
except ImportError:
    from agents.brainstormer import get_brainstormer_agent
    from agents.scorer import get_scorer_agent
    from agents.optimizer import get_optimizer_agent
    from schemas import (
        GeneratedQueries,
        GenerationSummary,
        OptimizationFeedback,
        OptimizedQueries,
        QueryGenerationResult,
        QueryScore,
        ScoredQueries,
        ScoredQuery,
    )

load_dotenv()


# Configuration
DEFAULT_MODEL = os.getenv("GLM_MODEL", "GLM-4.7")
DEFAULT_BASE_URL = os.getenv("GLM_BASE_URL", "https://api.z.ai/api/coding/paas/v4")
QUALITY_THRESHOLD = 7.5  # Stop optimization if average score exceeds this


def extract_json_from_response(response_text: str) -> dict:
    """Extract JSON from agent response, handling markdown code blocks."""
    if not response_text:
        raise ValueError("Empty response from agent")

    # Try direct JSON parse first
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass

    # Try extracting from markdown code blocks
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try finding JSON object in text
    json_match = re.search(r"\{[\s\S]*\}", response_text)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON from response: {response_text[:500]}")


class QueryTeam:
    """Multi-agent query generation team with iterative optimization.

    This class orchestrates three specialist agents in a workflow:
    1. Brainstormer generates initial query variants
    2. Scorer evaluates queries across 5 dimensions
    3. Optimizer improves queries based on scores

    The workflow iterates up to max_generations times, stopping early
    if the quality threshold is reached.

    Attributes:
        VALID_FOCUS_TYPES: Set of valid focus type strings

    Example:
        >>> team = QueryTeam()
        >>> result = await team.generate("CEO Jakarta fintech", count=10)
        >>> print(result.final_average_score)
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
        model: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 120,
    ):
        """Initialize the Query Team.

        Args:
            model: Model name (default: GLM-4.7)
            base_url: API base URL (default: Z.ai endpoint)
            timeout: Timeout for each agent call in seconds
        """
        self.model = model or DEFAULT_MODEL
        self.base_url = base_url or DEFAULT_BASE_URL
        self.timeout = timeout

        # Get memoized agents (avoids recreation in loops)
        self.brainstormer = get_brainstormer_agent(
            model=self.model, base_url=self.base_url, timeout=timeout
        )
        self.scorer = get_scorer_agent(
            model=self.model, base_url=self.base_url, timeout=timeout
        )
        self.optimizer = get_optimizer_agent(
            model=self.model, base_url=self.base_url, timeout=timeout
        )

    async def _generate_queries(
        self,
        input_text: str,
        count: int,
        focus: Optional[str],
        generation: int,
        previous_scores: Optional[ScoredQueries] = None,
    ) -> GeneratedQueries:
        """Generate query variants using the brainstormer agent.

        Args:
            input_text: Natural language input
            count: Number of queries to generate
            focus: Optional focus type
            generation: Current generation number
            previous_scores: Scores from previous generation (for optimization context)

        Returns:
            GeneratedQueries with variants by type
        """
        # Build context-aware prompt with full instructions
        # (Z.ai API doesn't support system role, so instructions go in the prompt)
        base_instructions = """You are an expert LinkedIn lead generation query builder.

## QUERY PATTERN
site:linkedin.com/in [LOCATION_TERMS] [SENIORITY_TERMS] [INDUSTRY_TERMS] [EXCLUSIONS]

## EXPANSION RULES
- Locations: Include city + metro area + regional variants (e.g., "Jakarta" -> Jakarta, "Greater Jakarta", Jabodetabek)
- Titles: Include acronym AND full form (CEO / "Chief Executive Officer"), plus related roles (Founder, President)
- Industries: Expand to sub-verticals (fintech -> fintech, "financial technology", payment, lending)
- Use OR operators for synonyms: (term1 OR "term 2")
- Use quotes for multi-word phrases

## STANDARD EXCLUSIONS (ALWAYS INCLUDE)
-recruiter -hr -"human resources" -intern -student -graduate -trainer -consultant -freelance

## 10 QUERY TYPES
1. broad: Maximum reach, 3-4 location variants, expanded synonyms
2. narrow: Maximum precision, exact terms only
3. balanced: Middle ground, 2 variants per category
4. industry_focused: Deep industry vertical expansion
5. seniority_focused: Comprehensive executive title coverage
6. location_focused: Deep geographic expansion
7. ultra_broad: Maximum expansion all dimensions
8. ultra_narrow: Single exact term per category
9. decision_maker: Budget holders and purchasing influencers
10. emerging_market: Local title variants for emerging markets"""

        if generation == 1:
            prompt = f"""{base_instructions}

## TASK
Generate {count} LinkedIn search query variants for:
INPUT: "{input_text}"
FOCUS: {focus or "balanced mix of all types"}

This is Generation 1 - focus on breadth and diversity.
Cover multiple query types with varied expansion strategies.

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no explanation):
{{
  "input": "{input_text}",
  "queries": {{
    "broad": ["query1", "query2"],
    "narrow": ["query1"],
    "balanced": ["query1"]
  }},
  "generation": 1,
  "rationale": "Brief strategy explanation"
}}"""
        else:
            # Include feedback from previous generation
            feedback = ""
            if previous_scores:
                feedback = f"""
## PREVIOUS GENERATION SCORES
- Average score: {previous_scores.average_score:.1f}/10
- Best query: {previous_scores.best_query.total_score if previous_scores.best_query else 'N/A'}
- Worst query: {previous_scores.worst_query.total_score if previous_scores.worst_query else 'N/A'}

## IMPROVEMENT SUGGESTIONS
{chr(10).join(f"- {s}" for s in previous_scores.improvement_suggestions[:5])}

## LOW-SCORING QUERIES TO IMPROVE
{chr(10).join(f"- [{q.query_type}] {q.total_score:.1f}: {q.query[:70]}..." for q in previous_scores.bottom_queries[:3])}

## HIGH-SCORING PATTERNS TO PRESERVE
{chr(10).join(f"- [{q.query_type}] {q.total_score:.1f}: {q.query[:70]}..." for q in previous_scores.top_queries[:3])}
"""

            prompt = f"""{base_instructions}

## TASK
Generate {count} OPTIMIZED LinkedIn search query variants for:
INPUT: "{input_text}"
FOCUS: {focus or "balanced mix of all types"}

This is Generation {generation} - focus on OPTIMIZATION based on previous scores.
{feedback}

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no explanation):
{{
  "input": "{input_text}",
  "queries": {{
    "broad": ["improved_query1", "improved_query2"],
    "narrow": ["improved_query1"]
  }},
  "generation": {generation},
  "rationale": "Optimization strategy explanation"
}}"""

        response = await self.brainstormer.arun(prompt)
        result_text = response.content if hasattr(response, "content") else str(response)

        # Parse response
        data = extract_json_from_response(result_text)

        return GeneratedQueries(
            input=input_text,
            queries={k: v if isinstance(v, list) else [v] for k, v in data.get("queries", {}).items()},
            generation=generation,
            rationale=data.get("rationale"),
        )

    async def _score_queries(
        self,
        input_text: str,
        queries: GeneratedQueries,
    ) -> ScoredQueries:
        """Score queries using the scorer agent.

        Args:
            input_text: Original input for relevance comparison
            queries: Generated queries to score

        Returns:
            ScoredQueries with individual and aggregate scores
        """
        # Flatten queries for scoring
        query_list = queries.flatten()

        prompt = f"""You are an expert LinkedIn query analyst. Score these queries for the input: "{input_text}"

## SCORING DIMENSIONS (0-10 scale)

1. **coverage** (20% weight): How many relevant profiles would it capture?
   - 10: Maximum reach | 5: Moderate | 1: Very limited

2. **precision** (25% weight): How targeted to the specific intent?
   - 10: Laser-focused | 5: Some noise | 1: Lots of irrelevant results

3. **relevance** (25% weight): How well does it match the original input?
   - 10: Perfect interpretation | 5: Partial match | 1: Off-target

4. **uniqueness** (15% weight): How different from other queries in this set?
   - 10: Completely unique | 5: Some overlap | 1: Near-duplicate

5. **executability** (15% weight): Will it work well with Google SERP?
   - 10: Optimal syntax/length | 5: May have issues | 1: Invalid/too long

## QUERIES TO SCORE
{chr(10).join(f"{i+1}. [{qt}] {q}" for i, (qt, q) in enumerate(query_list))}

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown, no explanation):
{{
  "scored_queries": [
    {{
      "query_type": "broad",
      "query": "the actual query string",
      "scores": {{
        "coverage": 8.0,
        "precision": 7.0,
        "relevance": 9.0,
        "uniqueness": 6.0,
        "executability": 8.0
      }},
      "total_score": 7.6,
      "strengths": ["good expansion", "proper exclusions"],
      "weaknesses": ["similar to another query"]
    }}
  ],
  "improvement_suggestions": [
    "Add more location variants",
    "Consider industry sub-verticals"
  ]
}}"""

        response = await self.scorer.arun(prompt)
        result_text = response.content if hasattr(response, "content") else str(response)

        # Parse response
        data = extract_json_from_response(result_text)

        # Build ScoredQuery objects
        scored_queries = []
        for sq in data.get("scored_queries", []):
            scores_data = sq.get("scores", {})
            score = QueryScore(
                coverage=float(scores_data.get("coverage", 5.0)),
                precision=float(scores_data.get("precision", 5.0)),
                relevance=float(scores_data.get("relevance", 5.0)),
                uniqueness=float(scores_data.get("uniqueness", 5.0)),
                executability=float(scores_data.get("executability", 5.0)),
            )
            scored_queries.append(
                ScoredQuery(
                    query_type=sq.get("query_type", "unknown"),
                    query=sq.get("query", ""),
                    scores=score,
                    total_score=float(sq.get("total_score", score.total_score)),
                    strengths=sq.get("strengths", []),
                    weaknesses=sq.get("weaknesses", []),
                )
            )

        # Calculate aggregate metrics
        avg_score = sum(q.total_score for q in scored_queries) / len(scored_queries) if scored_queries else 0.0
        best = max(scored_queries, key=lambda q: q.total_score) if scored_queries else None
        worst = min(scored_queries, key=lambda q: q.total_score) if scored_queries else None

        return ScoredQueries(
            input=input_text,
            scored_queries=scored_queries,
            generation=queries.generation,
            average_score=avg_score,
            best_query=best,
            worst_query=worst,
            improvement_suggestions=data.get("improvement_suggestions", []),
        )

    async def generate(
        self,
        input_text: str,
        count: int = 10,
        focus: Optional[str] = None,
        max_generations: int = 3,
        quality_threshold: float = QUALITY_THRESHOLD,
        debug: bool = False,
    ) -> QueryGenerationResult:
        """Generate optimized query variants with iterative refinement.

        This is the main entry point for the query generation workflow.
        It runs up to max_generations iterations, with each generation
        being scored and optimized based on the previous one.

        Args:
            input_text: Natural language input (e.g., "CEO Jakarta fintech")
            count: Number of query variants per generation (1-30)
            focus: Optional focus type (broad, narrow, balanced, etc.)
            max_generations: Maximum number of optimization iterations (1-3)
            quality_threshold: Stop early if average score exceeds this (default: 7.5)
            debug: Include timing metadata in output

        Returns:
            QueryGenerationResult with all generations, scores, and recommendations

        Raises:
            ValueError: If input is empty or parameters are invalid
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

        if not 1 <= max_generations <= 3:
            raise ValueError("max_generations must be between 1 and 3")

        start_time = datetime.now()

        # Track all generations
        all_scored_queries: List[ScoredQuery] = []
        generation_summaries: List[GenerationSummary] = []
        previous_scores: Optional[ScoredQueries] = None
        final_queries: Dict[str, List[str]] = {}

        for gen in range(1, max_generations + 1):
            # Generate queries
            queries = await self._generate_queries(
                input_text=input_text,
                count=count,
                focus=focus,
                generation=gen,
                previous_scores=previous_scores,
            )

            # Score queries
            scores = await self._score_queries(input_text, queries)

            # Store results
            all_scored_queries.extend(scores.scored_queries)

            # Create generation summary
            summary = GenerationSummary(
                generation=gen,
                query_count=len(scores.scored_queries),
                average_score=scores.average_score,
                best_score=scores.best_query.total_score if scores.best_query else 0.0,
                worst_score=scores.worst_query.total_score if scores.worst_query else 0.0,
                top_queries=[q.query[:100] for q in scores.top_queries[:3]],
            )
            generation_summaries.append(summary)

            # Update final queries (keep best from each type across generations)
            for sq in scores.scored_queries:
                if sq.query_type not in final_queries:
                    final_queries[sq.query_type] = []
                # Keep top 3 per type
                type_queries = [(sq.query, sq.total_score) for sq in all_scored_queries if sq.query_type == sq.query_type]
                type_queries.sort(key=lambda x: x[1], reverse=True)
                final_queries[sq.query_type] = [q for q, _ in type_queries[:3]]

            # Check quality threshold
            if scores.average_score >= quality_threshold:
                break

            # Save for next generation
            previous_scores = scores

        # Calculate final metrics
        final_avg = generation_summaries[-1].average_score
        improvement = final_avg - generation_summaries[0].average_score if len(generation_summaries) > 1 else 0.0

        # Get recommended queries (score > 7.0)
        recommended = [q for q in all_scored_queries if q.total_score >= 7.0]
        recommended.sort(key=lambda q: q.total_score, reverse=True)

        # Deduplicate final queries by type
        for qtype in final_queries:
            seen = set()
            unique = []
            for q in final_queries[qtype]:
                if q not in seen:
                    seen.add(q)
                    unique.append(q)
            final_queries[qtype] = unique[:3]

        # Build result
        meta = None
        if debug:
            meta = {
                "timestamp": datetime.now().isoformat(),
                "model": self.model,
                "duration_seconds": str((datetime.now() - start_time).total_seconds()),
                "generations_completed": str(len(generation_summaries)),
            }

        return QueryGenerationResult(
            input=input_text,
            generations=generation_summaries,
            final_queries=final_queries,
            all_scored_queries=all_scored_queries,
            recommended_queries=recommended[:10],
            total_generations=len(generation_summaries),
            final_average_score=final_avg,
            improvement_from_gen1=improvement,
            meta=meta,
        )

    def generate_sync(
        self,
        input_text: str,
        count: int = 10,
        focus: Optional[str] = None,
        max_generations: int = 3,
        quality_threshold: float = QUALITY_THRESHOLD,
        debug: bool = False,
    ) -> QueryGenerationResult:
        """Synchronous wrapper for generate().

        Args:
            input_text: Natural language input
            count: Number of query variants per generation
            focus: Optional focus type
            max_generations: Maximum optimization iterations
            quality_threshold: Early stop threshold
            debug: Include metadata in output

        Returns:
            QueryGenerationResult with all generations and scores
        """
        return asyncio.run(
            self.generate(
                input_text=input_text,
                count=count,
                focus=focus,
                max_generations=max_generations,
                quality_threshold=quality_threshold,
                debug=debug,
            )
        )


if __name__ == "__main__":
    """CLI for Query Team.

    Usage:
        python team.py "CEO Jakarta fintech"
        python team.py "CTO Singapore AI" --count 15 --generations 2
    """
    import argparse

    parser = argparse.ArgumentParser(
        description="Multi-Agent Query Generation Team",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python team.py "CEO Jakarta fintech"
  python team.py "CTO Singapore AI" --count 15 --generations 2
  python team.py "VP Sales London SaaS" --focus seniority_focused --debug
        """,
    )
    parser.add_argument("query", help="Natural language query")
    parser.add_argument("-c", "--count", type=int, default=10, help="Queries per generation (1-30)")
    parser.add_argument("-g", "--generations", type=int, default=3, help="Max generations (1-3)")
    parser.add_argument("-f", "--focus", choices=list(QueryTeam.VALID_FOCUS_TYPES), help="Focus type")
    parser.add_argument("-t", "--threshold", type=float, default=7.5, help="Quality threshold")
    parser.add_argument("-d", "--debug", action="store_true", help="Include metadata")
    parser.add_argument("-o", "--output", help="Output file (default: stdout)")

    args = parser.parse_args()

    team = QueryTeam()
    try:
        result = team.generate_sync(
            input_text=args.query,
            count=args.count,
            focus=args.focus,
            max_generations=args.generations,
            quality_threshold=args.threshold,
            debug=args.debug,
        )

        # Format output
        output_data = {
            "input": result.input,
            "total_generations": result.total_generations,
            "final_average_score": round(result.final_average_score, 2),
            "improvement_from_gen1": round(result.improvement_from_gen1, 2),
            "generation_summaries": [
                {
                    "generation": g.generation,
                    "query_count": g.query_count,
                    "average_score": round(g.average_score, 2),
                    "best_score": round(g.best_score, 2),
                    "worst_score": round(g.worst_score, 2),
                }
                for g in result.generations
            ],
            "recommended_queries": [
                {
                    "type": q.query_type,
                    "query": q.query,
                    "score": round(q.total_score, 2),
                }
                for q in result.recommended_queries[:10]
            ],
            "final_queries": result.final_queries,
        }

        if result.meta:
            output_data["meta"] = result.meta

        output = json.dumps(output_data, indent=2)

        if args.output:
            with open(args.output, "w") as f:
                f.write(output)
            print(f"Saved to {args.output}")
        else:
            print(output)

    except ValueError as e:
        print(f"Error: {e}")
        exit(1)
