"""Test the simplified QueryGenerator."""

import asyncio
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from generator import QueryGenerator, QueryValidationError


async def test_basic_generation():
    """Test basic query generation."""
    print("=" * 60)
    print("Testing QueryGenerator")
    print("=" * 60)

    gen = QueryGenerator()

    # Test with sample input
    input_text = "CEO Jakarta fintech"
    count = 5

    print(f"\nInput: {input_text}")
    print(f"Count: {count}")
    print("-" * 60)

    result = await gen.generate(input_text, count=count, debug=True)

    print(f"\nGenerated {len(result.queries)} queries:\n")
    for i, query in enumerate(result.queries, 1):
        print(f"{i}. {query}\n")

    if result.meta:
        print("-" * 60)
        print("Metadata:")
        for k, v in result.meta.items():
            print(f"  {k}: {v}")

    # Verify output
    assert len(result.queries) == count, f"Expected {count} queries, got {len(result.queries)}"
    assert all("site:linkedin.com/in" in q for q in result.queries), "All queries should target LinkedIn"
    assert result.input == input_text, "Input should match"

    print("\n" + "=" * 60)
    print("All tests passed!")
    print("=" * 60)


async def test_validation():
    """Test input validation."""
    print("\nTesting validation...")

    gen = QueryGenerator()

    # Test empty input
    try:
        await gen.generate("")
        assert False, "Should have raised validation error"
    except QueryValidationError:
        print("  - Empty input validation: OK")

    # Test count out of range
    try:
        await gen.generate("test", count=50)
        assert False, "Should have raised validation error"
    except QueryValidationError:
        print("  - Count validation: OK")

    print("  Validation tests passed!")


def test_sync_wrapper():
    """Test synchronous wrapper."""
    print("\nTesting sync wrapper...")

    gen = QueryGenerator()
    result = gen.generate_sync("CTO Singapore AI startup", count=3)

    assert len(result.queries) == 3
    print(f"  Generated {len(result.queries)} queries synchronously: OK")


if __name__ == "__main__":
    # Check for API key
    if not os.getenv("ANTHROPIC_AUTH_TOKEN"):
        print("Warning: ANTHROPIC_AUTH_TOKEN not set. Tests will fail.")
        print("Set it with: export ANTHROPIC_AUTH_TOKEN=your_token")
        sys.exit(1)

    # Run async tests
    asyncio.run(test_basic_generation())
    asyncio.run(test_validation())
    test_sync_wrapper()
