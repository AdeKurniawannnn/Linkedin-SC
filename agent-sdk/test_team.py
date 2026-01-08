"""Test script for the Multi-Agent Query Generation Team.

This script tests the QueryTeam class with a sample query.
Run with: python test_team.py

Requirements:
- ANTHROPIC_AUTH_TOKEN environment variable set
- agno package installed (pip install agno)
"""

import asyncio
import os
import sys
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()


def check_environment():
    """Check that required environment variables are set."""
    api_key = os.getenv("ANTHROPIC_AUTH_TOKEN")
    if not api_key:
        print("ERROR: ANTHROPIC_AUTH_TOKEN environment variable not set")
        print("Set it with: export ANTHROPIC_AUTH_TOKEN='your-key'")
        print("Get your key at: https://docs.z.ai/")
        return False

    print(f"API Key: {api_key[:10]}...{api_key[-4:]}")
    print(f"Model: {os.getenv('GLM_MODEL', 'GLM-4.7')}")
    print(f"Base URL: {os.getenv('GLM_BASE_URL', 'https://api.z.ai/api/coding/paas/v4')}")
    return True


async def test_single_generation():
    """Test single generation without optimization."""
    from team import QueryTeam

    print("\n" + "=" * 60)
    print("TEST: Single Generation (no optimization)")
    print("=" * 60)

    team = QueryTeam()
    start = datetime.now()

    result = await team.generate(
        input_text="CEO Jakarta fintech",
        count=5,
        max_generations=1,
        debug=True,
    )

    elapsed = (datetime.now() - start).total_seconds()

    print(f"\nCompleted in {elapsed:.1f} seconds")
    print(f"Generations: {result.total_generations}")
    print(f"Average Score: {result.final_average_score:.2f}")
    print(f"Total Queries: {len(result.all_scored_queries)}")

    print("\nTop 5 Queries:")
    for i, q in enumerate(result.top_10_queries[:5], 1):
        print(f"  {i}. [{q.query_type}] {q.total_score:.1f} - {q.query[:60]}...")

    return result


async def test_multi_generation():
    """Test multi-generation optimization."""
    from team import QueryTeam

    print("\n" + "=" * 60)
    print("TEST: Multi-Generation Optimization (3 generations)")
    print("=" * 60)

    team = QueryTeam()
    start = datetime.now()

    result = await team.generate(
        input_text="CTO Singapore artificial intelligence startup",
        count=10,
        max_generations=3,
        quality_threshold=8.0,
        debug=True,
    )

    elapsed = (datetime.now() - start).total_seconds()

    print(f"\nCompleted in {elapsed:.1f} seconds")
    print(f"Generations Completed: {result.total_generations}")
    print(f"Final Average Score: {result.final_average_score:.2f}")
    print(f"Improvement from Gen1: {result.improvement_from_gen1:+.2f}")

    print("\nGeneration Summaries:")
    for g in result.generations:
        print(f"  Gen {g.generation}: avg={g.average_score:.2f}, best={g.best_score:.2f}, worst={g.worst_score:.2f}")

    print(f"\nRecommended Queries (score >= 7.0): {len(result.recommended_queries)}")
    for i, q in enumerate(result.recommended_queries[:5], 1):
        print(f"  {i}. [{q.query_type}] {q.total_score:.1f}")
        print(f"     {q.query[:80]}...")

    print("\nFinal Queries by Type:")
    for qtype, queries in result.final_queries.items():
        if queries:
            print(f"  {qtype}: {len(queries)} variants")

    return result


async def test_focused_generation():
    """Test generation with specific focus type."""
    from team import QueryTeam

    print("\n" + "=" * 60)
    print("TEST: Focused Generation (seniority_focused)")
    print("=" * 60)

    team = QueryTeam()
    start = datetime.now()

    result = await team.generate(
        input_text="VP Sales London enterprise software",
        count=8,
        focus="seniority_focused",
        max_generations=2,
        debug=True,
    )

    elapsed = (datetime.now() - start).total_seconds()

    print(f"\nCompleted in {elapsed:.1f} seconds")
    print(f"Final Average Score: {result.final_average_score:.2f}")

    # Check that seniority_focused queries are well-represented
    seniority_queries = result.get_queries_by_type("seniority_focused")
    print(f"\nSeniority-focused queries: {len(seniority_queries)}")
    for q in seniority_queries[:3]:
        print(f"  Score {q.total_score:.1f}: {q.query[:70]}...")

    return result


async def main():
    """Run all tests."""
    print("Multi-Agent Query Team Test Suite")
    print("=" * 60)

    if not check_environment():
        sys.exit(1)

    try:
        # Test 1: Single generation
        await test_single_generation()

        # Test 2: Multi-generation
        await test_multi_generation()

        # Test 3: Focused generation
        await test_focused_generation()

        print("\n" + "=" * 60)
        print("ALL TESTS COMPLETED SUCCESSFULLY")
        print("=" * 60)

    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
