#!/usr/bin/env python
"""Test script for the Multi-Agent Query Generation Team.

This script provides comprehensive tests for the QueryTeam class,
including single generation, multi-generation optimization, and
focused generation tests.

Usage:
    python run_test.py                    # Run all tests
    python run_test.py --quick            # Run quick test only (1 generation)
    python run_test.py --query "your query"  # Test with custom query

Requirements:
    - ANTHROPIC_AUTH_TOKEN environment variable set
    - agno package installed: pip install agno
    - pydantic, python-dotenv installed
"""

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


# ANSI color codes for terminal output
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"
    END = "\033[0m"


def print_header(text: str):
    """Print a formatted header."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'=' * 70}{Colors.END}\n")


def print_success(text: str):
    """Print success message."""
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")


def print_error(text: str):
    """Print error message."""
    print(f"{Colors.RED}✗ {text}{Colors.END}")


def print_info(text: str):
    """Print info message."""
    print(f"{Colors.CYAN}→ {text}{Colors.END}")


def print_metric(label: str, value, unit: str = ""):
    """Print a metric with label."""
    print(f"  {Colors.YELLOW}{label}:{Colors.END} {value}{unit}")


def check_environment() -> bool:
    """Check that required environment variables are set."""
    print_header("Environment Check")

    api_key = os.getenv("ANTHROPIC_AUTH_TOKEN")
    if not api_key:
        print_error("ANTHROPIC_AUTH_TOKEN environment variable not set")
        print_info("Set it with: export ANTHROPIC_AUTH_TOKEN='your-key'")
        print_info("Get your key at: https://docs.z.ai/")
        return False

    print_success("ANTHROPIC_AUTH_TOKEN is set")
    print_metric("API Key", f"{api_key[:10]}...{api_key[-4:]}")
    print_metric("Model", os.getenv("GLM_MODEL", "GLM-4.7"))
    print_metric("Base URL", os.getenv("GLM_BASE_URL", "https://api.z.ai/api/coding/paas/v4"))

    return True


async def test_single_generation(query: str = "CEO Jakarta fintech") -> dict:
    """Test single generation without optimization.

    Args:
        query: Natural language query to test

    Returns:
        Test result dict with status and metrics
    """
    from team import QueryTeam

    print_header(f"Test: Single Generation")
    print_info(f"Query: \"{query}\"")
    print_info("Generations: 1 (no optimization)")
    print()

    team = QueryTeam()
    start = datetime.now()

    try:
        result = await team.generate(
            input_text=query,
            count=5,
            max_generations=1,
            debug=True,
        )

        elapsed = (datetime.now() - start).total_seconds()

        print_success(f"Completed in {elapsed:.1f} seconds")
        print()
        print_metric("Generations", result.total_generations)
        print_metric("Average Score", f"{result.final_average_score:.2f}", "/10")
        print_metric("Total Queries", len(result.all_scored_queries))

        print(f"\n{Colors.BOLD}Top 5 Queries:{Colors.END}")
        for i, q in enumerate(result.top_10_queries[:5], 1):
            score_color = Colors.GREEN if q.total_score >= 7 else Colors.YELLOW if q.total_score >= 5 else Colors.RED
            print(f"  {i}. [{q.query_type}] {score_color}{q.total_score:.1f}{Colors.END}")
            print(f"     {q.query[:70]}...")

        return {
            "status": "passed",
            "elapsed": elapsed,
            "average_score": result.final_average_score,
            "query_count": len(result.all_scored_queries),
        }

    except Exception as e:
        print_error(f"Test failed: {e}")
        return {"status": "failed", "error": str(e)}


async def test_multi_generation(query: str = "CTO Singapore artificial intelligence startup") -> dict:
    """Test multi-generation optimization.

    Args:
        query: Natural language query to test

    Returns:
        Test result dict with status and metrics
    """
    from team import QueryTeam

    print_header(f"Test: Multi-Generation Optimization")
    print_info(f"Query: \"{query}\"")
    print_info("Max Generations: 3")
    print_info("Quality Threshold: 8.0")
    print()

    team = QueryTeam()
    start = datetime.now()

    try:
        result = await team.generate(
            input_text=query,
            count=10,
            max_generations=3,
            quality_threshold=8.0,
            debug=True,
        )

        elapsed = (datetime.now() - start).total_seconds()

        print_success(f"Completed in {elapsed:.1f} seconds")
        print()
        print_metric("Generations Completed", result.total_generations)
        print_metric("Final Average Score", f"{result.final_average_score:.2f}", "/10")

        improvement_color = Colors.GREEN if result.improvement_from_gen1 > 0 else Colors.RED
        print_metric("Improvement", f"{improvement_color}{result.improvement_from_gen1:+.2f}{Colors.END}")

        print(f"\n{Colors.BOLD}Generation Summaries:{Colors.END}")
        for g in result.generations:
            trend = "→" if g.generation == 1 else ("↑" if g.average_score > result.generations[g.generation-2].average_score else "↓")
            print(f"  Gen {g.generation}: avg={g.average_score:.2f}, best={g.best_score:.2f}, worst={g.worst_score:.2f} {trend}")

        print(f"\n{Colors.BOLD}Recommended Queries (score >= 7.0): {len(result.recommended_queries)}{Colors.END}")
        for i, q in enumerate(result.recommended_queries[:5], 1):
            print(f"  {i}. [{q.query_type}] {Colors.GREEN}{q.total_score:.1f}{Colors.END}")
            print(f"     {q.query[:70]}...")

        return {
            "status": "passed",
            "elapsed": elapsed,
            "generations": result.total_generations,
            "final_score": result.final_average_score,
            "improvement": result.improvement_from_gen1,
            "recommended_count": len(result.recommended_queries),
        }

    except Exception as e:
        print_error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
        return {"status": "failed", "error": str(e)}


async def test_focused_generation(
    query: str = "VP Sales London enterprise software",
    focus: str = "seniority_focused"
) -> dict:
    """Test generation with specific focus type.

    Args:
        query: Natural language query to test
        focus: Focus type to use

    Returns:
        Test result dict with status and metrics
    """
    from team import QueryTeam

    print_header(f"Test: Focused Generation ({focus})")
    print_info(f"Query: \"{query}\"")
    print_info(f"Focus: {focus}")
    print_info("Generations: 2")
    print()

    team = QueryTeam()
    start = datetime.now()

    try:
        result = await team.generate(
            input_text=query,
            count=8,
            focus=focus,
            max_generations=2,
            debug=True,
        )

        elapsed = (datetime.now() - start).total_seconds()

        print_success(f"Completed in {elapsed:.1f} seconds")
        print()
        print_metric("Final Average Score", f"{result.final_average_score:.2f}", "/10")

        # Check focus type queries
        focus_queries = result.get_queries_by_type(focus)
        print(f"\n{Colors.BOLD}{focus.replace('_', ' ').title()} Queries: {len(focus_queries)}{Colors.END}")
        for q in focus_queries[:3]:
            print(f"  Score {q.total_score:.1f}: {q.query[:65]}...")

        # Show distribution by type
        print(f"\n{Colors.BOLD}Query Distribution by Type:{Colors.END}")
        type_counts = {}
        for q in result.all_scored_queries:
            type_counts[q.query_type] = type_counts.get(q.query_type, 0) + 1

        for qtype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
            bar = "█" * count
            print(f"  {qtype:20} {bar} ({count})")

        return {
            "status": "passed",
            "elapsed": elapsed,
            "final_score": result.final_average_score,
            "focus_query_count": len(focus_queries),
        }

    except Exception as e:
        print_error(f"Test failed: {e}")
        return {"status": "failed", "error": str(e)}


async def test_edge_cases() -> dict:
    """Test edge cases and error handling."""
    from team import QueryTeam

    print_header("Test: Edge Cases")

    team = QueryTeam()
    results = []

    # Test 1: Minimum count
    print_info("Testing minimum count (1)...")
    try:
        result = await team.generate("CEO", count=1, max_generations=1)
        print_success(f"Min count test passed - {len(result.all_scored_queries)} queries")
        results.append(("min_count", "passed"))
    except Exception as e:
        print_error(f"Min count test failed: {e}")
        results.append(("min_count", "failed"))

    # Test 2: Empty input validation
    print_info("Testing empty input validation...")
    try:
        await team.generate("", count=5)
        print_error("Empty input should have raised ValueError")
        results.append(("empty_input", "failed"))
    except ValueError as e:
        print_success(f"Empty input correctly rejected: {e}")
        results.append(("empty_input", "passed"))
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        results.append(("empty_input", "failed"))

    # Test 3: Invalid focus type
    print_info("Testing invalid focus type...")
    try:
        await team.generate("CEO Jakarta", focus="invalid_focus")
        print_error("Invalid focus should have raised ValueError")
        results.append(("invalid_focus", "failed"))
    except ValueError as e:
        print_success(f"Invalid focus correctly rejected: {e}")
        results.append(("invalid_focus", "passed"))
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        results.append(("invalid_focus", "failed"))

    passed = sum(1 for _, status in results if status == "passed")
    return {
        "status": "passed" if passed == len(results) else "partial",
        "passed": passed,
        "total": len(results),
        "details": results,
    }


async def run_quick_test(query: str) -> None:
    """Run a quick test with minimal generations."""
    result = await test_single_generation(query)

    print_header("Quick Test Summary")
    if result["status"] == "passed":
        print_success("Quick test completed successfully!")
        print_metric("Time", f"{result['elapsed']:.1f}s")
        print_metric("Score", f"{result['average_score']:.2f}/10")
    else:
        print_error(f"Quick test failed: {result.get('error', 'Unknown error')}")


async def run_all_tests() -> None:
    """Run all tests in sequence."""
    print_header("Multi-Agent Query Team - Full Test Suite")
    print_info(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    results = {}

    # Test 1: Single generation
    results["single_gen"] = await test_single_generation()

    # Test 2: Multi-generation
    results["multi_gen"] = await test_multi_generation()

    # Test 3: Focused generation
    results["focused"] = await test_focused_generation()

    # Test 4: Edge cases
    results["edge_cases"] = await test_edge_cases()

    # Summary
    print_header("Test Suite Summary")

    passed = sum(1 for r in results.values() if r["status"] == "passed")
    total = len(results)

    for name, result in results.items():
        status_icon = "✓" if result["status"] == "passed" else "✗"
        status_color = Colors.GREEN if result["status"] == "passed" else Colors.RED
        print(f"  {status_color}{status_icon}{Colors.END} {name.replace('_', ' ').title()}")

    print()
    if passed == total:
        print(f"{Colors.GREEN}{Colors.BOLD}ALL {total} TESTS PASSED{Colors.END}")
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}{passed}/{total} TESTS PASSED{Colors.END}")

    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


async def run_custom_test(query: str, count: int, generations: int, focus: Optional[str]) -> None:
    """Run a custom test with user-specified parameters."""
    from team import QueryTeam

    print_header("Custom Test")
    print_info(f"Query: \"{query}\"")
    print_info(f"Count: {count}")
    print_info(f"Max Generations: {generations}")
    print_info(f"Focus: {focus or 'balanced'}")
    print()

    team = QueryTeam()
    start = datetime.now()

    result = await team.generate(
        input_text=query,
        count=count,
        focus=focus,
        max_generations=generations,
        debug=True,
    )

    elapsed = (datetime.now() - start).total_seconds()

    print_success(f"Completed in {elapsed:.1f} seconds")
    print()

    # Full output
    output = {
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
        "top_10_queries": [
            {
                "type": q.query_type,
                "query": q.query,
                "score": round(q.total_score, 2),
                "scores": {
                    "coverage": round(q.scores.coverage, 1),
                    "precision": round(q.scores.precision, 1),
                    "relevance": round(q.scores.relevance, 1),
                    "uniqueness": round(q.scores.uniqueness, 1),
                    "executability": round(q.scores.executability, 1),
                },
                "strengths": q.strengths[:2],
                "weaknesses": q.weaknesses[:2],
            }
            for q in result.top_10_queries
        ],
    }

    print(json.dumps(output, indent=2))


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Multi-Agent Query Team Test Suite",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_test.py                           # Run all tests
  python run_test.py --quick                   # Quick test (1 generation)
  python run_test.py --query "CEO Jakarta"     # Custom query
  python run_test.py --query "CTO" --count 15 --generations 3
  python run_test.py --query "VP Sales" --focus seniority_focused
        """,
    )
    parser.add_argument("--quick", action="store_true", help="Run quick test only")
    parser.add_argument("--query", "-q", type=str, help="Custom query to test")
    parser.add_argument("--count", "-c", type=int, default=10, help="Number of queries per generation")
    parser.add_argument("--generations", "-g", type=int, default=3, help="Max generations")
    parser.add_argument("--focus", "-f", type=str, help="Focus type")
    parser.add_argument("--edge-cases", action="store_true", help="Run edge case tests only")

    args = parser.parse_args()

    if not check_environment():
        sys.exit(1)

    try:
        if args.edge_cases:
            asyncio.run(test_edge_cases())
        elif args.quick:
            query = args.query or "CEO Jakarta fintech"
            asyncio.run(run_quick_test(query))
        elif args.query:
            asyncio.run(run_custom_test(
                query=args.query,
                count=args.count,
                generations=args.generations,
                focus=args.focus,
            ))
        else:
            asyncio.run(run_all_tests())

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.END}")
        sys.exit(130)
    except Exception as e:
        print_error(f"Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
